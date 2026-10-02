export function safeNextPath(value: string | null | undefined, fallback = '/crm'): string {
  if (!value) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback;
    const parsed = new URL(decoded, 'http://local.invalid');
    if (parsed.origin !== 'http://local.invalid') return fallback;
    if (!parsed.pathname.startsWith('/crm') && !parsed.pathname.startsWith('/auth/set-password')) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
