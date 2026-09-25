import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listCustomers, setProfileStatus } from '../../lib/api/admin';
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

export default function AdminCustomers() {
  const { t } = useTranslation();
  const { isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('admin-customers');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listCustomers();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    setBusyId(id);
    const { error: err } = await setProfileStatus(id, status);
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(t('dash.admin.customerStatus', { status }));
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingCustomers')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.accounts')}</span>
          <h3>{t('dash.admin.customers')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title={t('dash.admin.noCustomers')} message={t('dash.admin.noCustomersMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((c) => (
            <DataCard
              key={c.id}
              title={c.full_name || c.email || c.id}
              subtitle={c.full_name ? c.email : null}
              status={c.status}
              statusClass={c.status === 'active' ? 's2' : 's1'}
              details={[
                { label: t('dash.fields.email'), value: c.email },
                { label: t('dash.fields.phone'), value: c.contact_number || t('dash.admin.noPhone') },
                { label: t('dash.fields.address'), value: c.address },
                { label: t('dash.fields.role'), value: c.role },
                { label: t('dash.fields.status'), value: c.status },
                { label: t('dash.fields.created'), value: formatWhen(c.created_at) },
                { label: t('dash.fields.updated'), value: formatWhen(c.updated_at) },
                { label: 'ID', value: c.id },
              ]}
              actions={
                <>
                  <button type="button" disabled={busyId === c.id} onClick={() => setStatus(c.id, 'active')}>
                    {t('dash.admin.activate')}
                  </button>
                  <button type="button" disabled={busyId === c.id} onClick={() => setStatus(c.id, 'deactivated')}>
                    {t('dash.admin.deactivate')}
                  </button>
                </>
              }
            />
          ))}
        </DataView>
      )}
    </div>
  );
}
