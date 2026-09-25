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

const TAB_ID_KEY = 'marketlink-tab-id';
const LEGACY_AUTH_KEY = 'marketlink-auth';

/** Stable per-tab id (survives refresh; unique across separate tabs). */
function getTabId() {
  try {
    let tabId = sessionStorage.getItem(TAB_ID_KEY);
    if (!tabId) {
      tabId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(TAB_ID_KEY, tabId);
    }
    return tabId;
  } catch {
    return 'fallback';
  }
}

/**
 * Unique auth storageKey per tab → unique BroadcastChannel name.
 * Migrates legacy `marketlink-auth` token within this tab if present.
 */
function getTabAuthStorageKey() {
  const key = `${LEGACY_AUTH_KEY}-${getTabId()}`;
  try {
    const legacy = sessionStorage.getItem(LEGACY_AUTH_KEY);
    if (legacy && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, legacy);
      sessionStorage.removeItem(LEGACY_AUTH_KEY);
    }
  } catch {
    /* ignore */
  }
  return key;
}

/**
 * Supabase Auth uses BroadcastChannel(storageKey) to push SIGNED_IN / SIGNED_OUT
 * across tabs. That overwrites other tabs' sessions — break for multi-role tabs.
 * Replace BroadcastChannel only while constructing the client.
 */
function createTabIsolatedClient(supabaseUrl, key) {
  const storageKey = getTabAuthStorageKey();
  const PreviousBC = globalThis.BroadcastChannel;

  class NoopBroadcastChannel {
    constructor() {
      this.name = '';
      this.onmessage = null;
      this.onmessageerror = null;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return false;
    }
  }

  try {
    globalThis.BroadcastChannel = NoopBroadcastChannel;
  } catch {
    /* non-configurable — unique storageKey still isolates channels */
  }

  try {
    return createClient(supabaseUrl, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: tabAuthStorage,
        storageKey,
      },
    });
  } finally {
    try {
      if (PreviousBC) globalThis.BroadcastChannel = PreviousBC;
      else delete globalThis.BroadcastChannel;
    } catch {
      /* ignore */
    }
  }
}

/**
 * Browser Supabase client. Uses anon key only (RLS enforces access).
 * When env vars are missing, client is null and the UI falls back to demo auth.
 */
export const supabase = isSupabaseConfigured ? createTabIsolatedClient(url, anonKey) : null;

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
