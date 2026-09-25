import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both public Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Per-tab auth storage (sessionStorage).
 * localStorage is shared across tabs, so every tab showed the same login.
 * sessionStorage lets customer / farmer / admin stay logged in in separate tabs.
 */
const tabAuthStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* ignore quota / private mode */
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

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
        storage: tabAuthStorage,
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

/** Roles that use a dedicated dashboard (customers shop on the public site). */
export const DASHBOARD_ROLES = Object.freeze([ROLES.FARMER, ROLES.ADMIN, ROLES.MANAGER]);

export function hasDashboard(role) {
  return DASHBOARD_ROLES.includes(role);
}

/**
 * Post-login destination for a role.
 * Farmer / admin / manager → dashboard; customer → public website (shop).
 */
export function dashboardPathForRole(role) {
  const r = String(role || '').toLowerCase();
  if (hasDashboard(r)) return `/dashboard/${r}`;
  return '/';
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}
