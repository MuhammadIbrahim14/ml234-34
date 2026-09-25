import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getMyFarmerProfile, updateFarmerProfile } from '../../lib/api/farmers';
import { updateMyProfile } from '../../lib/api/profiles';
import { listMarkets } from '../../lib/api/markets';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
import ImageUploadField from '../ui/ImageUploadField';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function FarmerProfile() {
  const { t } = useTranslation();
  const { user, profile, isConfigured, refreshProfile } = useAuth();
  const { mode, setMode } = useDataViewMode('farmer-markets');
  const [form, setForm] = useState({
    stall_name: '',
    contact_person: '',
    education_level: '',
    operating_days: [],
    pickup_windows: [],
    order_cutoff_minutes: 120,
    latitude: '',
    longitude: '',
    avatar_url: '',
  });
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [windowDraft, setWindowDraft] = useState({ day: 'Sat', start: '09:00', end: '12:00' });

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const [fp, mk] = await Promise.all([getMyFarmerProfile(user.id), listMarkets({ activeOnly: true })]);
    setMarkets(mk.data || []);
    if (fp.data) {
      setForm({
        stall_name: fp.data.stall_name || '',
        contact_person: fp.data.contact_person || '',
        education_level: fp.data.education_level || '',
        operating_days: fp.data.operating_days || [],
        pickup_windows: Array.isArray(fp.data.pickup_windows) ? fp.data.pickup_windows : [],
        order_cutoff_minutes:
          fp.data.order_cutoff_minutes != null ? Number(fp.data.order_cutoff_minutes) : 120,
        latitude: fp.data.latitude != null ? String(fp.data.latitude) : '',
        longitude: fp.data.longitude != null ? String(fp.data.longitude) : '',
        avatar_url: profile?.avatar_url || fp.data.profiles?.avatar_url || '',
      });
    } else {
      setForm((f) => ({ ...f, avatar_url: profile?.avatar_url || '' }));
    }
    setError(fp.error || mk.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      operating_days: f.operating_days.includes(day)
        ? f.operating_days.filter((d) => d !== day)
        : [...f.operating_days, day],
    }));
  }

  function addWindow() {
    const label = `${windowDraft.day} ${windowDraft.start}–${windowDraft.end}`;
    setForm((f) => ({
      ...f,
      pickup_windows: [...f.pickup_windows, { day: windowDraft.day, start: windowDraft.start, end: windowDraft.end, label }],
    }));
  }

  function removeWindow(idx) {
    setForm((f) => ({ ...f, pickup_windows: f.pickup_windows.filter((_, i) => i !== idx) }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setOk('');
    setError(null);
    const cutoff = Number(form.order_cutoff_minutes);
    if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 10080) {
      setError(t('dash.farmer.cutoffInvalid'));
      setBusy(false);
      return;
    }
    const patch = {
      stall_name: form.stall_name.trim(),
      contact_person: form.contact_person.trim() || null,
      education_level: form.education_level.trim() || null,
      operating_days: form.operating_days,
      pickup_windows: form.pickup_windows,
      order_cutoff_minutes: Math.floor(cutoff),
      latitude: form.latitude !== '' ? Number(form.latitude) : null,
      longitude: form.longitude !== '' ? Number(form.longitude) : null,
    };
    if (!patch.stall_name) {
      setError(t('dash.farmer.stallRequired'));
      setBusy(false);
      return;
    }
    const { error: err } = await updateFarmerProfile(user.id, patch);
    if (!err) {
      await updateMyProfile(user.id, { avatar_url: form.avatar_url || null });
      if (typeof refreshProfile === 'function') await refreshProfile();
    }
    setBusy(false);
    if (err) setError(err);
    else setOk(t('dash.farmer.profileSaved'));
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.farmer.loadingProfile')} />;

  return (
    <div className="panel-grid">
      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.farmer.stallEyebrow')}</span>
            <h3>{t('dash.farmer.stallProfile')}</h3>
          </div>
        </div>
        <ErrorBanner message={error} />
        <SuccessNote message={ok} />
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            {t('dash.farmer.stallName')}
            <input required value={form.stall_name} onChange={(e) => setForm({ ...form, stall_name: e.target.value })} />
          </label>
          <label>
            {t('dash.farmer.contactPerson')}
            <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </label>
          <label>
            {t('dash.farmer.educationLevel')}
            <input value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} />
          </label>
          <label>
            {t('dash.farmer.latitude')}
            <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          </label>
          <label>
            {t('dash.farmer.longitude')}
            <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </label>
          <ImageUploadField
            label={t('dash.farmer.profileAvatar')}
            value={form.avatar_url}
            onChange={(url) => setForm({ ...form, avatar_url: url })}
            disabled={busy}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <b>{t('dash.farmer.operatingDays')}</b>
            <div className="chips" style={{ marginTop: 8 }}>
              {DAYS.map((d) => (
                <button key={d} type="button" className={form.operating_days.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <b>{t('dash.farmer.pickupWindows')}</b>
            <div className="form-grid" style={{ marginTop: 8 }}>
              <label>
                {t('dash.farmer.day')}
                <select value={windowDraft.day} onChange={(e) => setWindowDraft({ ...windowDraft, day: e.target.value })}>
                  {DAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('dash.farmer.start')}
                <input type="time" value={windowDraft.start} onChange={(e) => setWindowDraft({ ...windowDraft, start: e.target.value })} />
              </label>
              <label>
                {t('dash.farmer.end')}
                <input type="time" value={windowDraft.end} onChange={(e) => setWindowDraft({ ...windowDraft, end: e.target.value })} />
              </label>
              <button type="button" className="btn sm" onClick={addWindow}>
                {t('dash.farmer.addWindow')}
              </button>
            </div>
            {!form.pickup_windows.length ? (
              <p className="muted">{t('dash.farmer.noWindows')}</p>
            ) : (
              <ul>
                {form.pickup_windows.map((w, i) => (
                  <li key={i}>
                    {w.label || `${w.day} ${w.start}–${w.end}`}{' '}
                    <button type="button" className="btn ghost sm" onClick={() => removeWindow(i)}>
                      {t('dash.farmer.remove')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label style={{ display: 'block', marginTop: 12 }}>
              {t('dash.farmer.orderCutoff')}
              <input
                type="number"
                min="0"
                max="10080"
                step="1"
                value={form.order_cutoff_minutes}
                onChange={(e) => setForm({ ...form, order_cutoff_minutes: e.target.value })}
              />
              <small className="muted">
                {t('dash.farmer.orderCutoffHint')}
              </small>
            </label>
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? t('common.saving') : t('dash.farmer.saveProfile')}
          </button>
        </form>
      </div>
      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.farmer.marketsEyebrow')}</span>
            <h3>{t('dash.farmer.activeMarkets')}</h3>
          </div>
          {markets.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
        </div>
        {!markets.length ? (
          <EmptyState title={t('dash.farmer.noMarkets')} message={t('dash.farmer.noMarketsMsg')} />
        ) : (
          <DataView mode={mode}>
            {markets.map((m) => (
              <DataCard
                key={m.market_id}
                title={m.market_name}
                subtitle={m.address || t('home.addressTbd')}
                status={t('common.active')}
                statusClass="s2"
                details={[
                  {
                    label: t('dash.colSchedule'),
                    value: m.timings || (m.operating_days || []).join(', ') || '—',
                  },
                ]}
              />
            ))}
          </DataView>
        )}
      </div>
    </div>
  );
}
