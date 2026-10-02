import type { AdapterPlatform } from './contracts.js';

export const PLATFORM_ORIGINS: Record<AdapterPlatform, string> = {
  THREADS: 'https://www.threads.com',
  FACEBOOK: 'https://www.facebook.com',
  LINKEDIN: 'https://www.linkedin.com',
};

export function validateCdpUrl(value: string): URL {
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  )
    throw new Error('CDP_UNAVAILABLE');
  if (url.username || url.password || url.search || url.hash) throw new Error('CDP_UNAVAILABLE');
  return url;
}

export function validatePlatformUrl(
  platform: AdapterPlatform,
  value: string,
  testMode: boolean,
): URL {
  const url = new URL(value);
  if (testMode && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) return url;
  const expected = new URL(PLATFORM_ORIGINS[platform]);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== expected.hostname ||
    url.port ||
    url.username ||
    url.password
  )
    throw new Error('ORIGIN_ESCAPE');
  return url;
}

export function isPlatformOrigin(
  platform: AdapterPlatform,
  value: string,
  testMode: boolean,
): boolean {
  try {
    validatePlatformUrl(platform, value, testMode);
    return true;
  } catch {
    return false;
  }
}
