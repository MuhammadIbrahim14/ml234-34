import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { getDashboardCounts } from '../../lib/api/admin';
import { listOrdersForFarmer, orderStats } from '../../lib/api/orders';
import { listProducts } from '../../lib/api/products';
import { listAnnouncements } from '../../lib/api/announcements';
import { DemoModeNotice, LoadingBlock, ErrorBanner, EmptyState } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
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

function quick(role, t) {
  const map = {
    farmer: [
      [t('dash.farmer.qaAddProduct'), t('dash.farmer.qaAddProductSub'), '/dashboard/farmer/add-product', Plus],
      [t('dash.farmer.qaOrders'), t('dash.farmer.qaOrdersSub'), '/dashboard/farmer/pre-orders', ClipboardList],
      [t('dash.farmer.qaInsights'), t('dash.farmer.qaInsightsSub'), '/dashboard/farmer/sales-insights', BarChart3],
      [t('dash.farmer.qaMarkets'), t('dash.farmer.qaMarketsSub'), '/dashboard/farmer/markets', Store],
    ],
    admin: [
      [t('dash.admin.qaManageFarmers'), t('dash.admin.qaManageFarmersSub'), '/dashboard/admin/farmers', Users],
      [t('dash.admin.qaManageMarkets'), t('dash.admin.qaManageMarketsSub'), '/dashboard/admin/markets', Store],
      [t('dash.admin.qaReports'), t('dash.admin.qaReportsSub'), '/dashboard/admin/reports', BarChart3],
      [t('dash.admin.qaAnnouncements'), t('dash.admin.qaAnnouncementsSub'), '/dashboard/admin/announcements', Megaphone],
    ],
    manager: [
      [t('dash.admin.qaOrders'), t('dash.admin.qaOrdersSub'), '/dashboard/manager/orders', ShoppingBag],
      [t('dash.admin.qaInventory'), t('dash.admin.qaInventorySub'), '/dashboard/manager/inventory', Package],
      [t('dash.admin.qaPickupSlots'), t('dash.admin.qaPickupSlotsSub'), '/dashboard/manager/pickup-slots', CalendarDays],
      [t('dash.admin.qaReports'), t('dash.admin.qaReportsSub'), '/dashboard/manager/reports', BarChart3],
    ],
  };
  return (map[role] || map.farmer).map(([title, sub, p, i]) => ({ t: title, s: sub, p, i }));
}

export default function DashboardOverview({ role }) {
  const { t } = useTranslation();
  const { profile, user, isConfigured } = useAuth();
  const { mode: bestsellersView, setMode: setBestsellersView } = useDataViewMode('dash-bestsellers');
  const [cards, setCards] = useState([]);
  const [activity, setActivity] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (!isConfigured) {
        setCards([]);
        setActivity([]);
        setBestsellers([]);
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
          ['totalOrders', String(stats.total), 'Shopping'],
          ['pendingOrders', String(stats.pending), 'Clock'],
          ['revenue', `Rs ${stats.revenue.toLocaleString()}`, 'Trend'],
          ['products', String((productsRes.data || []).length), 'Package'],
        ]);
        setBestsellers(stats.bestsellers || []);
        setActivity(
          (ordersRes.data || []).slice(0, 4).map((o) => ({
            text: `Order #${o.order_id} — ${o.products?.name || t('dash.product')} (${o.order_status})`,
            when: o.order_date ? new Date(o.order_date).toLocaleString() : '',
          }))
        );
        setError(ordersRes.error || productsRes.error);
      } else {
        const [countsRes, annRes] = await Promise.all([getDashboardCounts(), listAnnouncements({ publishedOnly: false })]);
        if (cancelled) return;
        const c = countsRes.data || {};
        setCards([
          ['farmers', String(c.farmers || 0), 'Users'],
          ['customers', String(c.customers || 0), 'Users'],
          ['markets', String(c.markets || 0), 'Store'],
          ['orders', String(c.orders || 0), 'Shopping'],
        ]);
        setBestsellers([]);
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
  }, [role, user?.id, isConfigured, t]);

  const greetName =
    profile?.full_name || (role === 'admin' ? t('dash.adminName') : 'there');
  const displayGreet = t('dash.farmer.greet', { name: greetName });

  const cardLabel = (key) => {
    const farmerMap = {
      totalOrders: t('dash.farmer.statTotalOrders'),
      pendingOrders: t('dash.farmer.statPendingOrders'),
      revenue: t('dash.farmer.statRevenue'),
      products: t('dash.farmer.statProducts'),
    };
    const adminMap = {
      farmers: t('dash.admin.statFarmers'),
      customers: t('dash.admin.statCustomers'),
      markets: t('dash.admin.statMarkets'),
      orders: t('dash.admin.statOrders'),
    };
    return farmerMap[key] || adminMap[key] || key;
  };

  return (
    <>
      <section className="dash-hero">
        <div>
          <span className="eyebrow">{displayGreet}</span>
          <h1>{t('dash.farmer.heroTitle')}</h1>
          <p>{t('dash.farmer.heroLead')}</p>
        </div>
        <div className="dash-hero-art">
          <img src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=900&q=85" alt={t('dash.farmer.heroAlt')} />
        </div>
      </section>
      {!isConfigured && <DemoModeNotice />}
      {loading ? (
        <LoadingBlock label={t('dash.farmer.loadingOverview')} />
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
                  <small>{cardLabel(label)}</small>
                  <strong>{val}</strong>
                  <em>{t('dash.liveData')}</em>
                </div>
              ))}
            </div>
          )}
          <div className="dash-lower">
            <section className="dash-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">{t('dash.farmer.activityEyebrow')}</span>
                  <h3>{t('dash.farmer.recentActivity')}</h3>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/' + role + '/orders')}>
                  {t('dash.farmer.viewAll')}
                </button>
              </div>
              {!activity.length ? (
                <EmptyState title={t('dash.farmer.noActivity')} message={t('dash.farmer.noActivityMsg')} />
              ) : (
                activity.map((x, i) => (
                  <div className="activity" key={x.text + i}>
                    <span className={'activity-dot d' + (i % 4)} />
                    <div>
                      <b>{x.text}</b>
                      <small>{x.when || t('dash.farmer.recently')}</small>
                    </div>
                    <span className="activity-arrow">›</span>
                  </div>
                ))
              )}
            </section>
            <section className="dash-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">{t('dash.farmer.quickEyebrow')}</span>
                  <h3>{t('dash.farmer.quickTitle')}</h3>
                </div>
              </div>
              <div className="quick-grid">
                {quick(role, t).map((q) => (
                  <button key={q.t} type="button" onClick={() => navigate(q.p)}>
                    <q.i size={20} />
                    <b>{q.t}</b>
                    <small>{q.s}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
          {role === 'farmer' && (
            <section className="dash-panel" style={{ marginTop: 16 }}>
              <div className="panel-title">
                <div>
                  <span className="eyebrow">{t('dash.farmer.bestsellers')}</span>
                  <h3>{t('dash.farmer.topProducts')}</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {bestsellers.length > 0 && (
                    <DataViewToolbar mode={bestsellersView} onChange={setBestsellersView} />
                  )}
                  <button type="button" onClick={() => navigate('/dashboard/farmer/sales-insights')}>
                    {t('dash.farmer.fullInsights')}
                  </button>
                </div>
              </div>
              {!bestsellers.length ? (
                <EmptyState title={t('dash.farmer.noSales')} message={t('dash.farmer.noSalesMsg')} />
              ) : (
                <DataView mode={bestsellersView}>
                  {bestsellers.map((b) => (
                    <DataCard
                      key={b.product_id}
                      title={b.name}
                      details={[
                        { label: t('dash.colSold'), value: String(b.qty) },
                        { label: t('dash.colRevenue'), value: `Rs ${Number(b.revenue).toLocaleString()}` },
                      ]}
                    />
                  ))}
                </DataView>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
