import { NextResponse } from 'next/server';
import { safeNextPath } from '../../../../lib/auth/redirects';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const next = safeNextPath(String(form.get('next') ?? null));
  const supabase = await createServerSupabaseClient();
  if (email)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL(`/auth/confirm?next=${encodeURIComponent(next)}`, request.url).toString(),
    });
  return NextResponse.redirect(
    new URL(`/auth/forgot-password?sent=1&next=${encodeURIComponent(next)}`, request.url),
  );
}
