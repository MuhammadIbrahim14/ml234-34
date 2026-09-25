import { useEffect, useState } from 'react';
import { listAllFarmerProfiles } from '../../lib/api/farmers';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { isSupabaseConfigured } from '../../lib/supabase';

/** Read-only view of farmer pickup_windows for admin/manager. */
export default function AdminPickupSlots() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (!isSupabaseConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading pickup windows…" />;

  const withWindows = rows.filter((f) => Array.isArray(f.pickup_windows) && f.pickup_windows.length);

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Schedule</span>
          <h3>Pickup slots (from farmers)</h3>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Read-only list of pickup windows farmers set under their stall profile.
      </p>
      <ErrorBanner message={error} onRetry={load} />
      {!withWindows.length ? (
        <EmptyState title="No pickup windows yet" message="When farmers add pickup windows, they will show here." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>Farmer</span>
            <span>Windows</span>
            <span>Status</span>
          </div>
          {withWindows.map((f) => (
            <div className="tr" key={f.id}>
              <span>
                <b>{f.stall_name}</b>
                <small>{f.profiles?.full_name || f.contact_person || f.profiles?.email || '—'}</small>
              </span>
              <span>
                <small>
                  {(f.pickup_windows || [])
                    .map((w) => w.label || `${w.day} ${w.start}–${w.end}`)
                    .join(' · ')}
                </small>
              </span>
              <span className="status s1">{f.approved ? 'Approved' : 'Pending'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
