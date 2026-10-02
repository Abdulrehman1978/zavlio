import { SyntheticFixtureSocialProvider } from '../provider-base.js';
import type { ObservableTarget, SocialPageSnapshot } from '../types.js';

export class ThreadsTargetProofProvider extends SyntheticFixtureSocialProvider {
  readonly platform = 'THREADS' as const;
  readonly version = 'THREADS_PROVIDER_V1';
  readonly origin = 'https://www.threads.com';

  protected profilePathMatches(path: string): boolean {
    return /^\/@?[a-z0-9._-]+$/.test(path);
  }

  protected targetFromPage(page: SocialPageSnapshot): ObservableTarget | null {
    return page.target ?? null;
  }
}
