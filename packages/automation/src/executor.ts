import type { AutomationActionType } from './policy';
export type ExecutorResult =
  | { readonly kind: 'SUCCESS'; readonly evidence?: Readonly<Record<string, unknown>> }
  | {
      readonly kind: 'TRANSIENT_FAILURE';
      readonly code: 'TRANSIENT_NETWORK' | 'PROVIDER_TEMPORARY' | 'RATE_LIMIT';
      readonly summary: string;
    }
  | {
      readonly kind: 'PERMANENT_FAILURE';
      readonly code: 'INVALID_TARGET' | 'CONTENT_REJECTED' | 'UNKNOWN';
      readonly summary: string;
    }
  | {
      readonly kind: 'MANUAL_ACTION_REQUIRED';
      readonly code:
        | 'AUTH_REQUIRED'
        | 'SECURITY_CHECKPOINT'
        | 'CAPTCHA'
        | 'IDENTITY_VERIFICATION'
        | 'EXECUTION_OUTCOME_UNKNOWN';
      readonly summary: string;
    };
export interface AutomationExecutor {
  execute(
    input: Readonly<{ jobId: string; action: AutomationActionType; dryRun: boolean }>,
  ): Promise<ExecutorResult>;
}
export class DryRunExecutor implements AutomationExecutor {
  constructor(private readonly outcome: ExecutorResult = { kind: 'SUCCESS' }) {}
  async execute(input: Readonly<{ jobId: string; action: AutomationActionType; dryRun: boolean }>) {
    if (!input.dryRun) throw new Error('Packet 13 executor refuses real side effects.');
    return this.outcome;
  }
}
