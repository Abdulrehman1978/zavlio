import { socialObservationRequestSchema } from '@zavlio/automation/protocol';
import { machineMutation, rpcJson } from '../../../../../../../lib/automation/machine-api';

export async function POST(request: Request) {
  return machineMutation(request, socialObservationRequestSchema, (body, principal) =>
    rpcJson('record_social_observation', {
      p_operation_id: body.operationId,
      p_request_hash: principal.bodySha256,
      p_platform: body.platform,
      p_provider_version: body.providerVersion,
      p_provider_identity_key: body.providerIdentityKey,
      p_provider_identity: body.providerIdentity,
      p_conversation_provider_id: body.conversationProviderId,
      p_normalized_messages: body.normalizedMessages,
      p_auth_state: body.authState,
      p_observed_at: body.observedAt,
    }),
  );
}
