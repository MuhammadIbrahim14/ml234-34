import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listOrdersForFarmer, updateOrderStatus, acceptOrder, orderStats } from '../../lib/api/orders';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
import { ClipboardList, Clock3, ShoppingBag, TrendingUp } from 'lucide-react';

const NEXT = {
  placed: [
    { key: 'accept', status: 'accepted', accept: true },
    { key: 'decline', status: 'declined' },
  ],
  accepted: [{ key: 'readyForPickup', status: 'ready_for_pickup' }],
  ready_for_pickup: [{ key: 'complete', status: 'completed' }],
};

function statusLabel(t, status) {
  if (status === 'ready_for_pickup') return t('status.ready');
  const key = `status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function BestsellerBars({ items, t }) {
  if (!items?.length) {
    return <EmptyState title={t('dash.farmer.noBestsellers')} message={t('dash.farmer.noBestsellersMsg')} />;
  }
  const maxQty = Math.max(...items.map((x) => x.qty), 1);
  return (
    <div className="bestseller-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item) => {
        const pct = Math.round((item.qty / maxQty) * 100);
        return (
          <div key={item.product_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4, fontSize: 13 }}>
              <b>{item.name}</b>
              <small className="muted">
                {t('dash.farmer.soldRevenue', { qty: item.qty, revenue: Number(item.revenue).toLocaleString() })}
              </small>
            </div>
            <div
              role="presentation"
              style={{
                height: 10,
                borderRadius: 6,
                background: 'var(--soft, #e8efe6)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 6,
                  background: 'var(--primary, #3d6b3a)',
                  transition: 'width .35s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** @param {{ focus?: 'orders' | 'insights' }} props */
export default function FarmerOrders({ focus = 'orders' }) {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const { mode: incomingView, setMode: setIncomingView } = useDataViewMode('farmer-orders-in');
  const { mode: doneView, setMode: setDoneView } = useDataViewMode('farmer-orders-done');
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
  if (loading) return <LoadingBlock label={t('dash.farmer.loadingOrders')} />;

  const stats = orderStats(rows);
  const cards = [
    [t('dash.farmer.statTotalOrders'), stats.total, ShoppingBag],
    [t('dash.farmer.statPending'), stats.pending, Clock3],
    [t('dash.farmer.statCompleted'), stats.completed, ClipboardList],
    [t('dash.farmer.statRevenue'), `Rs ${stats.revenue.toLocaleString()}`, TrendingUp],
  ];
  const showOrdersTable = focus !== 'insights';

  const bestsellersPanel = (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.farmer.bestsellers')}</span>
          <h3>{t('dash.farmer.topProducts')}</h3>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('dash.farmer.bestsellersHint')}
      </p>
      <BestsellerBars items={stats.bestsellers} t={t} />
    </div>
  );

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
            <em>{t('dash.liveFromOrders')}</em>
          </div>
        ))}
      </div>
      {focus === 'insights' && bestsellersPanel}
      {showOrdersTable && (
        <div className="dash-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">{t('dash.farmer.preOrders')}</span>
              <h3>{t('dash.farmer.incomingOrders')}</h3>
            </div>
            {rows.length > 0 && <DataViewToolbar mode={incomingView} onChange={setIncomingView} />}
          </div>
          <ErrorBanner message={error} onRetry={load} />
          {!rows.length ? (
            <EmptyState title={t('dash.farmer.noOrders')} message={t('dash.farmer.noOrdersMsg')} />
          ) : (
            <DataView mode={incomingView}>
              {rows.map((o) => (
                <DataCard
                  key={o.order_id}
                  title={`#${o.order_id} — ${o.products?.name || t('dash.product')}`}
                  subtitle={[
                    `${t('common.qty')} ${o.quantity}`,
                    `${t('common.rs')} ${o.total_amount}`,
                    o.pickup_date || null,
                    o.pickup_slot || null,
                    o.customer?.full_name || null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  status={statusLabel(t, o.order_status)}
                  statusClass="s1"
                  actions={
                    (NEXT[o.order_status] || []).length > 0 ? (
                      <>
                        {(NEXT[o.order_status] || []).map((a) => (
                          <button key={a.key} type="button" disabled={busyId === o.order_id} onClick={() => act(o.order_id, a)}>
                            {t(`dash.farmer.${a.key}`)}
                          </button>
                        ))}
                      </>
                    ) : null
                  }
                />
              ))}
            </DataView>
          )}
        </div>
      )}
      {focus === 'insights' ? (
        <div className="dash-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">{t('dash.farmer.salesEyebrow')}</span>
              <h3>{t('dash.farmer.completedOrders')}</h3>
            </div>
            {rows.filter((o) => o.order_status === 'completed').length > 0 && (
              <DataViewToolbar mode={doneView} onChange={setDoneView} />
            )}
          </div>
          <ErrorBanner message={error} onRetry={load} />
          {!rows.filter((o) => o.order_status === 'completed').length ? (
            <EmptyState title={t('dash.farmer.noCompletedSales')} message={t('dash.farmer.noCompletedSalesMsg')} />
          ) : (
            <DataView mode={doneView}>
              {rows
                .filter((o) => o.order_status === 'completed')
                .slice(0, 20)
                .map((o) => (
                  <DataCard
                    key={o.order_id}
                    title={`#${o.order_id} — ${o.products?.name || t('dash.product')}`}
                    subtitle={o.pickup_date || o.order_date || ''}
                    details={[
                      { label: t('dash.colQty'), value: String(o.quantity) },
                      { label: t('dash.colAmount'), value: `Rs ${Number(o.total_amount || 0).toLocaleString()}` },
                    ]}
                  />
                ))}
            </DataView>
          )}
        </div>
      ) : (
        bestsellersPanel
      )}
    </>
  );
}
