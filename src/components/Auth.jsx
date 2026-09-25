import { useState } from 'react';
import { ArrowRight, Leaf, Mail, Lock, User, Phone, MapPin, Store, GraduationCap } from 'lucide-react';
import { navigate } from '../router';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole, ROLES } from '../lib/supabase';

export default function Auth({ mode = 'login' }) {
  const { signIn, signUp, resetPassword, isConfigured, authError, setAuthError } = useAuth();
  const [isFarmer, setIsFarmer] = useState(false);
  const [demoRole, setDemoRole] = useState(ROLES.FARMER);
  const [edu, setEdu] = useState('educated');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const [forgot, setForgot] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    stallName: '',
    email: '',
    password: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onForgotSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setInfo('');
    setAuthError('');
    const result = await resetPassword(form.email);
    setBusy(false);
    if (!result.ok) return;
    setInfo('Password reset email sent. Check your inbox, then return here to log in.');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setInfo('');
    setAuthError('');

    if (mode === 'register') {
      const role = isFarmer ? ROLES.FARMER : ROLES.CUSTOMER;
      const result = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        contactNumber: form.contactNumber,
        address: form.address,
        role,
        stallName: form.stallName,
        educationLevel: edu,
      });
      setBusy(false);
      if (!result.ok) return;
      if (result.needsEmailConfirm) {
        setInfo('Check your email to confirm your account, then log in.');
        return;
      }
      navigate(dashboardPathForRole(result.role));
      return;
    }

    // Live auth uses profile.role from DB; demo mode uses Farmer / Admin portal selection
    const preferredRole = isConfigured ? undefined : demoRole;
    const result = await signIn({
      email: form.email,
      password: form.password,
      preferredRole,
    });
    setBusy(false);
    if (!result.ok) return;
    navigate(dashboardPathForRole(result.role));
  }

  const showForgot = mode === 'login' && forgot;

  return (
    <div className="auth-page">
      <div className="auth-image">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85"
          alt="Farmer working in a field"
        />
        <div>
          <Leaf size={22} />
          <b>Fresh from local hands.</b>
          <small>MarketLink connects communities with farmers.</small>
        </div>
      </div>
      <div className="auth-card">
        <button className="auth-logo" type="button" onClick={() => navigate('/')}>
          <span><Leaf size={20} /></span>
          <b>MarketLink</b>
        </button>
        <span className="eyebrow">
          {showForgot ? 'Account recovery' : mode === 'login' ? 'Welcome back' : 'Create your account'}
        </span>
        <h1>
          {showForgot
            ? 'Forgot your password?'
            : mode === 'login'
              ? 'Login to MarketLink'
              : 'Join the local food community'}
        </h1>
        <p>
          {showForgot
            ? 'Enter your account email and we will send a reset link.'
            : isConfigured
              ? 'Secure sign-in powered by Supabase Auth. Farmers and admins use dashboards; customers shop on the website.'
              : 'Demo mode — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live auth.'}
        </p>

        {showForgot ? (
          <form onSubmit={onForgotSubmit}>
            <label>
              <Mail size={16} /> Email
              <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
            {(authError || info) && (
              <p className="auth-msg" role="alert" style={{ color: authError ? '#b42318' : 'var(--primary)', fontSize: 13, margin: '4px 0 0' }}>
                {authError || info}
              </p>
            )}
            <button className="btn full" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Send reset link'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit}>
            {mode === 'register' && (
              <>
                <label>
                  <User size={16} /> Full name
                  <input required placeholder="Your full name" value={form.fullName} onChange={set('fullName')} />
                </label>
                <label>
                  <Phone size={16} /> Contact number
                  <input required placeholder="03xx-xxxxxxx" value={form.contactNumber} onChange={set('contactNumber')} />
                </label>
                <label>
                  <MapPin size={16} /> Address
                  <input required placeholder="Your pickup area" value={form.address} onChange={set('address')} />
                </label>
                <div className="role-toggle">
                  <button type="button" className={!isFarmer ? 'selected' : ''} onClick={() => setIsFarmer(false)}>
                    Customer
                  </button>
                  <button type="button" className={isFarmer ? 'selected' : ''} onClick={() => setIsFarmer(true)}>
                    Farmer
                  </button>
                </div>
                {isFarmer && (
                  <>
                    <label>
                      <Store size={16} /> Stall / business name
                      <input required placeholder="Your farm or stall name" value={form.stallName} onChange={set('stallName')} />
                    </label>
                    <label className="edu">
                      <GraduationCap size={16} /> Education level
                      <select value={edu} onChange={(e) => setEdu(e.target.value)}>
                        <option value="educated">Educated</option>
                        <option value="uneducated">Uneducated</option>
                      </select>
                    </label>
                  </>
                )}
              </>
            )}
            {mode === 'login' && !isConfigured && (
              <div className="role-toggle">
                <button type="button" className={demoRole === ROLES.FARMER ? 'selected' : ''} onClick={() => setDemoRole(ROLES.FARMER)}>
                  Farmer
                </button>
                <button type="button" className={demoRole === ROLES.ADMIN ? 'selected' : ''} onClick={() => setDemoRole(ROLES.ADMIN)}>
                  Admin
                </button>
              </div>
            )}
            <label>
              <Mail size={16} /> Email
              <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
            <label>
              <Lock size={16} /> Password
              <input type="password" required placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} />
            </label>
            {mode === 'login' && (
              <div className="auth-switch" style={{ marginTop: 0, textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgot(true);
                    setAuthError('');
                    setInfo('');
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
            {(authError || info) && (
              <p className="auth-msg" role="alert" style={{ color: authError ? '#b42318' : 'var(--primary)', fontSize: 13, margin: '4px 0 0' }}>
                {authError || info}
              </p>
            )}
            <button className="btn full" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="auth-switch">
          {showForgot ? (
            <button
              type="button"
              onClick={() => {
                setForgot(false);
                setAuthError('');
                setInfo('');
              }}
            >
              Back to login
            </button>
          ) : mode === 'login' ? (
            <>
              Don&apos;t have an account? <button type="button" onClick={() => navigate('/register')}>Register</button>
            </>
          ) : (
            <>
              Already have an account? <button type="button" onClick={() => navigate('/login')}>Login</button>
            </>
          )}
        </div>
        {!showForgot && (
          <div className="auth-switch" style={{ marginTop: 10, opacity: 0.85 }}>
            <button type="button" onClick={() => navigate('/dashboard/admin')}>Admin portal</button>
            {' · '}
            <button type="button" onClick={() => navigate('/dashboard/farmer')}>Farmer portal</button>
          </div>
        )}
      </div>
    </div>
  );
}
