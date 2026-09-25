import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listAllOrders } from '../../lib/api/orders';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';

export default function AdminOrders() {
  const { isConfigured } = useAuth();
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
  if (loading) return <LoadingBlock label="Loading orders…" />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Platform</span>
          <h3>Orders</h3>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {!rows.length ? (
        <EmptyState title="No orders yet" message="Customer pickup orders will appear here." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>Order</span>
            <span>Status</span>
            <span>Amount</span>
          </div>
          {rows.map((o) => (
            <div className="tr" key={o.order_id}>
              <span>
                <b>
                  #{o.order_id} — {o.products?.name || 'Product'}
                </b>
                <small>
                  {o.customer?.full_name || 'Customer'} → {o.farmer?.full_name || 'Farmer'} · qty {o.quantity}
                </small>
              </span>
              <span className="status s1">{o.order_status}</span>
              <span>
                <b>Rs. {o.total_amount}</b>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
