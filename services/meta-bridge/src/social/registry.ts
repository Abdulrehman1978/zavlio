import { FacebookTargetProofProvider } from './providers/facebook.js';
import { LinkedInTargetProofProvider } from './providers/linkedin.js';
import { ThreadsTargetProofProvider } from './providers/threads.js';
import type { SocialPlatform, SocialProvider } from './types.js';

export function createSocialProviders(): Record<SocialPlatform, SocialProvider> {
  return {
    THREADS: new ThreadsTargetProofProvider(),
    FACEBOOK: new FacebookTargetProofProvider(),
    LINKEDIN: new LinkedInTargetProofProvider(),
  };
}

export function getSocialProvider(
  platform: SocialPlatform,
  providers = createSocialProviders(),
): SocialProvider {
  return providers[platform];
}
