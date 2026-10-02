import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNextPath } from '../../../lib/auth/redirects';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

const validTypes = new Set<EmailOtpType>(['invite', 'recovery', 'email', 'email_change', 'signup']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get('next'), '/auth/set-password');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const supabase = await createServerSupabaseClient();
  let error: unknown = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type && validTypes.has(type)) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = new Error('Invalid confirmation request.');
  }
  if (error) return NextResponse.redirect(new URL('/auth/error?code=confirmation', request.url));
  const response = NextResponse.redirect(new URL(next, request.url));
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
