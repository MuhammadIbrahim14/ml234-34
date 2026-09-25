import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listAllFarmerProfiles, setFarmerApproved } from '../../lib/api/farmers';
import { setProfileStatus } from '../../lib/api/admin';
import { createNotification } from '../../lib/api/notifications';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';

export default function AdminFarmers() {
  const { isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listAllFarmerProfiles();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(userId, approved) {
    setBusyId(userId);
    setOk('');
    const { error: err } = await setFarmerApproved(userId, approved);
    if (!err && approved) {
      await setProfileStatus(userId, 'active');
      await createNotification({
        userId,
        title: 'Welcome to MarketLink',
        body: 'Your farmer account is approved. You can now publish products and manage pre-orders.',
        link: '/dashboard/farmer/add-product',
      });
    }
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(approved ? 'Farmer approved.' : 'Approval revoked.');
      await load();
    }
  }

  async function setStatus(userId, status) {
    setBusyId(userId);
    const { error: err } = await setProfileStatus(userId, status);
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(`Status set to ${status}.`);
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading farmers…" />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Accounts</span>
          <h3>Farmers</h3>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title="No farmers yet" message="Farmer registrations will appear here for approval." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>Farmer</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {rows.map((f) => (
            <div className="tr" key={f.id}>
              <span>
                <b>{f.stall_name}</b>
                <small>
                  {f.contact_person || f.profiles?.full_name || '—'} · {f.profiles?.email || ''}
                  {f.approved ? ' · approved' : ' · pending approval'}
                </small>
              </span>
              <span className="status s1">{f.profiles?.status || '—'}</span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!f.approved && (
                  <button type="button" disabled={busyId === f.user_id} onClick={() => approve(f.user_id, true)}>
                    Approve
                  </button>
                )}
                {f.approved && (
                  <button type="button" disabled={busyId === f.user_id} onClick={() => approve(f.user_id, false)}>
                    Unapprove
                  </button>
                )}
                <button type="button" disabled={busyId === f.user_id} onClick={() => setStatus(f.user_id, 'active')}>
                  Activate
                </button>
                <button type="button" disabled={busyId === f.user_id} onClick={() => setStatus(f.user_id, 'suspended')}>
                  Suspend
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
