import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listAllOrders } from '../../lib/api/orders';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';

function statusLabel(t, status) {
  if (status === 'ready_for_pickup') return t('status.ready');
  const key = `status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

export default function AdminOrders() {
  const { t } = useTranslation();
  const { isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('admin-orders');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listAllOrders();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingOrders')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.platform')}</span>
          <h3>{t('dash.admin.orders')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {!rows.length ? (
        <EmptyState title={t('dash.admin.noOrders')} message={t('dash.admin.noOrdersMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((o) => (
            <DataCard
              key={o.order_id}
              title={`#${o.order_id} — ${o.products?.name || t('dash.product')}`}
              subtitle={`${o.customer?.full_name || t('dash.customer')} → ${o.farmer?.full_name || t('dash.farmerRole')}`}
              status={statusLabel(t, o.order_status)}
              statusClass="s1"
              details={[
                { label: t('dash.colProduct'), value: o.products?.name },
                { label: t('dash.customer'), value: o.customer?.full_name },
                { label: t('dash.farmerRole'), value: o.farmer?.full_name },
                { label: t('common.qty'), value: o.quantity != null ? String(o.quantity) : '' },
                {
                  label: t('dash.colAmount'),
                  value: o.total_amount != null ? `${t('common.rs')} ${o.total_amount}` : '',
                },
                { label: t('dash.fields.status'), value: statusLabel(t, o.order_status) },
                { label: t('dash.fields.created'), value: formatWhen(o.created_at) },
                { label: 'ID', value: o.order_id },
              ]}
            />
          ))}
        </DataView>
      )}
    </div>
  );
}
