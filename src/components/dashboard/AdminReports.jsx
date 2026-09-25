import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByDateRange, saveReport } from '../../lib/api/admin';
import { LoadingBlock, ErrorBanner, DemoModeNotice, SuccessNote } from '../ui/DataState';

export default function AdminReports() {
  const { user, isConfigured } = useAuth();
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
    const completed = (data || []).filter((o) => o.order_status === 'completed');
    setSummary({
      total: data.length,
      completed: completed.length,
      revenue: completed.reduce((s, o) => s + Number(o.total_amount || 0), 0),
      placed: (data || []).filter((o) => o.order_status === 'placed').length,
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
    else setOk('Report saved.');
  }

  if (!isConfigured) return <DemoModeNotice />;

  return (
    <div className="dash-panel action-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Analytics</span>
          <h3>Order reports</h3>
        </div>
      </div>
      <ErrorBanner message={error} />
      <SuccessNote message={ok} />
      <div className="form-grid">
        <label>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={run} disabled={loading}>
          {loading ? 'Loading…' : 'Run report'}
        </button>
        <button type="button" className="btn ghost" onClick={persist} disabled={!summary || busy}>
          Save snapshot
        </button>
      </div>
      {loading ? (
        <LoadingBlock label="Computing…" />
      ) : summary ? (
        <div className="dash-stats" style={{ marginTop: 16 }}>
          <div className="dash-stat">
            <small>Orders</small>
            <strong>{summary.total}</strong>
          </div>
          <div className="dash-stat">
            <small>Pending</small>
            <strong>{summary.placed}</strong>
          </div>
          <div className="dash-stat">
            <small>Completed</small>
            <strong>{summary.completed}</strong>
          </div>
          <div className="dash-stat">
            <small>Revenue</small>
            <strong>Rs {summary.revenue.toLocaleString()}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}
