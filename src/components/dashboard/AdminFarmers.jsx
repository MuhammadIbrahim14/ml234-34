import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listAllFarmerProfiles, setFarmerApproved } from '../../lib/api/farmers';
import { setProfileStatus } from '../../lib/api/admin';
import { createNotification } from '../../lib/api/notifications';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

function formatWindows(windows) {
  if (!Array.isArray(windows) || !windows.length) return '';
  return windows
    .map((w) => {
      if (typeof w === 'string') return w;
      if (w && (w.label || w.start || w.end)) return [w.label, w.start, w.end].filter(Boolean).join(' ');
      try {
        return JSON.stringify(w);
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join(' · ');
}

export default function AdminFarmers() {
  const { t } = useTranslation();
  const { isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('admin-farmers');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listAllFarmerProfiles();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(userId, approved) {
    setBusyId(userId);
    setOk('');
    const { error: err } = await setFarmerApproved(userId, approved);
    if (!err && approved) {
      await setProfileStatus(userId, 'active');
      await createNotification({
        userId,
        title: 'Welcome to MarketLink',
        body: 'Your farmer account is approved. You can now publish products and manage pre-orders.',
        link: '/dashboard/farmer/add-product',
      });
    }
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(approved ? t('dash.admin.farmerApproved') : t('dash.admin.approvalRevoked'));
      await load();
    }
  }

  async function setStatus(userId, status) {
    setBusyId(userId);
    const { error: err } = await setProfileStatus(userId, status);
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(t('dash.admin.statusSet', { status }));
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingFarmers')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.accounts')}</span>
          <h3>{t('dash.admin.farmers')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title={t('dash.admin.noFarmers')} message={t('dash.admin.noFarmersMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((f) => {
            const p = f.profiles || {};
            const days = Array.isArray(f.operating_days) ? f.operating_days.join(', ') : f.operating_days;
            const coords =
              f.latitude != null && f.longitude != null ? `${f.latitude}, ${f.longitude}` : '';
            return (
              <DataCard
                key={f.id}
                title={f.stall_name || p.full_name || p.email || f.user_id}
                subtitle={f.approved ? t('dash.admin.approvedTag') : t('dash.admin.pendingApproval')}
                status={p.status || '—'}
                statusClass={p.status === 'active' ? 's2' : 's1'}
                details={[
                  { label: t('dash.fields.stall'), value: f.stall_name },
                  { label: t('dash.fields.contact'), value: f.contact_person || p.full_name },
                  { label: t('dash.fields.email'), value: p.email },
                  { label: t('dash.fields.phone'), value: p.contact_number },
                  { label: t('dash.fields.address'), value: p.address },
                  { label: t('dash.fields.education'), value: f.education_level },
                  { label: t('dash.fields.operatingDays'), value: days },
                  { label: t('dash.fields.pickupWindows'), value: formatWindows(f.pickup_windows) },
                  {
                    label: t('dash.fields.cutoff'),
                    value: f.order_cutoff_minutes != null ? String(f.order_cutoff_minutes) : '',
                  },
                  { label: t('dash.fields.coords'), value: coords },
                  {
                    label: t('dash.fields.approved'),
                    value: f.approved ? t('dash.admin.approvedTag') : t('dash.admin.pendingApproval'),
                  },
                  { label: t('dash.fields.status'), value: p.status },
                  { label: t('dash.fields.created'), value: formatWhen(f.created_at) },
                  { label: t('dash.fields.updated'), value: formatWhen(f.updated_at) },
                  { label: 'User ID', value: f.user_id },
                ]}
                actions={
                  <>
                    {!f.approved && (
                      <button type="button" disabled={busyId === f.user_id} onClick={() => approve(f.user_id, true)}>
                        {t('dash.admin.approve')}
                      </button>
                    )}
                    {f.approved && (
                      <button type="button" disabled={busyId === f.user_id} onClick={() => approve(f.user_id, false)}>
                        {t('dash.admin.unapprove')}
                      </button>
                    )}
                    <button type="button" disabled={busyId === f.user_id} onClick={() => setStatus(f.user_id, 'active')}>
                      {t('dash.admin.activate')}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === f.user_id}
                      onClick={() => setStatus(f.user_id, 'suspended')}
                    >
                      {t('dash.admin.suspend')}
                    </button>
                  </>
                }
              />
            );
          })}
        </DataView>
      )}
    </div>
  );
}
