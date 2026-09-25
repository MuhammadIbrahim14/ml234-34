import { useState } from 'react';
import {
  ArrowRight,
  Leaf,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Store,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { navigate } from '../router';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole, ROLES } from '../lib/supabase';
import { flashToast } from '../lib/flashToast';

export default function Auth({ mode = 'login' }) {
  const {
    signIn,
    signUp,
    requestPasswordOtp,
    completePasswordReset,
    isConfigured,
    authError,
    setAuthError,
  } = useAuth();
  const [isFarmer, setIsFarmer] = useState(false);
  const [edu, setEdu] = useState('educated');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  /** null | 'email' | 'otp' */
  const [forgotStep, setForgotStep] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    stallName: '',
    email: '',
    password: '',
    otp: '',
    newPassword: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onForgotEmail(e) {
    e.preventDefault();
    setBusy(true);
    setInfo('');
    setAuthError('');
    try {
      const result = await requestPasswordOtp(form.email);
      if (!result.ok) return;
      setInfo('If an account exists for that email, an OTP has been sent. Enter it below.');
      setForgotStep('otp');
      flashToast('OTP sent — check your email');
    } finally {
      setBusy(false);
    }
  }

  async function onForgotComplete(e) {
    e.preventDefault();
    setBusy(true);
    setInfo('');
    setAuthError('');
    try {
      const result = await completePasswordReset({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      if (!result.ok) return;
      setInfo('Password updated. You can log in with your new password.');
      setForgotStep(null);
      setForm((f) => ({ ...f, otp: '', newPassword: '', password: '' }));
      flashToast('Password updated — please log in');
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setInfo('');
    setAuthError('');

    try {
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
        if (!result.ok) return;
        if (result.needsEmailConfirm) {
          setInfo('Check your email to confirm your account, then log in.');
          flashToast('Confirm your email to finish signup');
          return;
        }
        flashToast(
          role === ROLES.FARMER
            ? `Welcome, ${form.fullName || 'Farmer'}! You're signed in.`
            : `Welcome, ${form.fullName || 'there'}! You're signed in.`
        );
        navigate(dashboardPathForRole(result.role));
        return;
      }

      const result = await signIn({
        email: form.email,
        password: form.password,
      });
      if (!result.ok) return;
      const label =
        result.role === ROLES.ADMIN
          ? 'Admin'
          : result.role === ROLES.FARMER
            ? 'Farmer'
            : 'Customer';
      flashToast(`Logged in as ${label}. Welcome back!`);
      navigate(dashboardPathForRole(result.role));
    } finally {
      setBusy(false);
    }
  }

  const showForgot = mode === 'login' && forgotStep;
  const title =
    forgotStep === 'email'
      ? 'Forgot your password?'
      : forgotStep === 'otp'
        ? 'Enter OTP & new password'
        : mode === 'login'
          ? 'Login to MarketLink'
          : 'Join the local food community';
  const subtitle =
    forgotStep === 'email'
      ? 'We will email a one-time code. Enter it next to set a new password.'
      : forgotStep === 'otp'
        ? 'Check your inbox for the 6-digit OTP, then choose a new password.'
        : isConfigured
          ? 'One secure login for every role. Customers shop on the site; farmers and admins open their dashboard after sign-in.'
          : 'Demo mode — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live auth.';

  return (
    <div className="auth-page">
      <div className="auth-image">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85"
          alt="Farmer working in a field"
        />
        <div className="auth-image-copy">
          <span className="auth-pill"><Leaf size={14} /> MarketLink</span>
          <b>Fresh from local hands.</b>
          <small>Discover nearby markets, pre-order produce, and support farmers in your community.</small>
          <ul className="auth-perks">
            <li><ShieldCheck size={15} /> Secure role-based access</li>
            <li><Sparkles size={15} /> Pickup-only, no delivery fees</li>
            <li><Leaf size={15} /> Local stock, weekly freshness</li>
          </ul>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <button className="auth-logo" type="button" onClick={() => navigate('/')}>
            <span><Leaf size={20} /></span>
            <div>
              <b>MarketLink</b>
              <small>Local food community</small>
            </div>
          </button>

          <div className="auth-head">
            <span className="eyebrow">
              {showForgot ? 'Account recovery' : mode === 'login' ? 'Welcome back' : 'Create your account'}
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {mode === 'login' && !showForgot && (
            <div className="auth-steps" aria-hidden>
              <span className="on">1. Sign in</span>
              <span>2. Shop or manage</span>
            </div>
          )}
          {mode === 'register' && (
            <div className="auth-steps" aria-hidden>
              <span className="on">1. Details</span>
              <span className={isFarmer ? 'on' : ''}>2. Role</span>
              <span>3. Start</span>
            </div>
          )}
          {forgotStep === 'email' && (
            <div className="auth-steps" aria-hidden>
              <span className="on">1. Email</span>
              <span>2. OTP</span>
              <span>3. New password</span>
            </div>
          )}
          {forgotStep === 'otp' && (
            <div className="auth-steps" aria-hidden>
              <span>1. Email</span>
              <span className="on">2. OTP</span>
              <span className="on">3. New password</span>
            </div>
          )}

          {forgotStep === 'email' ? (
            <form className="auth-form" onSubmit={onForgotEmail}>
              <label className="auth-field">
                <span className="auth-field-label"><Mail size={15} /> Email</span>
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
              </label>
              {(authError || info) && (
                <p className={'auth-msg' + (authError ? ' err' : ' ok')} role="alert">
                  {authError || info}
                </p>
              )}
              <button className="btn full auth-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : 'Send OTP'} <ArrowRight size={16} />
              </button>
            </form>
          ) : forgotStep === 'otp' ? (
            <form className="auth-form" onSubmit={onForgotComplete}>
              <label className="auth-field">
                <span className="auth-field-label"><Mail size={15} /> Email</span>
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
              </label>
              <label className="auth-field">
                <span className="auth-field-label"><KeyRound size={15} /> OTP code</span>
                <input required placeholder="6-digit code" value={form.otp} onChange={set('otp')} inputMode="numeric" autoComplete="one-time-code" />
              </label>
              <label className="auth-field">
                <span className="auth-field-label"><Lock size={15} /> New password</span>
                <input type="password" required placeholder="At least 6 characters" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" minLength={6} />
              </label>
              {(authError || info) && (
                <p className={'auth-msg' + (authError ? ' err' : ' ok')} role="alert">
                  {authError || info}
                </p>
              )}
              <button className="btn full auth-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : 'Update password'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              {mode === 'register' && (
                <>
                  <label className="auth-field">
                    <span className="auth-field-label"><User size={15} /> Full name</span>
                    <input required placeholder="Your full name" value={form.fullName} onChange={set('fullName')} />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field-label"><Phone size={15} /> Contact number</span>
                    <input required placeholder="03xx-xxxxxxx" value={form.contactNumber} onChange={set('contactNumber')} />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field-label"><MapPin size={15} /> Address</span>
                    <input required placeholder="Your pickup area" value={form.address} onChange={set('address')} />
                  </label>
                  <div className="role-toggle" role="group" aria-label="Account type">
                    <button type="button" className={!isFarmer ? 'selected' : ''} onClick={() => setIsFarmer(false)}>
                      <User size={16} /> Customer
                    </button>
                    <button type="button" className={isFarmer ? 'selected' : ''} onClick={() => setIsFarmer(true)}>
                      <Store size={16} /> Farmer
                    </button>
                  </div>
                  {isFarmer && (
                    <div className="auth-farmer-block">
                      <label className="auth-field">
                        <span className="auth-field-label"><Store size={15} /> Stall / business name</span>
                        <input required placeholder="Your farm or stall name" value={form.stallName} onChange={set('stallName')} />
                      </label>
                      <label className="auth-field">
                        <span className="auth-field-label"><GraduationCap size={15} /> Education level</span>
                        <select value={edu} onChange={(e) => setEdu(e.target.value)}>
                          <option value="educated">Educated</option>
                          <option value="uneducated">Uneducated</option>
                        </select>
                      </label>
                    </div>
                  )}
                </>
              )}
              <label className="auth-field">
                <span className="auth-field-label"><Mail size={15} /> Email</span>
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
              </label>
              <label className="auth-field">
                <span className="auth-field-label"><Lock size={15} /> Password</span>
                <input type="password" required placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} />
              </label>
              {mode === 'login' && (
                <div className="auth-forgot-row">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('email');
                      setAuthError('');
                      setInfo('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {(authError || info) && (
                <p className={'auth-msg' + (authError ? ' err' : ' ok')} role="alert">
                  {authError || info}
                </p>
              )}
              <button className="btn full auth-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div className="auth-switch">
            {showForgot ? (
              <button
                type="button"
                onClick={() => {
                  setForgotStep(null);
                  setAuthError('');
                  setInfo('');
                }}
              >
                ← Back to login
              </button>
            ) : mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => navigate('/register')}>Register</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')}>Login</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
