import { useEffect, useState } from 'react';
import { navigate } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { getDashboardCounts } from '../../lib/api/admin';
import { listOrdersForFarmer, orderStats } from '../../lib/api/orders';
import { listProducts } from '../../lib/api/products';
import { listAnnouncements } from '../../lib/api/announcements';
import { DemoModeNotice, LoadingBlock, ErrorBanner, EmptyState } from '../ui/DataState';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Store, ClipboardList,
  BarChart3, Megaphone, CalendarDays, Clock3, TrendingUp, Plus
} from 'lucide-react';

function IconStat({ kind }) {
  const M = {
    Clock: Clock3,
    Shopping: ShoppingBag,
    Trend: TrendingUp,
    Package,
    Users,
    Store,
    Calendar: CalendarDays,
  };
  const C = M[kind] || LayoutDashboard;
  return <C size={19} />;
}

function quick(role) {
  const map = {
    farmer: [
      ['Add Product', 'List fresh stock', '/dashboard/farmer/add-product', Plus],
      ['Orders', 'Manage pre-orders', '/dashboard/farmer/pre-orders', ClipboardList],
      ['Insights', 'View performance', '/dashboard/farmer/sales-insights', BarChart3],
      ['Markets', 'Manage locations', '/dashboard/farmer/markets', Store],
    ],
    admin: [
      ['Manage Farmers', 'Review accounts', '/dashboard/admin/farmers', Users],
      ['Manage Markets', 'Edit markets', '/dashboard/admin/markets', Store],
      ['Reports', 'Open analytics', '/dashboard/admin/reports', BarChart3],
      ['Announcements', 'Publish updates', '/dashboard/admin/announcements', Megaphone],
    ],
    manager: [
      ['Orders', 'Review orders', '/dashboard/manager/orders', ShoppingBag],
      ['Inventory', 'Manage stock', '/dashboard/manager/inventory', Package],
      ['Pickup Slots', 'Set windows', '/dashboard/manager/pickup-slots', CalendarDays],
      ['Reports', 'Open analytics', '/dashboard/manager/reports', BarChart3],
    ],
  };
  return (map[role] || map.farmer).map(([t, s, p, i]) => ({ t, s, p, i }));
}

export default function DashboardOverview({ role }) {
  const { profile, user, isConfigured } = useAuth();
  const [cards, setCards] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (!isConfigured) {
        setCards([]);
        setActivity([]);
        setLoading(false);
        return;
      }
      if (role === 'farmer' && user?.id) {
        const [ordersRes, productsRes] = await Promise.all([
          listOrdersForFarmer(user.id),
          listProducts({ farmerId: user.id }),
        ]);
        if (cancelled) return;
        const stats = orderStats(ordersRes.data || []);
        setCards([
          ['Total Orders', String(stats.total), 'Shopping'],
          ['Pending Orders', String(stats.pending), 'Clock'],
          ['Revenue', `Rs ${stats.revenue.toLocaleString()}`, 'Trend'],
          ['Products', String((productsRes.data || []).length), 'Package'],
        ]);
        setActivity(
          (ordersRes.data || []).slice(0, 4).map((o) => ({
            text: `Order #${o.order_id} — ${o.products?.name || 'Product'} (${o.order_status})`,
            when: o.order_date ? new Date(o.order_date).toLocaleString() : '',
          }))
        );
        setError(ordersRes.error || productsRes.error);
      } else {
        const [countsRes, annRes] = await Promise.all([getDashboardCounts(), listAnnouncements({ publishedOnly: false })]);
        if (cancelled) return;
        const c = countsRes.data || {};
        setCards([
          ['Farmers', String(c.farmers || 0), 'Users'],
          ['Customers', String(c.customers || 0), 'Users'],
          ['Markets', String(c.markets || 0), 'Store'],
          ['Orders', String(c.orders || 0), 'Shopping'],
        ]);
        setActivity(
          (annRes.data || []).slice(0, 4).map((a) => ({
            text: a.title,
            when: a.created_at ? new Date(a.created_at).toLocaleString() : '',
          }))
        );
        setError(countsRes.error || annRes.error);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [role, user?.id, isConfigured]);

  const greetName = profile?.full_name || (role === 'admin' ? 'MarketLink Admin' : 'there');

  return (
    <>
      <section className="dash-hero">
        <div>
          <span className="eyebrow">Good day, {greetName}</span>
          <h1>Everything you need, in one place.</h1>
          <p>Manage markets, fresh produce, orders and community activity with a smooth MarketLink workspace.</p>
        </div>
        <div className="dash-hero-art">
          <img src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=900&q=85" alt="Fresh vegetables on a farm table" />
        </div>
      </section>
      {!isConfigured && <DemoModeNotice />}
      {loading ? (
        <LoadingBlock label="Loading overview…" />
      ) : (
        <>
          <ErrorBanner message={error} />
          {cards.length > 0 && (
            <div className="dash-stats">
              {cards.map(([label, val, kind]) => (
                <div className="dash-stat" key={label}>
                  <span>
                    <IconStat kind={kind} />
                  </span>
                  <small>{label}</small>
                  <strong>{val}</strong>
                  <em>Live data</em>
                </div>
              ))}
            </div>
          )}
          <div className="dash-lower">
            <section className="dash-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Activity</span>
                  <h3>Recent activity</h3>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/' + role + '/orders')}>
                  View all
                </button>
              </div>
              {!activity.length ? (
                <EmptyState title="No activity yet" message="Live orders and announcements will show up here." />
              ) : (
                activity.map((x, i) => (
                  <div className="activity" key={x.text + i}>
                    <span className={'activity-dot d' + (i % 4)} />
                    <div>
                      <b>{x.text}</b>
                      <small>{x.when || 'Recently'}</small>
                    </div>
                    <span className="activity-arrow">›</span>
                  </div>
                ))
              )}
            </section>
            <section className="dash-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Quick actions</span>
                  <h3>What do you want to do?</h3>
                </div>
              </div>
              <div className="quick-grid">
                {quick(role).map((q) => (
                  <button key={q.t} type="button" onClick={() => navigate(q.p)}>
                    <q.i size={20} />
                    <b>{q.t}</b>
                    <small>{q.s}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
