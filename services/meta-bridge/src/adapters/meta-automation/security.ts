import type { AdapterPlatform } from './contracts.js';

export type SecurityState =
  'KNOWN_SAFE_NO_SIGNAL' | 'KNOWN_SECURITY_SIGNAL' | 'LOGIN_SIGNAL' | 'UNKNOWN';
export type SecurityResult = Readonly<{ state: SecurityState; reason: string; confidence: number }>;

const challenge = [
  'captcha',
  'security checkpoint',
  'identity verification',
  'suspicious activity',
  'verify you are human',
  'bot detection',
];
const login = ['log in', 'login', 'sign in', 'authenticate'];

/** Deterministic wrapper equivalent; the upstream AI guard is not loaded in the adapter path. */
export function classifySecurity(
  snapshot: { title?: string; bodyText?: string; activeDialogs?: unknown[] },
  platform: AdapterPlatform,
): SecurityResult {
  void platform;
  const text = `${snapshot.title ?? ''}\n${snapshot.bodyText ?? ''}`.toLowerCase();
  if (challenge.some((item) => text.includes(item)))
    return {
      state: 'KNOWN_SECURITY_SIGNAL',
      reason: 'Security checkpoint detected.',
      confidence: 1,
    };
  if (login.some((item) => text.includes(item)))
    return { state: 'LOGIN_SIGNAL', reason: 'Authentication is required.', confidence: 1 };
  if (snapshot.activeDialogs?.length)
    return {
      state: 'KNOWN_SECURITY_SIGNAL',
      reason: 'Unexpected browser dialog detected.',
      confidence: 1,
    };
  if (typeof snapshot.bodyText !== 'string')
    return { state: 'UNKNOWN', reason: 'Snapshot is incomplete.', confidence: 0 };
  return {
    state: 'KNOWN_SAFE_NO_SIGNAL',
    reason: 'No known security signal in bounded snapshot; absence is not proof of safety.',
    confidence: 0.25,
  };
}
