import { type NextRequest, NextResponse } from 'next/server';
import { updateSupabaseSession } from './lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const response = await updateSupabaseSession(request);
  if (!request.nextUrl.pathname.startsWith('/crm')) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;
  const hasAuthCookie = request.cookies.getAll().some(({ name }) => name.includes('auth-token'));
  if (!hasAuthCookie) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/crm/:path*', '/auth/:path*'],
};
