import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { updateMyProfile } from '../../lib/api/profiles';
import { LoadingBlock, ErrorBanner, DemoModeNotice, SuccessNote } from '../ui/DataState';
import ImageUploadField from '../ui/ImageUploadField';

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { user, profile, isConfigured, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    contact_number: '',
    address: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (!profile && !user) return;
    setForm({
      full_name: profile?.full_name || '',
      contact_number: profile?.contact_number || '',
      address: profile?.address || '',
      avatar_url: profile?.avatar_url || '',
    });
    setLoading(false);
  }, [profile, user]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!user?.id) return;
    setBusy(true);
    setOk('');
    setError(null);
    const { data, error: err } = await updateMyProfile(user.id, form);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setOk(t('dash.settings.saved'));
    if (typeof refreshProfile === 'function') await refreshProfile();
    else if (data) {
      setForm({
        full_name: data.full_name || '',
        contact_number: data.contact_number || '',
        address: data.address || '',
        avatar_url: data.avatar_url || '',
      });
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.settings.loading')} />;

  return (
    <div className="dash-panel action-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.settings.account')}</span>
          <h3>{t('dash.settings.title')}</h3>
        </div>
      </div>
      <ErrorBanner message={error} />
      <SuccessNote message={ok} />
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          {t('dash.settings.fullName')}
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </label>
        <label>
          {t('dash.settings.contactNumber')}
          <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          {t('dash.settings.address')}
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <ImageUploadField
          label={t('dash.settings.avatar')}
          value={form.avatar_url}
          onChange={(url) => setForm({ ...form, avatar_url: url })}
          disabled={busy}
        />
        <p className="muted" style={{ gridColumn: '1 / -1', fontSize: 12, margin: 0 }}>
          {t('dash.settings.emailManaged', { email: profile?.email || user?.email || '—' })}
        </p>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t('common.saving') : t('dash.settings.saveProfile')}
        </button>
      </form>
    </div>
  );
}
