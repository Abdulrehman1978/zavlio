import { startRequestSchema } from '@zavlio/automation/protocol';
import { machineMutation, rpcJson } from '../../../../../../../../lib/automation/machine-api';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return machineMutation(request, startRequestSchema, (body, principal) =>
    rpcJson('machine_start_automation_job', {
      p_agent_id: principal.agentId,
      p_job_id: id,
      p_operation_id: body.operationId,
      p_request_hash: principal.bodySha256,
      p_instance_id: body.instanceId,
      p_expected_version: body.expectedJobVersion,
      p_expected_lease: body.expectedLeaseExpiresAt,
      p_content_hash: body.contentHash,
      p_policy_version: body.policyVersion,
    }),
  );
}
