import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../lib/api/announcements';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

export default function AdminAnnouncements() {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('admin-announcements');
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
      setOk(t('dash.admin.announcementPublished'));
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
      setOk(t('dash.admin.deleted'));
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingAnnouncements')} />;

  return (
    <div className="panel-grid">
      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.admin.publishEyebrow')}</span>
            <h3>{t('dash.admin.newAnnouncement')}</h3>
          </div>
        </div>
        <ErrorBanner message={error} />
        <SuccessNote message={ok} />
        <form className="form-grid" onSubmit={onCreate}>
          <label style={{ gridColumn: '1 / -1' }}>
            {t('dash.admin.title')}
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            {t('dash.admin.body')}
            <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            <Plus size={15} /> {busy ? t('dash.admin.publishing') : t('dash.admin.publish')}
          </button>
        </form>
      </div>
      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.admin.feed')}</span>
            <h3>{t('dash.admin.announcements')}</h3>
          </div>
          {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
        </div>
        {!rows.length ? (
          <EmptyState title={t('dash.admin.noAnnouncements')} message={t('dash.admin.noAnnouncementsMsg')} />
        ) : (
          <DataView mode={mode}>
            {rows.map((a) => (
              <DataCard
                key={a.announcement_id}
                title={a.title}
                subtitle={a.body}
                status={a.is_published ? t('dash.admin.live') : t('dash.admin.draft')}
                statusClass={a.is_published ? 's2' : 's1'}
                details={[
                  { label: t('dash.admin.body'), value: a.body },
                  {
                    label: t('dash.fields.status'),
                    value: a.is_published ? t('dash.admin.live') : t('dash.admin.draft'),
                  },
                  { label: t('dash.fields.created'), value: formatWhen(a.created_at) },
                  { label: 'ID', value: a.announcement_id },
                ]}
                actions={
                  <>
                    <button type="button" onClick={() => togglePublish(a)}>
                      {a.is_published ? t('dash.admin.unpublish') : t('dash.admin.publish')}
                    </button>
                    <button type="button" onClick={() => setDeleteId(a.announcement_id)}>
                      <Trash2 size={14} />
                    </button>
                  </>
                }
              />
            ))}
          </DataView>
        )}
        <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
      </div>
    </div>
  );
}
