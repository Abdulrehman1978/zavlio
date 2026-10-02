/**
 * Supabase's generated RPC argument types do not encode nullable PostgreSQL
 * parameters. This adapter preserves the runtime null while keeping that
 * generator limitation at the API boundary.
 */
export function toRpcNullable<T>(value: T | null): T {
  return value as T;
}
