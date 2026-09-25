import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../lib/api/announcements';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';

export default function AdminAnnouncements() {
  const { user, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listAnnouncements({ publishedOnly: false });
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setBusy(true);
    setOk('');
    const { error: err } = await createAnnouncement({
      title: title.trim(),
      body: body.trim(),
      publishedBy: user?.id,
      isPublished: true,
    });
    setBusy(false);
    if (err) setError(err);
    else {
      setOk('Announcement published.');
      setTitle('');
      setBody('');
      await load();
    }
  }

  async function togglePublish(row) {
    const { error: err } = await updateAnnouncement(row.announcement_id, { is_published: !row.is_published });
    if (err) setError(err);
    else await load();
  }

  async function confirmDelete() {
    setBusy(true);
    const { error: err } = await deleteAnnouncement(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (err) setError(err);
    else {
      setOk('Deleted.');
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading announcements…" />;

  return (
    <div className="panel-grid">
      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Publish</span>
            <h3>New announcement</h3>
          </div>
        </div>
        <ErrorBanner message={error} />
        <SuccessNote message={ok} />
        <form className="form-grid" onSubmit={onCreate}>
          <label style={{ gridColumn: '1 / -1' }}>
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Body
            <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            <Plus size={15} /> {busy ? 'Publishing…' : 'Publish'}
          </button>
        </form>
      </div>
      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Feed</span>
            <h3>Announcements</h3>
          </div>
        </div>
        {!rows.length ? (
          <EmptyState title="No announcements" message="Publish updates for the community." />
        ) : (
          <div className="mini-table">
            {rows.map((a) => (
              <div className="tr" key={a.announcement_id}>
                <span>
                  <b>{a.title}</b>
                  <small>{a.body}</small>
                </span>
                <span className={'status ' + (a.is_published ? 's2' : 's1')}>{a.is_published ? 'Live' : 'Draft'}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => togglePublish(a)}>
                    {a.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => setDeleteId(a.announcement_id)}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
        <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
      </div>
    </div>
  );
}
