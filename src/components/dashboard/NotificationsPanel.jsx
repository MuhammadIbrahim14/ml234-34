import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api/notifications';
import { navigate } from '../../router';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';

export default function NotificationsPanel({ embedded = false }) {
  const { user, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listNotifications(user.id);
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function onRead(id) {
    const { error: err } = await markNotificationRead(id);
    if (err) setError(err);
    else await load();
  }

  async function onReadAll() {
    setOk('');
    const { error: err } = await markAllNotificationsRead(user.id);
    if (err) setError(err);
    else {
      setOk('All notifications marked read.');
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading notifications…" />;

  const body = (
    <>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title="No notifications" message="Order updates and account alerts will appear here." />
      ) : (
        <div className="notif-list">
          {rows.map((n) => (
            <article key={n.id} className={'notif-item' + (n.read_at ? '' : ' unread')}>
              <div className="notif-icon">
                <Bell size={16} />
              </div>
              <div className="notif-body">
                <b>{n.title}</b>
                {n.body && <p>{n.body}</p>}
                <small>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</small>
                <div className="notif-actions">
                  {n.link && (
                    <button type="button" className="btn sm ghost" onClick={() => navigate(n.link)}>
                      Open
                    </button>
                  )}
                  {!n.read_at && (
                    <button type="button" className="btn sm" onClick={() => onRead(n.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return <div className="dash-panel">{body}</div>;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Inbox</span>
          <h3>Notifications</h3>
        </div>
        {rows.some((n) => !n.read_at) && (
          <button type="button" className="btn sm" onClick={onReadAll}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>
      {body}
    </div>
  );
}
