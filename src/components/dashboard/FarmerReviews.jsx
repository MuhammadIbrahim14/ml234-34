import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listReviewsForFarmer, updateFarmerResponse } from '../../lib/api/reviews';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, SuccessNote } from '../ui/DataState';

export default function FarmerReviews() {
  const { user, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listReviewsForFarmer(user.id);
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
      setOk('Response saved.');
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading reviews…" />;

  return (
    <div className="dash-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Feedback</span>
          <h3>Customer reviews</h3>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <SuccessNote message={ok} />
      {!rows.length ? (
        <EmptyState title="No reviews yet" message="Reviews appear after completed orders." />
      ) : (
        <div className="mini-table">
          <div className="tr head">
            <span>Review</span>
            <span>Rating</span>
            <span>Response</span>
          </div>
          {rows.map((r) => (
            <div className="tr" key={r.review_id}>
              <span>
                <b>{r.products?.name || 'Product'}</b>
                <small>
                  {r.profiles?.full_name || 'Customer'}: {r.comment || 'No comment'}
                </small>
              </span>
              <span className="status s2">{r.rating}/5</span>
              <span>
                <textarea
                  rows={2}
                  placeholder="Your response…"
                  value={drafts[r.review_id] ?? r.farmer_response ?? ''}
                  onChange={(e) => setDrafts({ ...drafts, [r.review_id]: e.target.value })}
                />
                <button type="button" disabled={busyId === r.review_id} onClick={() => saveResponse(r.review_id)}>
                  {busyId === r.review_id ? 'Saving…' : 'Save'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
