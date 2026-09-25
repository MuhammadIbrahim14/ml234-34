import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByDateRange, saveReport, revenueByMarket, topFarmersByRevenue } from '../../lib/api/admin';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';

export default function AdminReports() {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const marketsView = useDataViewMode('admin-reports-markets');
  const farmersView = useDataViewMode('admin-reports-farmers');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    const fromIso = from ? new Date(from).toISOString() : null;
    const toIso = to ? new Date(to + 'T23:59:59').toISOString() : null;
    const { data, error: err } = await getOrdersByDateRange(fromIso, toIso);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    const rows = data || [];
    const completed = rows.filter((o) => o.order_status === 'completed');
    setSummary({
      total: rows.length,
      completed: completed.length,
      revenue: completed.reduce((s, o) => s + Number(o.total_amount || 0), 0),
      placed: rows.filter((o) => o.order_status === 'placed').length,
      byMarket: revenueByMarket(rows),
      topFarmers: topFarmersByRevenue(rows, { limit: 10 }),
    });
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist() {
    if (!summary) return;
    setBusy(true);
    const { error: err } = await saveReport({
      generatedBy: user?.id,
      reportType: 'orders_range',
      payload: { from, to, ...summary },
    });
    setBusy(false);
    if (err) setError(err);
    else setOk(t('dash.admin.reportSaved'));
  }

  if (!isConfigured) return <DemoModeNotice />;

  return (
    <div className="dash-panel action-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.analytics')}</span>
          <h3>{t('dash.admin.orderReports')}</h3>
        </div>
      </div>
      <ErrorBanner message={error} />
      <SuccessNote message={ok} />
      <div className="form-grid">
        <label>
          {t('dash.admin.from')}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          {t('dash.admin.to')}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={run} disabled={loading}>
          {loading ? t('common.loading') : t('dash.admin.runReport')}
        </button>
        <button type="button" className="btn ghost" onClick={persist} disabled={!summary || busy}>
          {t('dash.admin.saveSnapshot')}
        </button>
      </div>
      {loading ? (
        <LoadingBlock label={t('dash.admin.computing')} />
      ) : summary ? (
        <>
          <div className="dash-stats" style={{ marginTop: 16 }}>
            <div className="dash-stat">
              <small>{t('dash.admin.orders')}</small>
              <strong>{summary.total}</strong>
            </div>
            <div className="dash-stat">
              <small>{t('dash.admin.pending')}</small>
              <strong>{summary.placed}</strong>
            </div>
            <div className="dash-stat">
              <small>{t('dash.admin.completed')}</small>
              <strong>{summary.completed}</strong>
            </div>
            <div className="dash-stat">
              <small>{t('dash.admin.revenue')}</small>
              <strong>Rs {summary.revenue.toLocaleString()}</strong>
            </div>
          </div>

          <div className="panel-title" style={{ marginTop: 24 }}>
            <div>
              <span className="eyebrow">{t('dash.admin.marketsEyebrow')}</span>
              <h3>{t('dash.admin.revenueByMarket')}</h3>
            </div>
            {summary.byMarket?.length > 0 && (
              <DataViewToolbar mode={marketsView.mode} onChange={marketsView.setMode} />
            )}
          </div>
          {!summary.byMarket?.length ? (
            <EmptyState title={t('dash.admin.noCompletedSales')} message={t('dash.admin.noCompletedSalesMsg')} />
          ) : (
            <DataView mode={marketsView.mode}>
              {summary.byMarket.map((m) => (
                <DataCard
                  key={m.marketId ?? 'none'}
                  title={m.marketName}
                  details={[
                    { label: t('dash.admin.orders'), value: String(m.orders) },
                    { label: t('dash.colRevenue'), value: `Rs ${m.revenue.toLocaleString()}` },
                  ]}
                />
              ))}
            </DataView>
          )}

          <div className="panel-title" style={{ marginTop: 24 }}>
            <div>
              <span className="eyebrow">{t('dash.admin.farmers')}</span>
              <h3>{t('dash.admin.topFarmers')}</h3>
            </div>
            {summary.topFarmers?.length > 0 && (
              <DataViewToolbar mode={farmersView.mode} onChange={farmersView.setMode} />
            )}
          </div>
          {!summary.topFarmers?.length ? (
            <EmptyState title={t('dash.admin.noFarmerSales')} message={t('dash.admin.noFarmerSalesMsg')} />
          ) : (
            <DataView mode={farmersView.mode}>
              {summary.topFarmers.map((f) => (
                <DataCard
                  key={f.farmerId}
                  title={f.name}
                  details={[
                    { label: t('dash.admin.orders'), value: String(f.orders) },
                    { label: t('dash.colRevenue'), value: `Rs ${f.revenue.toLocaleString()}` },
                    { label: 'ID', value: f.farmerId },
                  ]}
                />
              ))}
            </DataView>
          )}
        </>
      ) : null}
    </div>
  );
}
