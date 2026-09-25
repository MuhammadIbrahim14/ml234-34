/** Normalize Supabase / network errors for UI banners. */
export function apiError(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}

export const DEMO_CRUD_MSG =
  'Live catalog and CRUD need Supabase. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then refresh.';
