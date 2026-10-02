import 'server-only';
import { serverEnv } from '../env/server';
import { publicEnv } from '../env/public';

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  if (!serverEnv.TURNSTILE_ENABLED) {
    const localSite = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(
      publicEnv.NEXT_PUBLIC_SITE_URL,
    );
    return serverEnv.NODE_ENV !== 'production' || localSite;
  }
  if (!serverEnv.TURNSTILE_SECRET_KEY || !token) return false;
  if (serverEnv.NODE_ENV !== 'production' && token === 'local-test-bypass') return true;
  try {
    const body = new URLSearchParams({ secret: serverEnv.TURNSTILE_SECRET_KEY, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    const result = (await response.json()) as { success?: boolean };
    return response.ok && result.success === true;
  } catch {
    return false;
  }
}
