import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listAllFarmerProfiles } from '../../lib/api/farmers';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
import { isSupabaseConfigured } from '../../lib/supabase';

function formatWindows(windows) {
  if (!Array.isArray(windows) || !windows.length) return '';
  return windows
    .map((w) => w.label || `${w.day} ${w.start}–${w.end}`)
    .filter(Boolean)
    .join(' · ');
}

/** Read-only view of farmer pickup_windows for admin/manager. */
export default function AdminPickupSlots() {
  const { t } = useTranslation();
  const { mode, setMode } = useDataViewMode('admin-pickup-slots');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (!isSupabaseConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingSlots')} />;

  const withWindows = rows.filter((f) => Array.isArray(f.pickup_windows) && f.pickup_windows.length);

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.schedule')}</span>
          <h3>{t('dash.admin.pickupSlots')}</h3>
        </div>
        {withWindows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('dash.admin.pickupSlotsHint')}
      </p>
      <ErrorBanner message={error} onRetry={load} />
      {!withWindows.length ? (
        <EmptyState title={t('dash.admin.noSlots')} message={t('dash.admin.noSlotsMsg')} />
      ) : (
        <DataView mode={mode}>
          {withWindows.map((f) => (
            <DataCard
              key={f.id}
              title={f.stall_name}
              subtitle={f.profiles?.full_name || f.contact_person || f.profiles?.email || '—'}
              status={f.approved ? t('status.approved') : t('dash.admin.pendingStatus')}
              statusClass={f.approved ? 's2' : 's1'}
              details={[
                {
                  label: t('dash.fields.contact'),
                  value: f.profiles?.full_name || f.contact_person || f.profiles?.email,
                },
                { label: t('dash.colWindows'), value: formatWindows(f.pickup_windows) },
                {
                  label: t('dash.fields.approved'),
                  value: f.approved ? t('status.approved') : t('dash.admin.pendingStatus'),
                },
                { label: 'ID', value: f.id },
              ]}
            />
          ))}
        </DataView>
      )}
    </div>
  );
}
