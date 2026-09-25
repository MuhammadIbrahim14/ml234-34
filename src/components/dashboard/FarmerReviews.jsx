import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listReviewsForFarmer, updateFarmerResponse } from '../../lib/api/reviews';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';

export default function FarmerReviews() {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const { mode, setMode } = useDataViewMode('farmer-reviews');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listReviewsForFarmer(user.id, { includeHidden: true });
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function saveResponse(reviewId) {
    setBusyId(reviewId);
    setOk('');
    const { error: err } = await updateFarmerResponse(reviewId, drafts[reviewId] || '');
    setBusyId(null);
    if (err) setError(err);
    else {
      setOk(t('dash.farmer.responseSaved'));
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.farmer.loadingReviews')} />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">{t('dash.farmer.feedback')}</span>
          <h3>{t('dash.farmer.customerReviews')}</h3>
        </div>
        {rows.length > 0 && <DataViewToolbar mode={mode} onChange={setMode} />}
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title={t('dash.farmer.noReviews')} message={t('dash.farmer.noReviewsMsg')} />
      ) : (
        <DataView mode={mode}>
          {rows.map((r) => (
            <DataCard
              key={r.review_id}
              title={r.products?.name || t('dash.product')}
              subtitle={`${r.profiles?.full_name || t('dash.customer')}: ${r.comment || t('dash.farmer.noComment')}`}
              status={`${r.rating}/5`}
              statusClass="s2"
              actions={
                <button type="button" disabled={busyId === r.review_id} onClick={() => saveResponse(r.review_id)}>
                  {busyId === r.review_id ? t('common.saving') : t('common.save')}
                </button>
              }
            >
              <textarea
                rows={2}
                placeholder={t('dash.farmer.yourResponse')}
                value={drafts[r.review_id] ?? r.farmer_response ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [r.review_id]: e.target.value })}
              />
            </DataCard>
          ))}
        </DataView>
      )}
    </div>
  );
}
