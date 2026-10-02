import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface, type Interface } from 'node:readline';
import { resolve } from 'node:path';
import {
  childResponseSchema,
  type AdapterJob,
  type ChildRequest,
  type ChildResponse,
  adapterJobSchema,
  executionContractHash,
  PREPARATION_TTL_MS,
} from './contracts.js';
import { evidenceFor, redactLog } from './evidence.js';
import { verifyUpstreamPin, type PinVerification } from './pin.js';

export type AdapterStatus =
  | 'NOT_INSTALLED'
  | 'PIN_MISMATCH'
  | 'INSTALL_ERROR'
  | 'READY'
  | 'CDP_UNAVAILABLE'
  | 'AI_RUNTIME_UNAVAILABLE'
  | 'AUTH_REQUIRED'
  | 'SECURITY_PAUSED'
  | 'DEGRADED';
export type AdapterHealth = Readonly<{
  status: AdapterStatus;
  adapterVersion: string;
  upstreamSha: string;
  upstreamPackageVersion: string;
  childPid: number | null;
  processModel: 'ISOLATED_CHILD';
}>;

type ChildOptions = Readonly<{
  upstreamRoot: string;
  runtimeDir: string;
  cdpUrl: string;
  testMode: boolean;
  requestTimeoutMs: number;
  env: NodeJS.ProcessEnv;
}>;

const allowedEnvKeys = [
  'PATH',
  'Path',
  'SystemRoot',
  'WINDIR',
  'ComSpec',
  'TEMP',
  'TMP',
  'HOME',
  'USERPROFILE',
  'DISPLAY',
  'NODE_ENV',
  'BROWSER_TYPE',
  'CDP_URL',
  'THREADS_CDP_URL',
  'AI_PROVIDER',
  'AI_RUNTIME',
  'AI_MODEL',
  'ANTIGRAVITY_CLI_BIN',
  'ANTIGRAVITY_CLI_PATH',
  'ANTIGRAVITY_MODEL',
  'ANTIGRAVITY_EFFORT',
  'ANTIGRAVITY_TIMEOUT_MS',
];

export function buildChildEnv(options: ChildOptions): NodeJS.ProcessEnv {
  const child: NodeJS.ProcessEnv = {};
  for (const key of allowedEnvKeys)
    if (options.env[key] !== undefined) child[key] = options.env[key];
  child.NODE_ENV = options.testMode ? 'test' : 'production';
  child.ZAVLIO_UPSTREAM_ROOT = resolve(options.upstreamRoot);
  child.ZAVLIO_ADAPTER_RUNTIME_DIR = resolve(options.runtimeDir);
  child.ZAVLIO_ADAPTER_TEST_MODE = options.testMode ? 'true' : 'false';
  child.ZAVLIO_ADAPTER_CDP_URL = options.cdpUrl;
  child.DRY_RUN = 'true';
  child.APPROVAL_MODE = 'true';
  child.POSTING_ENABLED = 'false';
  child.JOB_AUTOMATION_ENABLED = 'false';
  child.PLATFORM_TARGET = '';
  return child;
}

class IsolatedChild {
  private child: ChildProcessWithoutNullStreams | null = null;
  private lines: Interface | null = null;
  private pending = new Map<
    string,
    {
      resolve: (value: ChildResponse) => void;
      reject: (error: Error) => void;
      timer: NodeJS.Timeout;
    }
  >();
  private stderr = '';
  private exitWaiters: Array<() => void> = [];
  constructor(
    private readonly options: ChildOptions,
    private readonly entry = fileURLToPath(new URL('./child.js', import.meta.url)),
  ) {}

  get pid(): number | null {
    return this.child?.pid ?? null;
  }

  async start(): Promise<void> {
    if (this.child) return;
    if (!existsSync(this.entry))
      throw new Error('INSTALL_ERROR: compiled adapter child is missing');
    this.child = spawn(process.execPath, [this.entry], {
      cwd: resolve(this.options.runtimeDir),
      env: buildChildEnv(this.options),
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.lines = createInterface({ input: this.child.stdout });
    this.lines.on('line', (line) => this.onLine(line));
    this.child.stderr.on('data', (chunk) => {
      this.stderr = (this.stderr + redactLog(chunk.toString())).slice(-2000);
    });
    this.child.once('exit', (code, signal) => {
      const error = new Error(
        `Adapter child exited (${code ?? 'null'}/${signal ?? 'none'}): ${this.stderr.slice(-500)}`,
      );
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(error);
      }
      this.pending.clear();
      this.lines?.close();
      this.lines = null;
      this.child = null;
      for (const resolveExit of this.exitWaiters) resolveExit();
      this.exitWaiters = [];
    });
    const response = await this.call('INIT', undefined, 5000);
    if (!response.ok) throw new Error(response.error ?? 'Adapter child initialization failed');
  }

  private onLine(line: string) {
    try {
      const response = childResponseSchema.parse(JSON.parse(line));
      const pending = this.pending.get(response.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(response.requestId);
      pending.resolve(response);
    } catch {
      // stdout is reserved for structured IPC; malformed upstream output is a child failure.
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Invalid adapter IPC response'));
      }
      this.pending.clear();
    }
  }

  call(
    operation: ChildRequest['operation'],
    payload: unknown,
    timeoutMs = this.options.requestTimeoutMs,
    jobId?: string,
    jobVersion?: number,
  ): Promise<ChildResponse> {
    if (!this.child?.stdin.writable)
      return Promise.reject(new Error('Adapter child is not running'));
    const request: ChildRequest = {
      requestId: randomUUID(),
      operation,
      ...(jobId ? { jobId } : {}),
      ...(jobVersion ? { jobVersion } : {}),
      ...(payload === undefined ? {} : { payload }),
    };
    return new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        void this.handleTimeout(request, reject);
      }, timeoutMs);
      this.pending.set(request.requestId, { resolve: resolvePromise, reject, timer });
      this.child?.stdin.write(JSON.stringify(request) + '\n', (error) => {
        if (error) {
          clearTimeout(timer);
          this.pending.delete(request.requestId);
          reject(error);
        }
      });
    });
  }

  private async handleTimeout(request: ChildRequest, reject: (error: Error) => void) {
    const pending = this.pending.get(request.requestId);
    if (!pending) return;
    if (
      request.jobId &&
      (request.operation === 'EXECUTE_APPROVED_ACTION' || request.operation === 'PREPARE_ACTION')
    ) {
      const abortRequest: ChildRequest = {
        requestId: randomUUID(),
        operation: 'ABORT',
        jobId: request.jobId,
        payload: { jobId: request.jobId },
      };
      try {
        this.child?.stdin.write(JSON.stringify(abortRequest) + '\n');
      } catch {
        /* termination below is authoritative */
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
    }
    if (this.pending.has(request.requestId)) {
      this.pending.delete(request.requestId);
      clearTimeout(pending.timer);
      await this.terminate();
      reject(new Error('ADAPTER_TIMEOUT'));
    }
  }

  private async terminate(): Promise<void> {
    const child = this.child;
    if (!child) return;
    child.kill('SIGTERM');
    await new Promise((resolvePromise) => {
      const timer = setTimeout(resolvePromise, 500);
      this.exitWaiters.push(() => {
        clearTimeout(timer);
        resolvePromise(undefined);
      });
    });
    if (this.child === child) child.kill();
  }

  async stop(): Promise<void> {
    if (!this.child) return;
    try {
      await this.call('STOP', undefined, 2000);
    } catch {
      /* bounded shutdown */
    }
    await this.terminate();
  }
}

export class MetaAutomationAdapter {
  private readonly child: IsolatedChild;
  private pin: PinVerification | null = null;
  private state: AdapterStatus = 'NOT_INSTALLED';
  private prepared = new Map<
    string,
    { job: AdapterJob; contractHash: string; preparedAt: number }
  >();
  constructor(
    private readonly options: {
      upstreamRoot: string;
      runtimeDir: string;
      cdpUrl: string;
      testMode: boolean;
      requestTimeoutMs: number;
      env?: NodeJS.ProcessEnv;
    },
  ) {
    this.child = new IsolatedChild({ ...options, env: options.env ?? process.env });
  }
  health(): AdapterHealth {
    return {
      status: this.state,
      adapterVersion: '15.0.0',
      upstreamSha: '439c3bfaacb1caabef25a7d67c3f204916a5a168',
      upstreamPackageVersion: '2.0.0',
      childPid: this.child.pid,
      processModel: 'ISOLATED_CHILD',
    };
  }
  pinVerification(): PinVerification | null {
    return this.pin;
  }
  async initialize(): Promise<void> {
    this.prepared.clear();
    this.pin = verifyUpstreamPin(this.options.upstreamRoot);
    if (!this.pin.ok) {
      this.state = 'PIN_MISMATCH';
      throw new Error(this.pin.reason ?? 'PIN_MISMATCH');
    }
    await this.child.start();
    this.state = 'READY';
  }
  async prepare(job: unknown): Promise<ChildResponse> {
    const parsed = adapterJobSchema.parse(job);
    let response: ChildResponse;
    try {
      response = await this.child.call(
        'PREPARE_ACTION',
        parsed,
        this.options.requestTimeoutMs,
        parsed.jobId,
        parsed.jobVersion,
      );
    } catch (error) {
      this.prepared.clear();
      throw error;
    }
    if (response.ok && response.status === 'READY_TO_SUBMIT') {
      this.prepared.set(parsed.jobId, {
        job: parsed,
        contractHash: executionContractHash(parsed),
        preparedAt: Date.now(),
      });
    }
    return response;
  }
  async execute(job: unknown): Promise<ChildResponse> {
    const parsed = adapterJobSchema.parse(job);
    const state = this.prepared.get(parsed.jobId);
    if (!state) throw new Error('PREPARATION_REQUIRED');
    if (Date.now() - state.preparedAt > PREPARATION_TTL_MS) {
      this.prepared.delete(parsed.jobId);
      throw new Error('PREPARATION_EXPIRED');
    }
    if (state.contractHash !== executionContractHash(parsed))
      throw new Error('PREPARED_JOB_MISMATCH');
    this.prepared.delete(parsed.jobId);
    try {
      return await this.child.call(
        'EXECUTE_APPROVED_ACTION',
        parsed,
        this.options.requestTimeoutMs,
        parsed.jobId,
        parsed.jobVersion,
      );
    } catch (error) {
      this.prepared.clear();
      throw error;
    } finally {
      this.prepared.delete(parsed.jobId);
    }
  }
  async abort(jobId: string): Promise<void> {
    try {
      await this.child.call('ABORT', { jobId }, 2000, jobId);
    } finally {
      this.prepared.delete(jobId);
    }
  }
  async shutdown(): Promise<void> {
    this.prepared.clear();
    await this.child.stop();
    this.state = 'DEGRADED';
  }
  static evidence(job: AdapterJob, response: ChildResponse) {
    return evidenceFor(job, {
      ...(typeof response.result === 'object' && response.result
        ? (response.result as Record<string, unknown>)
        : {}),
      result: response.status,
    });
  }
}
