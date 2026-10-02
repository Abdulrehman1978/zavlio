import { NextResponse } from 'next/server';
import { getCurrentStaff } from '../../../lib/auth/guards';
import { safeNextPath } from '../../../lib/auth/redirects';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(form.get('password') ?? '');
  const next = safeNextPath(String(form.get('next') ?? null));
  const failure = () =>
    NextResponse.redirect(
      new URL(`/login?error=invalid&next=${encodeURIComponent(next)}`, request.url),
    );
  if (!email || !password) return failure();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await supabase.auth.signOut();
    return failure();
  }
  const staff = await getCurrentStaff();
  if (!staff) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
  }
  const response = NextResponse.redirect(new URL(next, request.url));
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
