import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured, isValidRole, ROLES, dashboardPathForRole, hasDashboard } from '../lib/supabase';

const AuthContext = createContext(null);
const DEMO_KEY = 'ml-demo-session';

function readDemoSession() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDemoSession(session) {
  if (!session) localStorage.removeItem(DEMO_KEY);
  else localStorage.setItem(DEMO_KEY, JSON.stringify(session));
}

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, contact_number, address, role, status, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[MarketLink] profile fetch:', error.message);
    return null;
  }
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let mounted = true;

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
      setSession(data.session);
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    boot();

    if (!supabase) return () => { mounted = false; };

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        const p = await fetchProfile(nextSession.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    const role = profile?.role && isValidRole(profile.role) ? profile.role : null;
    const user = session?.user || null;

    async function signUp({ email, password, fullName, contactNumber, address, role: selectedRole, stallName, educationLevel }) {
      setAuthError('');
      const role = isValidRole(selectedRole) ? selectedRole : ROLES.CUSTOMER;

      if (!isSupabaseConfigured || !supabase) {
        const demoProfile = {
          id: 'demo-' + role,
          email,
          full_name: fullName || (role === ROLES.ADMIN ? 'MarketLink Admin' : 'Demo User'),
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
      // Profile row is created by DB trigger; refresh if session exists immediately
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        setProfile(p);
        setSession(data.session);
      }
      return { ok: true, role, needsEmailConfirm: !data.session };
    }

    async function signIn({ email, password, preferredRole }) {
      setAuthError('');

      if (!isSupabaseConfigured || !supabase) {
        const role = isValidRole(preferredRole) ? preferredRole : ROLES.CUSTOMER;
        const demoProfile = {
          id: 'demo-' + role,
          email: email || `${role}@demo.marketlink`,
          full_name:
            role === ROLES.ADMIN ? 'MarketLink Admin'
              : role === ROLES.FARMER ? 'Ali Raza'
                : role === ROLES.MANAGER ? 'Market Manager'
                  : 'Ayesha Khan',
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

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return { ok: false, error: error.message };
      }
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      setSession(data.session);
      return { ok: true, role: p?.role || ROLES.CUSTOMER };
    }

    async function signOut() {
      setAuthError('');
      writeDemoSession(null);
      if (supabase && isSupabaseConfigured) await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    }

    async function resetPassword(email) {
      setAuthError('');
      if (!email?.trim()) {
        setAuthError('Enter your email address to reset your password.');
        return { ok: false };
      }
      if (!isSupabaseConfigured || !supabase) {
        setAuthError('Password reset needs live Supabase auth. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        return { ok: false };
      }
      const redirectTo = `${import.meta.env.VITE_SITE_URL || window.location.origin}/login`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) {
        setAuthError(error.message);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }

    function hasRole(...allowed) {
      if (!role) return false;
      return allowed.includes(role);
    }

    function canAccessDashboard(dashRole) {
      // Customer has no dashboard — shopping is on the public website
      if (!role || !isValidRole(dashRole) || !hasDashboard(dashRole)) return false;
      if (role === ROLES.CUSTOMER) return false;
      if (role === ROLES.ADMIN) return true; // admin may open farmer/admin/manager portals
      return role === dashRole;
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
      resetPassword,
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
