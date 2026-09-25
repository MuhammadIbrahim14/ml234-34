import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listCustomers, setProfileStatus } from '../../lib/api/admin';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';

export default function AdminCustomers() {
  const { isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listCustomers();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    setBusyId(id);
    const { error: err } = await setProfileStatus(id, status);
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(`Customer ${status}.`);
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading customers…" />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Accounts</span>
          <h3>Customers</h3>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title="No customers yet" message="Registered customers will appear here." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>Customer</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {rows.map((c) => (
            <div className="tr" key={c.id}>
              <span>
                <b>{c.full_name || c.email}</b>
                <small>
                  {c.email} · {c.contact_number || 'no phone'}
                </small>
              </span>
              <span className="status s1">{c.status}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" disabled={busyId === c.id} onClick={() => setStatus(c.id, 'active')}>
                  Activate
                </button>
                <button type="button" disabled={busyId === c.id} onClick={() => setStatus(c.id, 'deactivated')}>
                  Deactivate
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
