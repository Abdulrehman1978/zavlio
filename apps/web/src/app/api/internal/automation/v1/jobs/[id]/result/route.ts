import { resultRequestSchema } from '@zavlio/automation/protocol';
import { machineMutation, rpcJson } from '../../../../../../../../lib/automation/machine-api';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return machineMutation(request, resultRequestSchema, (body, principal) =>
    rpcJson('machine_result_automation_job', {
      p_agent_id: principal.agentId,
      p_job_id: id,
      p_operation_id: body.operationId,
      p_request_hash: principal.bodySha256,
      p_instance_id: body.instanceId,
      p_expected_version: body.expectedJobVersion,
      p_result_type: body.resultType,
      p_failure_code: body.failureCode ?? null,
      p_failure_summary: body.failureSummary ?? null,
      p_retry_after: body.retryAfter ?? null,
      p_evidence: body.evidence,
    }),
  );
}
