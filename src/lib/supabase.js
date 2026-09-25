import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both public Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client. Uses anon key only (RLS enforces access).
 * When env vars are missing, client is null and the UI falls back to demo auth.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'marketlink-auth',
      },
    })
  : null;

export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  FARMER: 'farmer',
  ADMIN: 'admin',
  MANAGER: 'manager',
});

/** Dashboard path for a role; visitors without a role stay on the marketing site. */
export function dashboardPathForRole(role) {
  const r = role && ROLES[String(role).toUpperCase()] ? String(role).toLowerCase() : 'customer';
  return `/dashboard/${r}`;
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}
