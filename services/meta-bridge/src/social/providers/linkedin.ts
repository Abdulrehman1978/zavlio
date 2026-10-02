import { SyntheticFixtureSocialProvider } from '../provider-base.js';
import type { ObservableTarget, SocialPageSnapshot } from '../types.js';

export class LinkedInTargetProofProvider extends SyntheticFixtureSocialProvider {
  readonly platform = 'LINKEDIN' as const;
  readonly version = 'LINKEDIN_PROVIDER_V1';
  readonly origin = 'https://www.linkedin.com';

  protected profilePathMatches(path: string): boolean {
    return /^\/in\/[a-z0-9._-]+(?:\/(?:details|overlay))?$/.test(path);
  }

  protected targetFromPage(page: SocialPageSnapshot): ObservableTarget | null {
    return page.target ?? null;
  }
}
