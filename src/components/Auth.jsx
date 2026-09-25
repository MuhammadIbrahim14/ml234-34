import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      ? t('auth.forgotTitle')
      : forgotStep === 'otp'
        ? t('auth.otpTitle')
        : mode === 'login'
          ? t('auth.loginTitle')
          : t('auth.registerTitle');
  const subtitle =
    forgotStep === 'email'
      ? t('auth.forgotSubtitle')
      : forgotStep === 'otp'
        ? t('auth.otpSubtitle')
        : isConfigured
          ? mode === 'login'
            ? t('auth.loginSubtitle')
            : t('auth.registerSubtitle')
          : t('auth.demoSubtitle');

  return (
    <div className="auth-page">
      <div className="auth-image">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85"
          alt={t('auth.imageAlt')}
        />
        <div className="auth-image-copy">
          <span className="auth-pill"><Leaf size={14} /> {t('auth.pill')}</span>
          <b>{t('auth.sideTitle')}</b>
          <small>{t('auth.sideBlurb')}</small>
          <ul className="auth-perks">
            <li><ShieldCheck size={15} /> {t('auth.perk1')}</li>
            <li><Sparkles size={15} /> {t('auth.perk2')}</li>
            <li><Leaf size={15} /> {t('auth.perk3')}</li>
          </ul>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <button className="auth-logo" type="button" onClick={() => navigate('/')}>
            <span><Leaf size={20} /></span>
            <div>
              <b>{t('pages.brand')}</b>
              <small>{t('auth.tagline')}</small>
            </div>
          </button>

          <div className="auth-head">
            <span className="eyebrow">
              {showForgot
                ? t('auth.forgotEyebrow')
                : mode === 'login'
                  ? t('auth.loginEyebrow')
                  : t('auth.registerEyebrow')}
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {mode === 'login' && !showForgot && (
            <p className="auth-role-note">{t('auth.rolePitchNote')}</p>
          )}

          {mode === 'login' && !showForgot && (
            <div className="auth-steps" aria-hidden>
              <span className="on">{t('auth.stepSignIn')}</span>
              <span>{t('auth.stepShop')}</span>
            </div>
          )}
          {mode === 'register' && (
            <div className="auth-steps" aria-hidden>
              <span className="on">{t('auth.stepDetails')}</span>
              <span className={isFarmer ? 'on' : ''}>{t('auth.stepRole')}</span>
              <span>{t('auth.stepStart')}</span>
            </div>
          )}
          {forgotStep === 'email' && (
            <div className="auth-steps" aria-hidden>
              <span className="on">{t('auth.stepEmail')}</span>
              <span>{t('auth.stepOtp')}</span>
              <span>{t('auth.stepNewPassword')}</span>
            </div>
          )}
          {forgotStep === 'otp' && (
            <div className="auth-steps" aria-hidden>
              <span>{t('auth.stepEmail')}</span>
              <span className="on">{t('auth.stepOtp')}</span>
              <span className="on">{t('auth.stepNewPassword')}</span>
            </div>
          )}

          {forgotStep === 'email' ? (
            <form className="auth-form" onSubmit={onForgotEmail}>
              <label className="auth-field">
                <span className="auth-field-label"><Mail size={15} /> {t('auth.email')}</span>
                <input type="email" required placeholder={t('auth.emailPlaceholder')} value={form.email} onChange={set('email')} autoComplete="email" />
              </label>
              {(authError || info) && (
                <p className={'auth-msg' + (authError ? ' err' : ' ok')} role="alert">
                  {authError || info}
                </p>
              )}
              <button className="btn full auth-submit" type="submit" disabled={busy}>
                {busy ? t('auth.busy') : t('auth.sendOtp')} <ArrowRight size={16} />
              </button>
            </form>
          ) : forgotStep === 'otp' ? (
            <form className="auth-form" onSubmit={onForgotComplete}>
              <label className="auth-field">
                <span className="auth-field-label"><Mail size={15} /> {t('auth.email')}</span>
                <input type="email" required placeholder={t('auth.emailPlaceholder')} value={form.email} onChange={set('email')} autoComplete="email" />
              </label>
              <label className="auth-field">
                <span className="auth-field-label"><KeyRound size={15} /> {t('auth.otp')}</span>
                <input required placeholder={t('auth.otpPlaceholder')} value={form.otp} onChange={set('otp')} inputMode="numeric" autoComplete="one-time-code" />
              </label>
              <label className="auth-field">
                <span className="auth-field-label"><Lock size={15} /> {t('auth.newPassword')}</span>
                <input type="password" required placeholder={t('auth.passwordPlaceholder')} value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" minLength={6} />
              </label>
              {(authError || info) && (
                <p className={'auth-msg' + (authError ? ' err' : ' ok')} role="alert">
                  {authError || info}
                </p>
              )}
              <button className="btn full auth-submit" type="submit" disabled={busy}>
                {busy ? t('auth.busy') : t('auth.updatePassword')} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              {mode === 'register' && (
                <>
                  <label className="auth-field">
                    <span className="auth-field-label"><User size={15} /> {t('auth.fullName')}</span>
                    <input required placeholder={t('auth.fullNamePlaceholder')} value={form.fullName} onChange={set('fullName')} />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field-label"><Phone size={15} /> {t('auth.phone')}</span>
                    <input required placeholder={t('auth.phonePlaceholder')} value={form.contactNumber} onChange={set('contactNumber')} />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field-label"><MapPin size={15} /> {t('auth.address')}</span>
                    <input required placeholder={t('auth.addressPlaceholder')} value={form.address} onChange={set('address')} />
                  </label>
                  <div className="role-toggle" role="group" aria-label={t('auth.accountType')}>
                    <button type="button" className={!isFarmer ? 'selected' : ''} onClick={() => setIsFarmer(false)}>
                      <User size={16} /> {t('auth.roleCustomer')}
                    </button>
                    <button type="button" className={isFarmer ? 'selected' : ''} onClick={() => setIsFarmer(true)}>
                      <Store size={16} /> {t('auth.roleFarmer')}
                    </button>
                  </div>
                  {isFarmer && (
                    <div className="auth-farmer-block">
                      <label className="auth-field">
                        <span className="auth-field-label"><Store size={15} /> {t('auth.stallName')}</span>
                        <input required placeholder={t('auth.stallPlaceholder')} value={form.stallName} onChange={set('stallName')} />
                      </label>
                      <label className="auth-field">
                        <span className="auth-field-label"><GraduationCap size={15} /> {t('auth.education')}</span>
                        <select value={edu} onChange={(e) => setEdu(e.target.value)}>
                          <option value="educated">{t('auth.educated')}</option>
                          <option value="uneducated">{t('auth.uneducated')}</option>
                        </select>
                      </label>
                    </div>
                  )}
                </>
              )}
              <label className="auth-field">
                <span className="auth-field-label"><Mail size={15} /> {t('auth.email')}</span>
                <input type="email" required placeholder={t('auth.emailPlaceholder')} value={form.email} onChange={set('email')} autoComplete="email" />
              </label>
              <label className="auth-field">
                <span className="auth-field-label"><Lock size={15} /> {t('auth.password')}</span>
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
                    {t('auth.forgotLink')}
                  </button>
                </div>
              )}
              {(authError || info) && (
                <p className={'auth-msg' + (authError ? ' err' : ' ok')} role="alert">
                  {authError || info}
                </p>
              )}
              <button className="btn full auth-submit" type="submit" disabled={busy}>
                {busy ? t('auth.busy') : mode === 'login' ? t('auth.login') : t('auth.createAccount')} <ArrowRight size={16} />
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
                ← {t('auth.backToLogin')}
              </button>
            ) : mode === 'login' ? (
              <>
                {t('auth.noAccount')}{' '}
                <button type="button" onClick={() => navigate('/register')}>{t('auth.registerLink')}</button>
              </>
            ) : (
              <>
                {t('auth.haveAccount')}{' '}
                <button type="button" onClick={() => navigate('/login')}>{t('auth.login')}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
