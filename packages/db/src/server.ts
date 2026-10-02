import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';
import { DatabaseConfigurationError } from './errors.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new DatabaseConfigurationError(`Missing required database environment variable: ${name}`);
  return value;
}

export function createServerDatabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    },
  );
}
