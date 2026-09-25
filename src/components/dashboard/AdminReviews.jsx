import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listAllReviews, setReviewHidden, deleteReview } from '../../lib/api/reviews';
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

export default function AdminReviews() {
  const { t } = useTranslation();
  const { isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('admin-reviews');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: err } = await listAllReviews({ limit: 200 });
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function hide(id) {
    setOk('');
    const { error: err } = await setReviewHidden(id, true);
    if (err) setError(err);
    else {
      setOk(t('dash.admin.reviewHidden'));
      await load();
    }
  }

  async function unhide(id) {
    setOk('');
    const { error: err } = await setReviewHidden(id, false);
    if (err) setError(err);
    else {
      setOk(t('dash.admin.reviewRestored'));
      await load();
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setOk('');
    const { error: err } = await deleteReview(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (err) setError(err);
    else {
      setOk(t('dash.admin.reviewDeleted'));
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingReviews')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.admin.moderation')}</span>
          <h3>{t('dash.admin.reviewModeration')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title={t('dash.admin.noReviews')} message={t('dash.admin.noReviewsMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((r) => (
            <DataCard
              key={r.review_id}
              title={r.products?.name || t('dash.product')}
              subtitle={`${r.rating}/5 · ${r.profiles?.full_name || t('dash.customer')}`}
              status={r.is_hidden ? t('common.hidden') : t('dash.admin.visible')}
              statusClass={r.is_hidden ? 's1' : 's2'}
              details={[
                { label: t('dash.colProduct'), value: r.products?.name },
                { label: t('dash.customer'), value: r.profiles?.full_name },
                { label: t('dash.colReview'), value: r.rating != null ? `${r.rating}/5` : '' },
                { label: t('dash.colMessage'), value: r.comment || t('dash.farmer.noComment') },
                {
                  label: t('dash.fields.status'),
                  value: r.is_hidden ? t('common.hidden') : t('dash.admin.visible'),
                },
                { label: t('dash.fields.created'), value: formatWhen(r.created_at) },
                { label: 'ID', value: r.review_id },
              ]}
              actions={
                <>
                  {r.is_hidden ? (
                    <button type="button" onClick={() => unhide(r.review_id)}>
                      {t('dash.admin.unhide')}
                    </button>
                  ) : (
                    <button type="button" onClick={() => hide(r.review_id)}>
                      {t('dash.admin.hide')}
                    </button>
                  )}
                  <button type="button" onClick={() => setDeleteId(r.review_id)}>
                    {t('common.delete')}
                  </button>
                </>
              }
            />
          ))}
        </DataView>
      )}
      <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
