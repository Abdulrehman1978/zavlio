import { claimRequestSchema } from '@zavlio/automation/protocol';
import { machineMutation, rpcJson } from '../../../../../../lib/automation/machine-api';
export async function POST(request: Request) {
  return machineMutation(request, claimRequestSchema, (body, principal) =>
    rpcJson('machine_claim_automation_job', {
      p_agent_id: principal.agentId,
      p_operation_id: body.operationId,
      p_request_hash: principal.bodySha256,
      p_instance_id: body.instanceId,
    }),
  );
}
