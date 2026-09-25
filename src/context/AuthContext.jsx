import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured, isValidRole, ROLES, dashboardPathForRole, hasDashboard } from '../lib/supabase';

const AuthContext = createContext(null);
const DEMO_KEY = 'ml-demo-session';
const SESSION_KEY = 'ml-active-session-id';

/** Tab-scoped storage so each browser tab can hold a different logged-in role. */
const tabStore = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

function readDemoSession() {
  try {
    const raw = tabStore.get(DEMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDemoSession(session) {
  if (!session) tabStore.remove(DEMO_KEY);
  else tabStore.set(DEMO_KEY, JSON.stringify(session));
}

function clearLocalSessionId() {
  tabStore.remove(SESSION_KEY);
}

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;
  const cols = 'id, email, full_name, contact_number, address, role, status, avatar_url, active_session_id';
  let { data, error } = await supabase.from('profiles').select(cols).eq('id', userId).maybeSingle();
  if (error) {
    // Migration 003 not applied yet — fall back without session column
    const fallback = await supabase
      .from('profiles')
      .select('id, email, full_name, contact_number, address, role, status, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (fallback.error) {
      console.warn('[MarketLink] profile fetch:', fallback.error.message);
      return null;
    }
    return fallback.data;
  }
  return data;
}

/** Claim this browser as the only active session for the user (never blocks login long). */
async function claimSession(userId) {
  if (!supabase || !userId) return null;
  const sessionId = crypto.randomUUID();
  tabStore.set(SESSION_KEY, sessionId);
  try {
    const updatePromise = supabase
      .from('profiles')
      .update({ active_session_id: sessionId, updated_at: new Date().toISOString() })
      .eq('id', userId);
    const timeout = new Promise((resolve) => setTimeout(() => resolve({ error: { message: 'claim timeout' } }), 5000));
    const { error } = await Promise.race([updatePromise, timeout]);
    if (error) console.warn('[MarketLink] claim session:', error.message);
  } catch (err) {
    console.warn('[MarketLink] claim session:', err?.message || err);
  }
  return sessionId;
}

/**
 * True if this device still owns the account session.
 * If local id is not set yet (mid-login), allow — claimSession will set it next.
 */
function isLocalSessionValid(profile) {
  const local = tabStore.get(SESSION_KEY);
  if (!local) return true;
  if (!profile?.active_session_id) return true;
  return local === profile.active_session_id;
}

function withTimeout(promise, ms, label = 'Request') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out. Check your connection and try again.`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const OTP_STORAGE_KEY = 'ml-password-otp';

function storeLocalOtp(email, otp) {
  sessionStorage.setItem(
    OTP_STORAGE_KEY,
    JSON.stringify({ email: email.toLowerCase(), otp, expires: Date.now() + 10 * 60 * 1000 })
  );
}

function readLocalOtp() {
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.expires || data.expires < Date.now()) {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearLocalOtp() {
  sessionStorage.removeItem(OTP_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const kickingRef = useRef(false);

  async function forceLocalSignOut() {
    if (kickingRef.current) return;
    kickingRef.current = true;
    clearLocalSessionId();
    writeDemoSession(null);
    try {
      if (supabase && isSupabaseConfigured) await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* ignore */
    }
    setSession(null);
    setProfile(null);
    kickingRef.current = false;
  }

  useEffect(() => {
    let mounted = true;
    let channel = null;

    async function boot() {
      setLoading(true);
      if (!isSupabaseConfigured || !supabase) {
        const demo = readDemoSession();
        if (mounted) {
          setSession(demo?.session || null);
          setProfile(demo?.profile || null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        if (!isLocalSessionValid(p)) {
          await forceLocalSignOut();
          if (mounted) setLoading(false);
          return;
        }
        if (!tabStore.get(SESSION_KEY)) {
          void claimSession(data.session.user.id);
        }
        setSession(data.session);
        setProfile(p);
      } else {
        setSession(null);
        setProfile(null);
        clearLocalSessionId();
      }
      setLoading(false);
    }

    boot();

    if (!supabase) return () => { mounted = false; };

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Defer Supabase calls — calling auth APIs inside this callback can deadlock signIn
      setTimeout(async () => {
        if (!mounted) return;

        // Always trust THIS tab's sessionStorage — never adopt another tab's
        // BroadcastChannel payload (that was wiping multi-role logins).
        let tabSession = nextSession;
        try {
          const { data: stored } = await supabase.auth.getSession();
          tabSession = stored.session;
        } catch {
          /* keep nextSession fallback */
        }

        if (!tabSession?.user) {
          clearLocalSessionId();
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(tabSession);
        try {
          const p = await fetchProfile(tabSession.user.id);
          if (
            !isLocalSessionValid(p) &&
            event !== 'SIGNED_IN' &&
            event !== 'TOKEN_REFRESHED' &&
            event !== 'INITIAL_SESSION'
          ) {
            await forceLocalSignOut();
            return;
          }
          if (mounted) setProfile(p);
        } catch (err) {
          console.warn('[MarketLink] auth profile:', err?.message || err);
        }
        setLoading(false);
      }, 0);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Kick this device when another login claims the account
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !session?.user?.id) return undefined;

    const userId = session.user.id;
    const channel = supabase
      .channel(`ml-session-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const nextId = payload.new?.active_session_id;
          const local = tabStore.get(SESSION_KEY);
          if (nextId && local && nextId !== local) {
            forceLocalSignOut();
            setAuthError('This account signed in on another device. You have been logged out here.');
          }
        }
      )
      .subscribe();

    // Periodic check (covers Realtime not enabled yet)
    const timer = setInterval(async () => {
      const p = await fetchProfile(userId);
      if (p && !isLocalSessionValid(p)) {
        forceLocalSignOut();
        setAuthError('This account signed in on another device. You have been logged out here.');
      }
    }, 20000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const value = useMemo(() => {
    const role = profile?.role && isValidRole(profile.role) ? profile.role : null;
    const user = session?.user || null;

    async function signUp({ email, password, fullName, contactNumber, address, role: selectedRole, stallName, educationLevel }) {
      setAuthError('');
      const role = selectedRole === ROLES.FARMER ? ROLES.FARMER : ROLES.CUSTOMER;

      if (!isSupabaseConfigured || !supabase) {
        const demoProfile = {
          id: 'demo-' + role,
          email,
          full_name: fullName || 'Demo User',
          contact_number: contactNumber || '',
          address: address || '',
          role,
          status: role === ROLES.FARMER ? 'pending' : 'active',
        };
        const demoSession = { user: { id: demoProfile.id, email }, demo: true };
        writeDemoSession({ session: demoSession, profile: demoProfile });
        setSession(demoSession);
        setProfile(demoProfile);
        return { ok: true, role, demo: true };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            contact_number: contactNumber,
            address,
            role,
            stall_name: stallName || '',
            education_level: educationLevel || '',
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        return { ok: false, error: error.message };
      }
      if (data.session?.user) {
        await claimSession(data.session.user.id);
        const p = await fetchProfile(data.session.user.id);
        setProfile(p);
        setSession(data.session);
      }
      return { ok: true, role, needsEmailConfirm: !data.session };
    }

    async function signIn({ email, password }) {
      setAuthError('');

      if (!isSupabaseConfigured || !supabase) {
        const role = ROLES.CUSTOMER;
        const demoProfile = {
          id: 'demo-customer',
          email: email || 'customer@demo.marketlink',
          full_name: 'Demo Customer',
          contact_number: '',
          address: '',
          role,
          status: 'active',
        };
        const demoSession = { user: { id: demoProfile.id, email: demoProfile.email }, demo: true };
        writeDemoSession({ session: demoSession, profile: demoProfile });
        setSession(demoSession);
        setProfile(demoProfile);
        return { ok: true, role, demo: true };
      }

      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email: email.trim(), password }),
          20000,
          'Login'
        );
        if (error) {
          setAuthError(error.message);
          return { ok: false, error: error.message };
        }
        if (!data?.user) {
          setAuthError('Login failed. Please try again.');
          return { ok: false };
        }

        // Claim session in background — do not block navigation on slow profile update
        void claimSession(data.user.id);

        let p = null;
        try {
          p = await withTimeout(fetchProfile(data.user.id), 8000, 'Profile load');
        } catch {
          p = null;
        }

        if (p?.status === 'suspended' || p?.status === 'deactivated') {
          clearLocalSessionId();
          await supabase.auth.signOut({ scope: 'local' });
          setAuthError('This account is not active. Contact support.');
          return { ok: false, error: 'Account inactive' };
        }

        setProfile(p);
        setSession(data.session);
        return { ok: true, role: p?.role || ROLES.CUSTOMER };
      } catch (err) {
        const message = err?.message || 'Login failed. Please try again.';
        setAuthError(message);
        return { ok: false, error: message };
      }
    }

    async function signOut() {
      setAuthError('');
      writeDemoSession(null);
      clearLocalSessionId();
      if (supabase && isSupabaseConfigured) await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      setProfile(null);
    }

    async function requestPasswordOtp(email) {
      setAuthError('');
      const trimmed = email?.trim().toLowerCase();
      if (!trimmed) {
        setAuthError('Enter your email address to reset your password.');
        return { ok: false };
      }
      if (!isSupabaseConfigured || !supabase) {
        setAuthError('Password reset needs live Supabase + EmailJS.');
        return { ok: false };
      }

      let emailJsReady = false;
      try {
        const mod = await import('../lib/emailjs');
        emailJsReady = mod.isEmailJsConfigured();
        if (!emailJsReady) {
          setAuthError('EmailJS is not configured. Set VITE_EMAILJS_* env vars.');
          return { ok: false };
        }
      } catch {
        setAuthError('Email module failed to load.');
        return { ok: false };
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      // Always keep a local copy so UI can proceed even if RPC is missing/slow
      storeLocalOtp(trimmed, otp);

      let rpcSent = true;
      try {
        const { data, error } = await withTimeout(
          supabase.rpc('request_password_otp', { p_email: trimmed, p_otp: otp }),
          10000,
          'OTP request'
        );
        if (error) {
          console.warn('[MarketLink] OTP RPC:', error.message);
          // Continue with local OTP + EmailJS (user must still run migration 004 for final reset)
        } else if (data && data.ok === false) {
          setAuthError(data.error || 'Could not start password reset.');
          clearLocalOtp();
          return { ok: false };
        } else if (data?.sent === false) {
          rpcSent = false;
        }
      } catch (err) {
        console.warn('[MarketLink] OTP RPC:', err?.message || err);
      }

      if (!rpcSent) {
        // Account may not exist — still show success message (no email leak); skip mail
        return { ok: true };
      }

      try {
        const { sendPasswordOtpMail } = await import('../lib/emailjs');
        const mail = await withTimeout(
          sendPasswordOtpMail({ toEmail: trimmed, toName: 'MarketLink user', otp }),
          15000,
          'Email send'
        );
        if (!mail.ok) {
          setAuthError(mail.error || 'Failed to send OTP email. Check EmailJS settings.');
          return { ok: false };
        }
      } catch (err) {
        setAuthError(err?.message || 'Failed to send OTP email.');
        return { ok: false };
      }

      return { ok: true };
    }

    async function completePasswordReset({ email, otp, newPassword }) {
      setAuthError('');
      const trimmed = email?.trim().toLowerCase();
      const code = String(otp || '').trim();
      if (!trimmed || !code || !newPassword) {
        setAuthError('Email, OTP, and new password are required.');
        return { ok: false };
      }
      if (newPassword.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return { ok: false };
      }
      if (!isSupabaseConfigured || !supabase) {
        setAuthError('Password reset needs live Supabase.');
        return { ok: false };
      }

      const local = readLocalOtp();
      if (local && local.email === trimmed && local.otp !== code) {
        setAuthError('Invalid OTP. Check the code from your email.');
        return { ok: false };
      }

      try {
        const { data, error } = await withTimeout(
          supabase.rpc('complete_password_reset', {
            p_email: trimmed,
            p_otp: code,
            p_new_password: newPassword,
          }),
          15000,
          'Password reset'
        );
        if (error) {
          setAuthError(
            error.message.includes('Could not find the function') || error.message.includes('complete_password_reset')
              ? 'Password reset RPC missing. Run supabase/migrations/004_password_otp.sql in Supabase.'
              : error.message
          );
          return { ok: false, error: error.message };
        }
        if (!data?.ok) {
          setAuthError(data?.error || 'Could not reset password.');
          return { ok: false };
        }
        clearLocalOtp();
        return { ok: true };
      } catch (err) {
        setAuthError(err?.message || 'Password reset failed.');
        return { ok: false };
      }
    }

    function hasRole(...allowed) {
      if (!role) return false;
      return allowed.includes(role);
    }

    function canAccessDashboard(dashRole) {
      if (!role || !isValidRole(dashRole) || !hasDashboard(dashRole)) return false;
      if (role === ROLES.CUSTOMER) return false;
      if (role === ROLES.ADMIN) return true;
      return role === dashRole;
    }

    async function refreshProfile() {
      if (!session?.user?.id || !isSupabaseConfigured) return null;
      const p = await fetchProfile(session.user.id);
      if (p) setProfile(p);
      return p;
    }

    return {
      loading,
      session,
      user,
      profile,
      role,
      isAuthenticated: Boolean(user),
      isConfigured: isSupabaseConfigured,
      authError,
      setAuthError,
      signUp,
      signIn,
      signOut,
      requestPasswordOtp,
      completePasswordReset,
      refreshProfile,
      hasRole,
      canAccessDashboard,
      dashboardPath: role ? dashboardPathForRole(role) : '/login',
      ROLES,
    };
  }, [session, profile, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
