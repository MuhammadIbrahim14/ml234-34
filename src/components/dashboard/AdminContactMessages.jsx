import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listContactMessages } from '../../lib/api/contact';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
import { isSupabaseConfigured } from '../../lib/supabase';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

export default function AdminContactMessages() {
  const { t } = useTranslation();
  const { mode, setMode } = useDataViewMode('admin-contact-messages');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listContactMessages();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (!isSupabaseConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingMessages')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.inbox')}</span>
          <h3>{t('dash.admin.contactMessages')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {!rows.length ? (
        <EmptyState title={t('dash.admin.noMessages')} message={t('dash.admin.noMessagesMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((m) => (
            <DataCard
              key={m.id}
              title={m.name}
              subtitle={m.email}
              status={formatWhen(m.created_at) || '—'}
              statusClass="s1"
              details={[
                { label: t('dash.fields.email'), value: m.email },
                { label: t('dash.colMessage'), value: m.message },
                { label: t('dash.colWhen'), value: formatWhen(m.created_at) },
                { label: 'ID', value: m.id },
              ]}
            />
          ))}
        </DataView>
      )}
    </div>
  );
}
