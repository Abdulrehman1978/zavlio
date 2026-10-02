import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import {
  MACHINE_ENDPOINT_PREFIX,
  PACKET_14_CAPABILITIES,
  PACKET_15_CAPABILITIES,
  type MachineCapabilities,
} from '@zavlio/automation/protocol';
import { createLogger, type Logger } from '@zavlio/config';
import {
  MetaAutomationAdapter,
  adapterJobSchema,
  type AdapterHealth,
} from './adapters/meta-automation/index.js';
import { MachineClient } from './client.js';
import type { BridgeEnv } from './env.js';
import { createSocialProviders } from './social/index.js';

type Job = {
  jobId: string;
  jobVersion: number;
  leaseExpiresAt: string;
  policyVersion: number;
  dryRun: boolean;
  channel: string;
  actionType: string;
  payload: Record<string, unknown>;
  contentHash: string;
};
type Health = {
  status: 'starting' | 'ready' | 'degraded' | 'stopping';
  bridgeVersion: string;
  protocolVersion: 1;
  agentKey: string;
  instanceId: string;
  controlPlaneConnected: boolean;
  lastHandshake: string | null;
  lastHeartbeat: string | null;
  lastClaimAttempt: string | null;
  clockSkewMs: number;
  executorMode: 'DRY_RUN_ONLY';
  inFlightJobs: number;
  adapter: AdapterHealth | null;
  socialProviders: Record<
    'THREADS' | 'FACEBOOK' | 'LINKEDIN',
    { version: string; readiness: 'PROVIDER_IMPLEMENTED'; liveExecutionEnabled: false }
  >;
};
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid machine response');
  return value as Record<string, unknown>;
}

export interface BridgeRuntime {
  health(): Readonly<Health>;
  start(): Promise<void>;
  stop(): Promise<void>;
  runOnce(): Promise<boolean>;
}
export function createBridgeRuntime(options: {
  env: BridgeEnv;
  logger?: Logger;
  client?: MachineClient;
}): BridgeRuntime {
  const { env } = options;
  const logger = options.logger ?? createLogger('meta-bridge');
  const client = options.client ?? new MachineClient(env);
  const adapter = env.ZAVLIO_META_ADAPTER_ENABLED
    ? new MetaAutomationAdapter({
        upstreamRoot: env.ZAVLIO_META_ADAPTER_UPSTREAM_ROOT,
        runtimeDir: env.ZAVLIO_META_ADAPTER_RUNTIME_DIR,
        cdpUrl: env.ZAVLIO_META_ADAPTER_CDP_URL,
        testMode: env.ZAVLIO_META_ADAPTER_TEST_MODE,
        requestTimeoutMs: env.ZAVLIO_META_ADAPTER_REQUEST_TIMEOUT_MS,
        env: process.env,
      })
    : null;
  const socialProviders = createSocialProviders();
  const capabilities = (env.ZAVLIO_META_ADAPTER_ENABLED
    ? PACKET_15_CAPABILITIES
    : PACKET_14_CAPABILITIES) as unknown as MachineCapabilities;
  const instanceId = randomUUID(),
    startedAt = new Date(),
    controller = new AbortController();
  let server: Server | undefined,
    heartbeatLoop: Promise<void> | undefined,
    pollLoop: Promise<void> | undefined,
    inFlight = 0;
  const state: Health = {
    status: 'starting',
    bridgeVersion: env.ZAVLIO_BRIDGE_VERSION,
    protocolVersion: 1,
    agentKey: env.ZAVLIO_AGENT_KEY,
    instanceId,
    controlPlaneConnected: false,
    lastHandshake: null,
    lastHeartbeat: null,
    lastClaimAttempt: null,
    clockSkewMs: 0,
    executorMode: 'DRY_RUN_ONLY',
    inFlightJobs: 0,
    adapter: adapter?.health() ?? null,
    socialProviders: {
      THREADS: {
        version: socialProviders.THREADS.version,
        readiness: 'PROVIDER_IMPLEMENTED',
        liveExecutionEnabled: false,
      },
      FACEBOOK: {
        version: socialProviders.FACEBOOK.version,
        readiness: 'PROVIDER_IMPLEMENTED',
        liveExecutionEnabled: false,
      },
      LINKEDIN: {
        version: socialProviders.LINKEDIN.version,
        readiness: 'PROVIDER_IMPLEMENTED',
        liveExecutionEnabled: false,
      },
    },
  };
  const post = (path: string, payload: unknown) =>
    client.post(MACHINE_ENDPOINT_PREFIX + path, payload);
  const heartbeat = async () => {
    await post('/heartbeat', {
      operationId: randomUUID(),
      instanceId,
      bridgeVersion: env.ZAVLIO_BRIDGE_VERSION,
      protocolVersion: 1,
      uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      executorMode: 'DRY_RUN_ONLY',
      capabilities,
      activeJobs: inFlight,
      runtimeState: {
        status: state.status,
        adapterStatus: adapter?.health().status ?? 'NOT_INSTALLED',
        adapterVersion: adapter?.health().adapterVersion ?? null,
        upstreamSha: adapter?.health().upstreamSha ?? null,
        upstreamPackageVersion: adapter?.health().upstreamPackageVersion ?? null,
        processModel: adapter?.health().processModel ?? null,
      },
    });
    state.lastHeartbeat = new Date().toISOString();
    state.controlPlaneConnected = true;
  };
  const result = async (
    job: Job,
    resultType: string,
    failureCode: string | null = null,
    evidence: Record<string, string | number | boolean | null> = {
      executor: 'PACKET14_NOOP',
      dryRun: true,
      verification: 'no-external-side-effect',
    },
  ) =>
    post(`/jobs/${job.jobId}/result`, {
      operationId: randomUUID(),
      instanceId,
      expectedJobVersion: job.jobVersion,
      resultType,
      dryRun: true,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      evidence,
      failureCode,
      failureSummary: failureCode ? 'Packet 14 simulated result' : null,
      retryAfter: null,
    });
  const runOnce = async () => {
    state.lastClaimAttempt = new Date().toISOString();
    const claim = object(
      (await post('/claim', { operationId: randomUUID(), instanceId, maxJobs: 1 })).data,
    );
    if (claim.status === 'NO_JOB') return false;
    const job = object(claim.job) as unknown as Job;
    const internal = job.channel === 'INTERNAL' && job.actionType === 'NOOP';
    const social =
      ['THREADS', 'FACEBOOK', 'LINKEDIN'].includes(job.channel) && job.actionType !== 'NOOP';
    if (!job.dryRun || (!internal && (!social || !adapter)))
      throw new Error(
        'Bridge refuses live or external action: unsupported or unconfigured external action.',
      );
    inFlight += 1;
    state.inFlightJobs = inFlight;
    let adapterPreparationJobId: string | null = null;
    try {
      const lease = object(
        (
          await post(`/jobs/${job.jobId}/lease`, {
            operationId: randomUUID(),
            instanceId,
            expectedJobVersion: job.jobVersion,
            expectedLeaseExpiresAt: job.leaseExpiresAt,
          })
        ).data,
      );
      job.jobVersion = Number(lease.jobVersion);
      job.leaseExpiresAt = String(lease.leaseExpiresAt);
      let preparedResponse: Awaited<ReturnType<MetaAutomationAdapter['prepare']>> | null = null;
      let preparationError: Error | null = null;
      if (social && adapter) {
        try {
          const payload = job.payload;
          const adapterJob = adapterJobSchema.parse({
            jobId: job.jobId,
            jobVersion: job.jobVersion,
            attemptNumber: Number(payload.attemptNumber ?? 1),
            channel: job.channel,
            actionType: job.actionType,
            personId: typeof payload.personId === 'string' ? payload.personId : undefined,
            purpose: typeof payload.purpose === 'string' ? payload.purpose : 'RELATIONSHIP',
            dryRun: true,
            targetIdentity: payload.targetIdentity,
            content:
              typeof payload.content === 'string'
                ? payload.content
                : typeof payload.text === 'string'
                  ? payload.text
                  : undefined,
            contentHash: typeof payload.contentHash === 'string' ? payload.contentHash : undefined,
            profileUrl: typeof payload.profileUrl === 'string' ? payload.profileUrl : undefined,
            payload,
          });
          adapterPreparationJobId = adapterJob.jobId;
          preparedResponse = await adapter.prepare(adapterJob);
        } catch (error) {
          preparationError =
            error instanceof Error ? error : new Error('Adapter preparation failed');
        }
      }
      const start = object(
        (
          await post(`/jobs/${job.jobId}/start`, {
            operationId: randomUUID(),
            instanceId,
            expectedJobVersion: job.jobVersion,
            contentHash: job.contentHash,
            policyVersion: job.policyVersion,
            expectedLeaseExpiresAt: job.leaseExpiresAt,
          })
        ).data,
      );
      if (start.status !== 'RUNNING') return true;
      job.jobVersion = Number(start.jobVersion);
      if (internal) {
        const simulation =
          typeof job.payload.simulation === 'string' ? job.payload.simulation : 'SUCCESS';
        if (simulation === 'SECURITY_CHECKPOINT')
          await result(job, 'MANUAL_ACTION_REQUIRED', 'SECURITY_CHECKPOINT');
        else if (simulation === 'UNKNOWN_OUTCOME')
          await result(job, 'UNKNOWN_OUTCOME', 'EXECUTION_OUTCOME_UNKNOWN');
        else if (simulation === 'TRANSIENT_FAILURE')
          await result(job, 'TRANSIENT_FAILURE', 'TRANSIENT_NETWORK');
        else await result(job, 'SUCCESS');
      } else if (
        adapter &&
        preparedResponse &&
        !preparationError &&
        preparedResponse.ok &&
        preparedResponse.status === 'READY_TO_SUBMIT'
      ) {
        const payload = job.payload;
        const adapterJob = adapterJobSchema.parse({
          jobId: job.jobId,
          jobVersion: job.jobVersion,
          attemptNumber: Number(payload.attemptNumber ?? 1),
          channel: job.channel,
          actionType: job.actionType,
          personId: typeof payload.personId === 'string' ? payload.personId : undefined,
          purpose: typeof payload.purpose === 'string' ? payload.purpose : 'RELATIONSHIP',
          dryRun: true,
          targetIdentity: payload.targetIdentity,
          content:
            typeof payload.content === 'string'
              ? payload.content
              : typeof payload.text === 'string'
                ? payload.text
                : undefined,
          contentHash: typeof payload.contentHash === 'string' ? payload.contentHash : undefined,
          profileUrl: typeof payload.profileUrl === 'string' ? payload.profileUrl : undefined,
          payload,
        });
        // Packet 14 start increments the job version. Re-prepare after the
        // signed start so the executable contract is bound to the leased,
        // policy-revalidated version rather than the preflight version.
        const finalPreparation = await adapter.prepare(adapterJob);
        if (!finalPreparation.ok || finalPreparation.status !== 'READY_TO_SUBMIT') {
          await result(job, 'MANUAL_ACTION_REQUIRED', 'SECURITY_CHECKPOINT', {
            executor: 'PACKET15_ADAPTER',
            dryRun: true,
            verification: 'preparation-blocked-after-start',
          });
          return true;
        }
        let execution: Awaited<ReturnType<MetaAutomationAdapter['execute']>>;
        try {
          execution = await adapter.execute(adapterJob);
        } catch (error) {
          const code = error instanceof Error ? error.message.split(':', 1)[0] : 'ADAPTER_ERROR';
          const unknown = code === 'ADAPTER_TIMEOUT' || code === 'OUTCOME_UNKNOWN';
          await result(job, unknown ? 'UNKNOWN_OUTCOME' : 'TRANSIENT_FAILURE', code, {
            executor: 'PACKET15_ADAPTER',
            dryRun: true,
            verification: unknown ? 'OUTCOME_UNKNOWN' : 'ABORTED_BEFORE_COMMIT',
          });
          return true;
        }
        const type =
          execution.status === 'VERIFIED_SUCCESS' || execution.status === 'SAFE_PRECOMMIT_DRY_RUN'
            ? 'SUCCESS'
            : execution.status === 'MANUAL_ACTION_REQUIRED'
              ? 'MANUAL_ACTION_REQUIRED'
              : execution.status === 'OUTCOME_UNKNOWN'
                ? 'UNKNOWN_OUTCOME'
                : execution.status === 'UNVERIFIED'
                  ? 'UNKNOWN_OUTCOME'
                  : 'TRANSIENT_FAILURE';
        const code =
          type === 'SUCCESS'
            ? null
            : execution.status === 'MANUAL_ACTION_REQUIRED'
              ? 'SECURITY_CHECKPOINT'
              : execution.status === 'UNKNOWN_OUTCOME' || execution.status === 'UNVERIFIED'
                ? 'EXECUTION_OUTCOME_UNKNOWN'
                : 'TRANSIENT_NETWORK';
        await result(
          job,
          type,
          code,
          execution.evidence ?? {
            executor: 'PACKET15_ADAPTER',
            dryRun: true,
            verification: execution.status,
          },
        );
      } else {
        const message =
          preparationError?.message ?? preparedResponse?.error ?? 'Adapter preparation blocked';
        const manual = /SECURITY|LOGIN|AUTH|TARGET|AMBIGUOUS|DIALOG|ORIGIN|CONTENT/.test(message);
        await result(
          job,
          manual ? 'MANUAL_ACTION_REQUIRED' : 'TRANSIENT_FAILURE',
          manual ? 'SECURITY_CHECKPOINT' : 'TRANSIENT_NETWORK',
          {
            executor: 'PACKET15_ADAPTER',
            dryRun: true,
            verification: 'preparation-blocked',
            failure: message.slice(0, 120),
          },
        );
      }
      return true;
    } finally {
      if (adapter && adapterPreparationJobId)
        await adapter.abort(adapterPreparationJobId).catch(() => undefined);
      inFlight -= 1;
      state.inFlightJobs = inFlight;
    }
  };
  return {
    health: () => ({ ...state }),
    start: async () => {
      if (server) return;
      server = createServer((request, response) => {
        const ready = request.url === '/ready';
        if (request.url !== '/health' && !ready) return void response.writeHead(404).end();
        response.writeHead(ready && state.status !== 'ready' ? 503 : 200, {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        });
        response.end(JSON.stringify(ready ? { ready: state.status === 'ready' } : state));
      });
      await new Promise<void>((resolve, reject) =>
        server?.listen(env.META_BRIDGE_PORT, env.META_BRIDGE_HOST, resolve).once('error', reject),
      );
      const sentAt = Date.now();
      const handshake = await post('/handshake', {
        operationId: randomUUID(),
        instanceId,
        bridgeVersion: env.ZAVLIO_BRIDGE_VERSION,
        supportedProtocolVersions: [1],
        executionModes: ['DRY_RUN_ONLY'],
        capabilities,
        startedAt: startedAt.toISOString(),
      });
      client.clockSkewMs = new Date(handshake.serverTime).getTime() - sentAt;
      state.clockSkewMs = client.clockSkewMs;
      state.lastHandshake = new Date().toISOString();
      state.controlPlaneConnected = true;
      state.status = 'ready';
      if (adapter) {
        await adapter.initialize();
        state.adapter = adapter.health();
      }
      await heartbeat();
      heartbeatLoop = (async () => {
        while (!controller.signal.aborted) {
          await wait(env.ZAVLIO_HEARTBEAT_INTERVAL_MS, controller.signal);
          if (controller.signal.aborted) break;
          try {
            await heartbeat();
          } catch (error) {
            state.status = 'degraded';
            state.controlPlaneConnected = false;
            logger.log('warn', 'BRIDGE_HEARTBEAT_FAILED', {
              code: error instanceof Error ? error.name : 'UNKNOWN',
            });
          }
        }
      })();
      pollLoop = (async () => {
        let delay = env.ZAVLIO_POLL_INTERVAL_MS;
        while (!controller.signal.aborted) {
          try {
            delay = (await runOnce()) ? env.ZAVLIO_POLL_INTERVAL_MS : Math.min(delay * 2, 30000);
          } catch (error) {
            state.status = 'degraded';
            logger.log('warn', 'BRIDGE_POLL_FAILED', {
              code: error instanceof Error ? error.name : 'UNKNOWN',
            });
            delay = Math.min(Math.max(delay * 2, 1000), 30000);
          }
          await wait(delay, controller.signal);
        }
      })();
      logger.log('info', 'BRIDGE_STARTED', {
        host: env.META_BRIDGE_HOST,
        port: env.META_BRIDGE_PORT,
        agentKey: env.ZAVLIO_AGENT_KEY,
        instanceId,
        protocolVersion: 1,
        executorMode: 'DRY_RUN_ONLY',
      });
    },
    stop: async () => {
      state.status = 'stopping';
      controller.abort();
      await Promise.allSettled(
        [heartbeatLoop, pollLoop].filter((x): x is Promise<void> => Boolean(x)),
      );
      const active = server;
      server = undefined;
      if (active)
        await new Promise<void>((resolve, reject) =>
          active.close((error) => (error ? reject(error) : resolve())),
        );
      logger.log('info', 'BRIDGE_STOPPED', {
        agentKey: env.ZAVLIO_AGENT_KEY,
        instanceId,
        inFlightJobs: inFlight,
      });
      await adapter?.shutdown();
    },
    runOnce,
  };
}
