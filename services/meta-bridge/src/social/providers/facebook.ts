import { SyntheticFixtureSocialProvider } from '../provider-base.js';
import type { ObservableTarget, SocialPageSnapshot } from '../types.js';

export class FacebookTargetProofProvider extends SyntheticFixtureSocialProvider {
  readonly platform = 'FACEBOOK' as const;
  readonly version = 'FACEBOOK_PROVIDER_V1';
  readonly origin = 'https://www.facebook.com';

  protected profilePathMatches(path: string): boolean {
    return /^\/(?:profile\.php|[a-z0-9._-]+)(?:\/(?:profile|about))?$/.test(path);
  }

  protected targetFromPage(page: SocialPageSnapshot): ObservableTarget | null {
    return page.target ?? null;
  }
}
