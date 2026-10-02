import { heartbeatRequestSchema } from '@zavlio/automation/protocol';
import { machineMutation, rpcJson } from '../../../../../../lib/automation/machine-api';
export async function POST(request: Request) {
  return machineMutation(request, heartbeatRequestSchema, async (body, principal) => {
    await rpcJson('record_machine_heartbeat', {
      p_agent_id: principal.agentId,
      p_instance_id: body.instanceId,
      p_bridge_version: body.bridgeVersion,
      p_runtime_state: {
        uptimeSeconds: body.uptimeSeconds,
        activeJobs: body.activeJobs,
        executorMode: body.executorMode,
        ...body.runtimeState,
      },
    });
    return { status: 'HEARTBEAT_ACCEPTED' };
  });
}
