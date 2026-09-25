import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listProducts, setProductAvailable, deleteProduct } from '../../lib/api/products';
import { productFarmerName } from '../../lib/api/products';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';

export default function AdminProducts({ moderation = false }) {
  const { isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listProducts({ limit: 200 });
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
      setOk('Product hidden from catalog.');
      await load();
    }
  }

  async function confirmDelete() {
    setBusy(true);
    const { error: err } = await deleteProduct(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (err) setError(err);
    else {
      setOk('Product deleted.');
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading products…" />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{moderation ? 'Moderation' : 'Catalog'}</span>
          <h3>{moderation ? 'Product moderation' : 'All products'}</h3>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title="No products yet" message="Products listed by farmers will appear here." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>Product</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {rows.map((p) => (
            <div className="tr" key={p.product_id}>
              <span>
                <b>{p.name}</b>
                <small>
                  {productFarmerName(p)} · Rs. {p.price}/{p.unit}
                </small>
              </span>
              <span className={'status ' + (p.is_available ? 's2' : 's1')}>{p.is_available ? 'Available' : 'Hidden'}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                {p.is_available && (
                  <button type="button" onClick={() => hide(p.product_id)}>
                    Hide
                  </button>
                )}
                <button type="button" onClick={() => setDeleteId(p.product_id)}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
