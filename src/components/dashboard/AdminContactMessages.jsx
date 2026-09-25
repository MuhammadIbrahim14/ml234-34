import { useEffect, useState } from 'react';
import { listContactMessages } from '../../lib/api/contact';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from '../ui/DataState';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function AdminContactMessages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listContactMessages();
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (!isSupabaseConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading messages…" />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Inbox</span>
          <h3>Contact messages</h3>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {!rows.length ? (
        <EmptyState title="No messages yet" message="Contact form submissions will appear here." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>From</span>
            <span>Message</span>
            <span>When</span>
          </div>
          {rows.map((m) => (
            <div className="tr" key={m.id}>
              <span>
                <b>{m.name}</b>
                <small>{m.email}</small>
              </span>
              <span>
                <small style={{ whiteSpace: 'pre-wrap' }}>{m.message}</small>
              </span>
              <span className="status s1">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
