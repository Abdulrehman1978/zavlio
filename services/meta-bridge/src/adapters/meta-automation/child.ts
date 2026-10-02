import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import {
  adapterJobSchema,
  childRequestSchema,
  planSchema,
  PREPARATION_TTL_MS,
  executionContractHash,
  sha256Content,
  type AdapterJob,
  type AdapterPlatform,
  type ChildRequest,
} from './contracts.js';
import { evidenceFor, redactLog } from './evidence.js';
import { getActionMapping } from './mapping.js';
import { isPlatformOrigin, validateCdpUrl, validatePlatformUrl } from './origin-policy.js';
import { classifySecurity } from './security.js';
import {
  SyntheticTargetProofProvider,
  type BoundControl,
  type TargetProofObservation,
} from './target-proof.js';

type Dialog = { type(): string; message(): string; dismiss(): Promise<void> };
type Snapshot = {
  url: string;
  title: string;
  bodyText: string;
  interactiveElements: Array<{
    id: number;
    name: string;
    text: string;
    editable: boolean;
    disabled: boolean;
  }>;
  activeDialogs: unknown[];
  targetProof: TargetProofObservation & {
    editorBinding: string | null;
    submitBinding: string | null;
  };
};
type Page = {
  url(): string;
  goto(url: string, options?: unknown): Promise<unknown>;
  on(event: 'dialog', listener: (dialog: Dialog) => void | Promise<void>): void;
  removeAllListeners(event: string): void;
  evaluate<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): Promise<T>;
};
type Browser = { pages(): Promise<Page[]>; newPage(): Promise<Page>; disconnect(): void };
type BrowserAgent = {
  captureLiveSnapshot(label?: string): Promise<Snapshot>;
  validatePlan(plan: unknown): true;
  executePlan(plan: unknown, correlationId: string): Promise<unknown>;
};
type DomElement = {
  getBoundingClientRect(): { width: number; height: number };
  getAttribute?(name: string): string | null;
  value?: unknown;
  textContent?: string | null;
};
type DomDocument = {
  querySelectorAll(selector: string): DomElement[];
  querySelector(selector: string): DomElement | null;
  body?: { querySelectorAll(selector: string): DomElement[] };
};
type HandlerResult = {
  status: string;
  result?: unknown;
  evidence?: Record<string, string | number | boolean | null>;
};

type PreparedState = {
  job: AdapterJob;
  platform: AdapterPlatform;
  executionContractHash: string;
  preparedAt: number;
  state: 'PREPARED' | 'EXECUTING';
};

let browser: Browser | null = null;
let page: Page | null = null;
let agent: BrowserAgent | null = null;
let upstreamLoaded = false;
let securityDialogLatched: { type: string; category: 'CONFIRMATION' | 'ALERT' } | null = null;
let activeOperation:
  'OBSERVE_PLATFORM' | 'PREPARE_ACTION' | 'EXECUTE_APPROVED_ACTION' | 'ABORT' | null = null;
let activeJobId: string | null = null;
let activeAbort: AbortController | null = null;
const prepared = new Map<string, PreparedState>();
const cancelledGenerations = new Map<string, number>();
let stopping = false;

const env = process.env;
const root = resolve(env.ZAVLIO_UPSTREAM_ROOT ?? '');
const runtime = resolve(env.ZAVLIO_ADAPTER_RUNTIME_DIR ?? '');
const testMode = env.ZAVLIO_ADAPTER_TEST_MODE === 'true';

function write(value: unknown) {
  process.stdout.write(JSON.stringify(value) + '\n');
}
function errorMessage(error: unknown): string {
  if (error instanceof Error && error.name === 'ZodError') return 'INVALID_JOB';
  const code = error instanceof Error ? error.message.split(':', 1)[0] : 'ADAPTER_ERROR';
  return (code ?? 'ADAPTER_ERROR').slice(0, 100);
}

function assertNotAborted(signal = activeAbort?.signal) {
  if (signal?.aborted && activeOperation) throw new Error('ABORTED');
  if (signal?.aborted) throw new Error('ABORTED');
}

function resetIndependentSecurityState() {
  securityDialogLatched = null;
}

function generationFor(jobId: string | undefined): number {
  return jobId ? (cancelledGenerations.get(jobId) ?? 0) : 0;
}

function isCancelled(jobId: string | undefined, generation: number): boolean {
  return stopping || (jobId ? generationFor(jobId) !== generation : false);
}

function assertQueueAllowed(jobId: string | undefined, generation: number) {
  if (isCancelled(jobId, generation)) throw new Error('ABORTED');
}

function assertSecurityDialogClear() {
  if (securityDialogLatched) throw new Error('SECURITY_CHECKPOINT');
}

function prunePrepared() {
  const cutoff = Date.now() - PREPARATION_TTL_MS;
  for (const [jobId, state] of prepared) if (state.preparedAt < cutoff) prepared.delete(jobId);
  while (prepared.size > 64) {
    const oldest = prepared.keys().next().value as string | undefined;
    if (!oldest) break;
    prepared.delete(oldest);
  }
}
function response(
  requestId: string,
  ok: boolean,
  status: string,
  result?: unknown,
  evidence?: Record<string, string | number | boolean | null>,
  error?: string,
) {
  write({
    ok,
    requestId,
    status,
    ...(result === undefined ? {} : { result }),
    ...(evidence ? { evidence } : {}),
    ...(error ? { error } : {}),
  });
}

// Upstream writes human logs through console; stdout is reserved for JSONL IPC.
console.log = (...args: unknown[]) => process.stderr.write(`${redactLog(args.join(' '))}\n`);
console.info = console.log;
console.warn = console.log;
console.error = console.log;

function loadUpstream() {
  if (upstreamLoaded) return;
  if (!root || !existsSync(join(root, 'package.json'))) throw new Error('NOT_INSTALLED');
  if (!testMode && existsSync(join(root, '.env'))) throw new Error('UNCONTROLLED_UPSTREAM_ENV');
  const require = createRequire(join(root, 'package.json'));
  const config = require(join(root, 'config', 'index.js')) as Record<string, unknown>;
  const runtimeBase = join(runtime, 'upstream');
  config.LOGS_DIR = join(runtimeBase, 'logs');
  config.STATE_FILE = join(runtimeBase, 'state.json');
  config.LEADS_FILE = join(runtimeBase, 'leads.json');
  config.LEADS_AI_FILE = join(runtimeBase, 'leads-ai.json');
  config.BACKUPS_DIR = join(runtimeBase, 'backups');
  config.PLATFORM_TARGET = '';
  // Deliberately require only the semantic browser agent. The upstream orchestration,
  // planning, identity, and follow-up modules are not loaded on this path.
  const upstream = require(join(root, 'src', 'agent', 'universal-browser-agent.js')) as {
    UniversalBrowserAgent: new (page: Page, platform: string) => BrowserAgent;
  };
  (globalThis as { UniversalBrowserAgent?: unknown }).UniversalBrowserAgent =
    upstream.UniversalBrowserAgent;
  upstreamLoaded = true;
}

function universalBrowserAgent(): new (page: Page, platform: string) => BrowserAgent {
  const constructor = (globalThis as { UniversalBrowserAgent?: unknown }).UniversalBrowserAgent;
  if (typeof constructor !== 'function') throw new Error('INSTALL_ERROR');
  return constructor as new (page: Page, platform: string) => BrowserAgent;
}

async function connect(platform: AdapterPlatform): Promise<Page> {
  loadUpstream();
  if (page && isPlatformOrigin(platform, page.url(), testMode)) return page;
  const cdp = validateCdpUrl(env.ZAVLIO_ADAPTER_CDP_URL ?? '');
  const require = createRequire(join(root, 'package.json'));
  const puppeteer = require('puppeteer-core') as {
    connect(options: { browserURL: string }): Promise<Browser>;
  };
  browser ??= await puppeteer.connect({ browserURL: cdp.toString() });
  const pages = await browser.pages();
  const matching = pages.filter((candidate) =>
    isPlatformOrigin(platform, candidate.url(), testMode),
  );
  page =
    matching[0] ?? (testMode ? await browser.newPage() : (pages[0] ?? (await browser.newPage())));
  page.removeAllListeners('dialog');
  page.on('dialog', async (dialog) => {
    securityDialogLatched = {
      type: dialog.type(),
      category: dialog.type() === 'confirm' ? 'CONFIRMATION' : 'ALERT',
    };
    await dialog.dismiss().catch(() => undefined);
  });
  agent = new (universalBrowserAgent())(page, platform.toLowerCase());
  return page;
}

async function snapshot(platform: AdapterPlatform): Promise<Snapshot> {
  const current = await connect(platform);
  const currentUrl = current.url();
  validatePlatformUrl(platform, currentUrl, testMode);
  if (!agent) throw new Error('CDP_UNAVAILABLE');
  const base = await agent.captureLiveSnapshot('zavlio-packet-15');
  const provider = new SyntheticTargetProofProvider(current, platform, testMode);
  const observed = await provider.observeTarget();
  const bindings = await current.evaluate(() => {
    const doc = (globalThis as unknown as { document: DomDocument }).document;
    return {
      editorBinding:
        doc.querySelector('[data-zavlio-editor-for]')?.getAttribute?.('data-zavlio-editor-for') ??
        null,
      submitBinding:
        doc.querySelector('[data-zavlio-submit-for]')?.getAttribute?.('data-zavlio-submit-for') ??
        null,
    };
  });
  return { ...base, targetProof: { ...observed, ...bindings } };
}

function targetKey(job: AdapterJob): string {
  return (
    job.targetIdentity.username ??
    job.targetIdentity.stableId ??
    job.targetIdentity.conversationId ??
    'target'
  );
}

async function targetMatched(job: AdapterJob, proof: Snapshot['targetProof']): Promise<boolean> {
  if (job.targetIdentity.profileUrl)
    validatePlatformUrl(job.channel, job.targetIdentity.profileUrl, testMode);
  if (!page) throw new Error('CDP_UNAVAILABLE');
  const provider = new SyntheticTargetProofProvider(page, job.channel, testMode);
  provider.verifyTarget(job, proof);
  return true;
}

async function buildPlan(job: AdapterJob) {
  const mapping = getActionMapping(job.channel, job.actionType);
  if (!mapping) throw new Error('UNSUPPORTED_ACTION');
  if (!page) throw new Error('CDP_UNAVAILABLE');
  const provider = new SyntheticTargetProofProvider(page, job.channel, testMode);
  const key = targetKey(job);
  const editor = mapping.contentRequired ? await provider.resolveEditorControl(key) : null;
  const submit = await provider.resolveSubmitControl(key, job.actionType);
  const steps = mapping.contentRequired
    ? [
        {
          type: 'TYPE_EXACT' as const,
          elementId: editor?.elementId ?? 0,
          binding: editor?.binding ?? 'editor:missing:missing',
          value: job.content,
        },
        {
          type: 'CLICK' as const,
          elementId: submit.elementId,
          binding: submit.binding,
        },
      ]
    : [
        {
          type: 'CLICK' as const,
          elementId: submit.elementId,
          binding: submit.binding,
        },
      ];
  return planSchema.parse({
    status: 'READY',
    reason: 'Fixed Zavlio action; no business planning performed.',
    steps,
  });
}

async function assertBinding(binding: string): Promise<BoundControl> {
  if (!page) throw new Error('CDP_UNAVAILABLE');
  return new SyntheticTargetProofProvider(page, 'THREADS', testMode).resolveBoundControl(binding);
}

async function editorValue(binding: string): Promise<string> {
  if (!page) return '';
  const resolved = await new SyntheticTargetProofProvider(
    page,
    'THREADS',
    testMode,
  ).resolveBoundControl(binding);
  return page.evaluate((expected) => {
    const doc = (globalThis as unknown as { document: DomDocument }).document;
    const elements = Array.from(doc.querySelectorAll('[data-zavlio-editor-for]')).filter(
      (element) => String(element.getAttribute?.('data-zavlio-control-id') ?? '') === expected,
    );
    const visible = elements.find((element) => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    return visible
      ? ((visible.value !== undefined ? String(visible.value) : visible.textContent) ?? '')
      : '';
  }, resolved.semanticId);
}

async function fixtureActionLog(): Promise<string[]> {
  if (!page) return [];
  return page.evaluate(() => {
    const doc = (globalThis as unknown as { document: DomDocument }).document;
    return Array.from(doc.body?.querySelectorAll('[data-zavlio-action-log]') ?? [])
      .map((element) => (element.textContent ?? '').trim())
      .filter(Boolean);
  });
}

async function prepare(job: AdapterJob) {
  const start = Date.now();
  prunePrepared();
  assertNotAborted();
  resetIndependentSecurityState();
  const current = await snapshot(job.channel);
  assertNotAborted();
  const security = classifySecurity(current, job.channel);
  if (security.state !== 'KNOWN_SAFE_NO_SIGNAL')
    return {
      status: 'MANUAL_ACTION_REQUIRED',
      result: { reason: security.reason, securityState: security.state },
      evidence: evidenceFor(job, {
        origin: current.url,
        securityState: security.state,
        planStatus: 'STOPPED',
        result: 'MANUAL_ACTION_REQUIRED',
        durationMs: Date.now() - start,
      }),
    };
  await targetMatched(job, current.targetProof);
  const plan = await buildPlan(job);
  const contract = executionContractHash(job);
  prepared.set(job.jobId, {
    job,
    platform: job.channel,
    executionContractHash: contract,
    preparedAt: Date.now(),
    state: 'PREPARED',
  });
  return {
    status: 'READY_TO_SUBMIT',
    result: {
      planStatus: plan.status,
      steps: plan.steps.length,
      targetIdentityMatched: true,
      origin: current.url,
      executionContractHash: contract,
    },
    evidence: evidenceFor(job, {
      origin: current.url,
      securityState: security.state,
      planStatus: plan.status,
      result: 'READY_TO_SUBMIT',
      targetIdentityMatched: true,
      durationMs: Date.now() - start,
    }),
  };
}

async function execute(job: AdapterJob) {
  const start = Date.now();
  prunePrepared();
  const state = prepared.get(job.jobId);
  if (!state) throw new Error('PREPARATION_REQUIRED');
  if (Date.now() - state.preparedAt > PREPARATION_TTL_MS) {
    prepared.delete(job.jobId);
    throw new Error('PREPARATION_EXPIRED');
  }
  const contract = executionContractHash(job);
  if (state.executionContractHash !== contract) throw new Error('PREPARED_JOB_MISMATCH');
  if (state.state !== 'PREPARED') throw new Error('PREPARATION_CONSUMED');
  state.state = 'EXECUTING';
  if (!testMode)
    return finalizeExecution(job, {
      status: 'SAFE_PRECOMMIT_DRY_RUN',
      result: { planStatus: 'DRY_RUN_PLANNED', sideEffect: false },
      evidence: evidenceFor(job, {
        planStatus: 'DRY_RUN_PLANNED',
        result: 'SAFE_PRECOMMIT_DRY_RUN',
        durationMs: Date.now() - start,
      }),
    });
  const current = await snapshot(job.channel);
  assertNotAborted();
  await targetMatched(job, current.targetProof);
  if (!agent) throw new Error('CDP_UNAVAILABLE');
  const plan = await buildPlan(job);
  if (job.contentHash && sha256Content(job.content ?? '') !== job.contentHash)
    throw new Error('CONTENT_HASH_MISMATCH');
  for (const step of plan.steps) {
    assertNotAborted();
    assertSecurityDialogClear();
    if (!step.binding) throw new Error('UNVERIFIED');
    const bound = await assertBinding(step.binding);
    assertNotAborted();
    const action =
      step.type === 'TYPE_EXACT'
        ? { type: 'TYPE', target: { elementId: bound.elementId }, value: job.content, clear: true }
        : { type: 'CLICK', target: { elementId: bound.elementId } };
    agent.validatePlan({ actions: [action] });
    await agent.executePlan({ actions: [action] }, `zavlio-${job.jobId}`);
    assertNotAborted();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
    const observedDialog = securityDialogLatched;
    if (observedDialog)
      return finalizeExecution(job, {
        status: 'MANUAL_ACTION_REQUIRED',
        result: {
          reason: 'Browser dialog dismissed; no confirmation accepted.',
          dialogType: observedDialog.type,
          dialogCategory: observedDialog.category,
        },
        evidence: evidenceFor(job, {
          origin: page?.url(),
          securityState: 'KNOWN_SECURITY_SIGNAL',
          planStatus: 'STOPPED',
          targetIdentityMatched: true,
          result: 'MANUAL_ACTION_REQUIRED',
          durationMs: Date.now() - start,
        }),
      });
    if (step.type === 'TYPE_EXACT' && (await editorValue(step.binding)) !== job.content)
      throw new Error('CONTENT_HASH_MISMATCH');
  }
  assertNotAborted();
  const log = await fixtureActionLog();
  const marker = `${job.actionType}:${job.targetIdentity.username ?? job.targetIdentity.stableId ?? 'target'}`;
  const verified = log.filter((entry) => entry === marker).length === 1;
  return finalizeExecution(job, {
    status: verified ? 'VERIFIED_SUCCESS' : 'UNVERIFIED',
    result: {
      verification: verified ? 'VERIFIED_SUCCESS' : 'OUTCOME_UNKNOWN',
      actionLogCount: log.length,
      sideEffect: true,
    },
    evidence: evidenceFor(job, {
      origin: page?.url(),
      securityState: 'KNOWN_SAFE_NO_SIGNAL',
      planStatus: 'READY',
      targetIdentityMatched: true,
      result: verified ? 'VERIFIED_SUCCESS' : 'OUTCOME_UNKNOWN',
      verification: verified ? 'VERIFIED_SUCCESS' : 'OUTCOME_UNKNOWN',
      durationMs: Date.now() - start,
    }),
  });
}

function finalizeExecution<T extends HandlerResult>(job: AdapterJob, result: T): T {
  prepared.delete(job.jobId);
  securityDialogLatched = null;
  return result;
}

async function handle(request: ChildRequest): Promise<HandlerResult> {
  if (request.operation === 'INIT') {
    loadUpstream();
    const forbidden = [
      'ZAVLIO_MACHINE_HMAC_SECRET',
      'AUTOMATION_MACHINE_KEYS_JSON',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SMTP_PASSWORD',
      'TURNSTILE_SECRET_KEY',
      'SUPABASE_JWT_SECRET',
    ].filter((key) => Boolean(env[key]));
    if (forbidden.length) throw new Error('FORBIDDEN_SECRET_IN_CHILD');
    return {
      status: 'READY',
      result: {
        adapterVersion: '15.0.0',
        upstreamSha: '439c3bfaacb1caabef25a7d67c3f204916a5a168',
        processModel: 'ISOLATED_CHILD',
        forbiddenEnvPresent: false,
      },
    };
  }
  if (request.operation === 'HEALTH')
    return {
      status: agent ? 'READY' : 'CDP_UNAVAILABLE',
      result: { adapterVersion: '15.0.0', upstreamSha: '439c3bfaacb1caabef25a7d67c3f204916a5a168' },
    };
  if (request.operation === 'ABORT') {
    const payload = request.payload as { jobId?: string } | undefined;
    const jobId = request.jobId ?? payload?.jobId;
    if (jobId) cancelledGenerations.set(jobId, generationFor(jobId) + 1);
    if (jobId && activeJobId === jobId) activeAbort?.abort();
    if (jobId) prepared.delete(jobId);
    return { status: 'ABORTED', result: { jobId: jobId ?? null } };
  }
  if (request.operation === 'STOP') {
    stopping = true;
    activeAbort?.abort();
    prepared.clear();
    browser?.disconnect();
    browser = null;
    page = null;
    agent = null;
    return { status: 'STOPPED' };
  }
  if (request.operation === 'OBSERVE_PLATFORM') {
    const payload = request.payload as { channel?: AdapterPlatform } | undefined;
    if (!payload?.channel) throw new Error('INVALID_PLATFORM');
    const current = await snapshot(payload.channel);
    return {
      status: 'READ_ONLY_OBSERVED',
      result: {
        origin: current.url,
        title: current.title,
        securityState: classifySecurity(current, payload.channel).state,
      },
    };
  }
  const job = adapterJobSchema.parse(request.payload);
  if (
    (request.operation === 'PREPARE_ACTION' || request.operation === 'EXECUTE_APPROVED_ACTION') &&
    (request.jobId !== job.jobId || request.jobVersion !== job.jobVersion)
  )
    throw new Error('REQUEST_JOB_MISMATCH');
  if (request.operation === 'PREPARE_ACTION') return prepare(job);
  if (request.operation === 'EXECUTE_APPROVED_ACTION') return execute(job);
  throw new Error('UNSUPPORTED_OPERATION');
}

let criticalTail = Promise.resolve();

async function processLine(line: string) {
  let requestId = '00000000-0000-4000-8000-000000000000';
  try {
    const parsed = childRequestSchema.parse(JSON.parse(line));
    requestId = parsed.requestId;
    const isAbort = parsed.operation === 'ABORT';
    if (parsed.operation === 'STOP') {
      stopping = true;
      activeAbort?.abort();
      prepared.clear();
    }
    if (parsed.operation === 'STOP') {
      criticalTail = criticalTail.then(async () => {
        try {
          const result = await handle(parsed);
          response(requestId, true, result.status, result.result, result.evidence);
        } catch (error) {
          response(requestId, false, 'ERROR', undefined, undefined, errorMessage(error));
        }
      });
      await criticalTail;
      return;
    }
    if (!isAbort) {
      const queuedJobId = parsed.jobId;
      const queuedGeneration = generationFor(queuedJobId);
      criticalTail = criticalTail.then(async () => {
        const operation = parsed.operation;
        if (isCancelled(queuedJobId, queuedGeneration)) {
          response(requestId, false, 'ERROR', undefined, undefined, 'ABORTED');
          return;
        }
        activeOperation =
          operation === 'HEALTH' || operation === 'INIT' || operation === 'STOP' ? null : operation;
        activeJobId = parsed.jobId ?? null;
        activeAbort = new AbortController();
        try {
          assertQueueAllowed(queuedJobId, queuedGeneration);
          const result = await handle(parsed);
          response(requestId, true, result.status, result.result, result.evidence);
        } catch (error) {
          response(requestId, false, 'ERROR', undefined, undefined, errorMessage(error));
        } finally {
          if (operation === 'EXECUTE_APPROVED_ACTION' || operation === 'ABORT') {
            if (parsed.jobId) prepared.delete(parsed.jobId);
          }
          activeOperation = null;
          activeJobId = null;
          activeAbort = null;
        }
      });
      await criticalTail;
      return;
    }
    const result = await handle(parsed);
    response(requestId, true, result.status, result.result, result.evidence);
  } catch (error) {
    response(requestId, false, 'ERROR', undefined, undefined, errorMessage(error));
  }
}

const lines = createInterface({ input: process.stdin });
lines.on('line', (line) => void processLine(line));

process.once('SIGTERM', () => {
  activeAbort?.abort();
  prepared.clear();
  browser?.disconnect();
  process.exit(0);
});
process.once('SIGINT', () => {
  activeAbort?.abort();
  prepared.clear();
  browser?.disconnect();
  process.exit(0);
});
