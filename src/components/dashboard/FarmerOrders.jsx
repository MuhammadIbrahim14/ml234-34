import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listOrdersForFarmer, updateOrderStatus, acceptOrder, orderStats } from '../../lib/api/orders';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { ClipboardList, Clock3, ShoppingBag, TrendingUp } from 'lucide-react';

const NEXT = {
  placed: [
    { label: 'Accept', status: 'accepted', accept: true },
    { label: 'Decline', status: 'declined' },
  ],
  accepted: [{ label: 'Ready for pickup', status: 'ready_for_pickup' }],
  ready_for_pickup: [{ label: 'Complete', status: 'completed' }],
};

export default function FarmerOrders() {
  const { user, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listOrdersForFarmer(user.id);
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function act(orderId, action) {
    setBusyId(orderId);
    setError(null);
    const result = action.accept ? await acceptOrder(orderId) : await updateOrderStatus(orderId, action.status);
    setBusyId(null);
    if (result.error) setError(result.error);
    else await load();
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading orders…" />;

  const stats = orderStats(rows);
  const cards = [
    ['Total Orders', stats.total, ShoppingBag],
    ['Pending', stats.pending, Clock3],
    ['Completed', stats.completed, ClipboardList],
    ['Revenue', `Rs ${stats.revenue.toLocaleString()}`, TrendingUp],
  ];

  return (
    <>
      <div className="dash-stats">
        {cards.map(([label, val, Icon]) => (
          <div className="dash-stat" key={label}>
            <span>
              <Icon size={19} />
            </span>
            <small>{label}</small>
            <strong>{val}</strong>
            <em>Live from orders</em>
          </div>
        ))}
      </div>
      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Pre-orders</span>
            <h3>Incoming orders</h3>
          </div>
        </div>
        <ErrorBanner message={error} onRetry={load} />
        {!rows.length ? (
          <EmptyState title="No orders yet" message="When customers place pickup orders, they will appear here." />
        ) : (
          <div className="mini-table">
            <div className="tr head">
              <span>Order</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {rows.map((o) => (
              <div className="tr" key={o.order_id}>
                <span>
                  <b>
                    #{o.order_id} — {o.products?.name || 'Product'}
                  </b>
                  <small>
                    Qty {o.quantity} · Rs. {o.total_amount}
                    {o.pickup_date ? ` · ${o.pickup_date}` : ''}
                    {o.pickup_slot ? ` · ${o.pickup_slot}` : ''}
                    {o.customer?.full_name ? ` · ${o.customer.full_name}` : ''}
                  </small>
                </span>
                <span className="status s1">{o.order_status}</span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(NEXT[o.order_status] || []).map((a) => (
                    <button key={a.label} type="button" disabled={busyId === o.order_id} onClick={() => act(o.order_id, a)}>
                      {a.label}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
