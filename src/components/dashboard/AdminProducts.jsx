import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listProducts, setProductAvailable, deleteProduct } from '../../lib/api/products';
import { productFarmerName } from '../../lib/api/products';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

export default function AdminProducts({ moderation = false }) {
  const { t } = useTranslation();
  const { isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('admin-products');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listProducts({ limit: 200, approvedFarmersOnly: false });
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function hide(id) {
    const { error: err } = await setProductAvailable(id, false);
    if (err) setError(err);
    else {
      setOk(t('dash.admin.productHidden'));
      await load();
    }
  }

  async function confirmDelete() {
    setBusy(true);
    const { error: err, data } = await deleteProduct(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (err) setError(err);
    else {
      setOk(
        data?.hiddenDueToOrders
          ? t('dash.admin.productHiddenDueToOrders')
          : t('dash.admin.productDeleted')
      );
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingProducts')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{moderation ? t('dash.admin.moderation') : t('dash.admin.catalog')}</span>
          <h3>{moderation ? t('dash.admin.productModeration') : t('dash.admin.allProducts')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title={t('dash.admin.noProducts')} message={t('dash.admin.noProductsMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((p) => (
            <DataCard
              key={p.product_id}
              title={p.name}
              subtitle={`${productFarmerName(p)} · ${t('common.rs')} ${p.price}/${p.unit}`}
              status={p.is_available ? t('common.available') : t('common.hidden')}
              statusClass={p.is_available ? 's2' : 's1'}
              details={[
                { label: t('dash.colFarmer'), value: productFarmerName(p) },
                {
                  label: t('dash.colAmount'),
                  value: p.price != null ? `${t('common.rs')} ${p.price}/${p.unit || ''}` : '',
                },
                { label: t('dash.fields.status'), value: p.is_available ? t('common.available') : t('common.hidden') },
                { label: t('dash.fields.created'), value: formatWhen(p.created_at) },
                { label: t('dash.fields.updated'), value: formatWhen(p.updated_at) },
                { label: 'ID', value: p.product_id },
              ]}
              actions={
                <>
                  {p.is_available && (
                    <button type="button" onClick={() => hide(p.product_id)}>
                      {t('dash.admin.hide')}
                    </button>
                  )}
                  <button type="button" onClick={() => setDeleteId(p.product_id)}>
                    {t('common.delete')}
                  </button>
                </>
              }
            />
          ))}
        </DataView>
      )}
      <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
