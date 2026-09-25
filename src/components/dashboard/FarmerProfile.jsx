import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyFarmerProfile, updateFarmerProfile } from '../../lib/api/farmers';
import { updateMyProfile } from '../../lib/api/profiles';
import { listMarkets } from '../../lib/api/markets';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';
import ImageUploadField from '../ui/ImageUploadField';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function FarmerProfile() {
  const { user, profile, isConfigured, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    stall_name: '',
    contact_person: '',
    education_level: '',
    operating_days: [],
    pickup_windows: [],
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
    const patch = {
      stall_name: form.stall_name.trim(),
      contact_person: form.contact_person.trim() || null,
      education_level: form.education_level.trim() || null,
      operating_days: form.operating_days,
      pickup_windows: form.pickup_windows,
      latitude: form.latitude !== '' ? Number(form.latitude) : null,
      longitude: form.longitude !== '' ? Number(form.longitude) : null,
    };
    if (!patch.stall_name) {
      setError('Stall name is required.');
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
    else setOk('Profile saved.');
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading profile…" />;

  return (
    <div className="panel-grid">
      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Farmer</span>
            <h3>Stall profile</h3>
          </div>
        </div>
        <ErrorBanner message={error} />
        <SuccessNote message={ok} />
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Stall name
            <input required value={form.stall_name} onChange={(e) => setForm({ ...form, stall_name: e.target.value })} />
          </label>
          <label>
            Contact person
            <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </label>
          <label>
            Education level
            <input value={form.education_level} onChange={(e) => setForm({ ...form, education_level: e.target.value })} />
          </label>
          <label>
            Latitude
            <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          </label>
          <label>
            Longitude
            <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </label>
          <ImageUploadField
            label="Profile avatar"
            value={form.avatar_url}
            onChange={(url) => setForm({ ...form, avatar_url: url })}
            disabled={busy}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <b>Operating days</b>
            <div className="chips" style={{ marginTop: 8 }}>
              {DAYS.map((d) => (
                <button key={d} type="button" className={form.operating_days.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <b>Pickup windows</b>
            <div className="form-grid" style={{ marginTop: 8 }}>
              <label>
                Day
                <select value={windowDraft.day} onChange={(e) => setWindowDraft({ ...windowDraft, day: e.target.value })}>
                  {DAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Start
                <input type="time" value={windowDraft.start} onChange={(e) => setWindowDraft({ ...windowDraft, start: e.target.value })} />
              </label>
              <label>
                End
                <input type="time" value={windowDraft.end} onChange={(e) => setWindowDraft({ ...windowDraft, end: e.target.value })} />
              </label>
              <button type="button" className="btn sm" onClick={addWindow}>
                Add window
              </button>
            </div>
            {!form.pickup_windows.length ? (
              <p className="muted">No pickup windows yet.</p>
            ) : (
              <ul>
                {form.pickup_windows.map((w, i) => (
                  <li key={i}>
                    {w.label || `${w.day} ${w.start}–${w.end}`}{' '}
                    <button type="button" className="btn ghost sm" onClick={() => removeWindow(i)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Markets</span>
            <h3>Active markets</h3>
          </div>
        </div>
        {!markets.length ? (
          <EmptyState title="No markets yet" message="Ask an admin to add markets you can sell at." />
        ) : (
          <div className="mini-table">
            <div className="tr head">
              <span>Market</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>
            {markets.map((m) => (
              <div className="tr" key={m.market_id}>
                <span>
                  <b>{m.market_name}</b>
                  <small>{m.address || 'Address TBD'}</small>
                </span>
                <span className="status s2">{m.timings || (m.operating_days || []).join(', ') || '—'}</span>
                <span className="status s2">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
