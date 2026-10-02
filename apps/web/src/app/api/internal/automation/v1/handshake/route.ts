import { handshakeRequestSchema } from '@zavlio/automation/protocol';
import {
  machineMutation,
  safeCapabilities,
  rpcJson,
  createAdminDatabaseClient,
} from '../../../../../../lib/automation/machine-api';
import { MachineProtocolError } from '../../../../../../lib/automation/machine-auth';

export async function POST(request: Request) {
  return machineMutation(request, handshakeRequestSchema, async (body, principal) => {
    if (!body.supportedProtocolVersions.includes(1))
      throw new MachineProtocolError(426, 'PROTOCOL_VERSION_UNSUPPORTED');
    const acceptedCapabilities = safeCapabilities(
      principal.registeredCapabilities,
      body.capabilities,
    );
    const clockSkewMs = Date.now() - principal.requestTimestampSeconds * 1000;
    await rpcJson('record_machine_handshake', {
      p_agent_id: principal.agentId,
      p_instance_id: body.instanceId,
      p_bridge_version: body.bridgeVersion,
      p_clock_skew_ms: clockSkewMs,
      p_capabilities: acceptedCapabilities,
    });
    const db = createAdminDatabaseClient();
    const policy = await db
      .from('automation_policy_versions')
      .select('configuration')
      .eq('active', true)
      .single();
    const config = (policy.data?.configuration ?? {}) as Record<string, unknown>;
    return {
      selectedProtocolVersion: 1,
      agentId: principal.agentId,
      agentKey: principal.agentKey,
      agentEnabled: true,
      heartbeatIntervalMs: 30000,
      pollIntervalMs: 5000,
      leaseDurationMs: Number(config.leaseSeconds ?? 300) * 1000,
      maxConcurrency: 1,
      acceptedCapabilities,
      executionMode: 'DRY_RUN_ONLY',
      automationEnabled: config.enabled === true,
      dryRun: true,
      approvalRequired: true,
    };
  });
}
