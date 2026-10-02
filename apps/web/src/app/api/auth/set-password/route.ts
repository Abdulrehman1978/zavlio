import { NextResponse } from 'next/server';
import { getCurrentStaff } from '../../../../lib/auth/guards';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const confirmation = String(form.get('password_confirmation') ?? '');
  const failure = () =>
    NextResponse.redirect(new URL('/auth/set-password?error=invalid', request.url));
  if (password.length < 12 || password !== confirmation) return failure();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return failure();
  if (!(await getCurrentStaff())) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
  }
  return NextResponse.redirect(new URL('/crm', request.url));
}
