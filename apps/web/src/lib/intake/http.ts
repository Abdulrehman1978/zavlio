import { NextResponse } from 'next/server';
import { publicEnv } from '../env/public';
import { serverEnv } from '../env/server';

const requestWindow = new Map<string, { startedAt: number; count: number }>();
const allowedOrigins = new Set([
  publicEnv.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3100',
  'http://127.0.0.1:3100',
]);

export function rejectJson(status: number, error: string) {
  const response = NextResponse.json({ ok: false, error }, { status });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export function successJson(body: Record<string, unknown>, status = 201) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.has(origin);
}

function withinRateLimit(request: Request): boolean {
  const key = request.headers.get('user-agent')?.slice(0, 120) ?? 'unknown';
  const now = Date.now();
  const current = requestWindow.get(key);
  if (!current || now - current.startedAt >= 60_000) {
    requestWindow.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= serverEnv.FORM_RATE_LIMIT_PER_MINUTE) return false;
  current.count += 1;
  return true;
}

export async function readFormBody(
  request: Request,
): Promise<{ body?: unknown; response?: NextResponse }> {
  if (!allowedOrigin(request))
    return { response: rejectJson(403, 'Request origin is not allowed.') };
  if (!withinRateLimit(request)) return { response: rejectJson(429, 'Please try again later.') };
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > serverEnv.FORM_BODY_MAX_BYTES)
    return { response: rejectJson(413, 'Request is too large.') };
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > serverEnv.FORM_BODY_MAX_BYTES)
    return { response: rejectJson(413, 'Request is too large.') };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { response: rejectJson(400, 'Invalid request.') };
  }
}
