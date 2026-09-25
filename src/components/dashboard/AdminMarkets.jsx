import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { listMarkets, createMarket, updateMarket, deleteMarket } from '../../lib/api/markets';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api/categories';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';
import { useAuth } from '../../context/AuthContext';

const emptyMarket = {
  market_name: '',
  address: '',
  operating_days: '',
  timings: '',
  latitude: '',
  longitude: '',
  is_active: true,
};

export default function AdminMarkets() {
  const { isConfigured } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyMarket);
  const [editingId, setEditingId] = useState(null);
  const [catName, setCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteMarketId, setDeleteMarketId] = useState(null);
  const [deleteCatId, setDeleteCatId] = useState(null);

  async function load() {
    setLoading(true);
    const [m, c] = await Promise.all([listMarkets(), listCategories()]);
    setMarkets(m.data || []);
    setCategories(c.data || []);
    setError(m.error || c.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(m) {
    setEditingId(m.market_id);
    setForm({
      market_name: m.market_name || '',
      address: m.address || '',
      operating_days: (m.operating_days || []).join(', '),
      timings: m.timings || '',
      latitude: m.latitude != null ? String(m.latitude) : '',
      longitude: m.longitude != null ? String(m.longitude) : '',
      is_active: m.is_active !== false,
    });
  }

  async function saveMarket(e) {
    e.preventDefault();
    setBusy(true);
    setOk('');
    setError(null);
    const payload = {
      market_name: form.market_name.trim(),
      address: form.address.trim() || null,
      operating_days: form.operating_days
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      timings: form.timings.trim() || null,
      latitude: form.latitude !== '' ? Number(form.latitude) : null,
      longitude: form.longitude !== '' ? Number(form.longitude) : null,
      is_active: Boolean(form.is_active),
    };
    if (!payload.market_name) {
      setError('Market name is required.');
      setBusy(false);
      return;
    }
    const result = editingId ? await updateMarket(editingId, payload) : await createMarket(payload);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setOk(editingId ? 'Market updated.' : 'Market created.');
      setEditingId(null);
      setForm(emptyMarket);
      await load();
    }
  }

  async function confirmDeleteMarket() {
    setBusy(true);
    const { error: err } = await deleteMarket(deleteMarketId);
    setBusy(false);
    setDeleteMarketId(null);
    if (err) setError(err);
    else {
      setOk('Market deleted.');
      await load();
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = editingCat
      ? await updateCategory(editingCat, catName)
      : await createCategory(catName);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setOk(editingCat ? 'Category updated.' : 'Category created.');
      setCatName('');
      setEditingCat(null);
      await load();
    }
  }

  async function confirmDeleteCat() {
    setBusy(true);
    const { error: err } = await deleteCategory(deleteCatId);
    setBusy(false);
    setDeleteCatId(null);
    if (err) setError(err);
    else {
      setOk('Category deleted.');
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading markets…" />;

  return (
    <div className="panel-grid">
      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Markets</span>
            <h3>{editingId ? 'Edit market' : 'Add market'}</h3>
          </div>
        </div>
        <ErrorBanner message={error} />
        <SuccessNote message={ok} />
        <form className="form-grid" onSubmit={saveMarket}>
          <label>
            Market name
            <input required value={form.market_name} onChange={(e) => setForm({ ...form, market_name: e.target.value })} />
          </label>
          <label>
            Address
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <label>
            Operating days (comma-separated)
            <input value={form.operating_days} onChange={(e) => setForm({ ...form, operating_days: e.target.value })} placeholder="Mon, Wed, Sat" />
          </label>
          <label>
            Timings
            <input value={form.timings} onChange={(e) => setForm({ ...form, timings: e.target.value })} placeholder="8 AM – 2 PM" />
          </label>
          <label>
            Latitude
            <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          </label>
          <label>
            Longitude
            <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </label>
          <label>
            Active
            <select value={form.is_active ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'yes' })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <button className="btn" type="submit" disabled={busy}>
            <Plus size={15} /> {busy ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" className="btn ghost" onClick={() => { setEditingId(null); setForm(emptyMarket); }}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Directory</span>
            <h3>All markets</h3>
          </div>
        </div>
        {!markets.length ? (
          <EmptyState title="No markets yet" message="Create the first market to show on the public site." />
        ) : (
          <div className="mini-table">
            <div className="tr head">
              <span>Market</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {markets.map((m) => (
              <div className="tr" key={m.market_id}>
                <span>
                  <b>{m.market_name}</b>
                  <small>{m.address || 'No address'} · {m.timings || '—'}</small>
                </span>
                <span className={'status ' + (m.is_active ? 's2' : 's1')}>{m.is_active ? 'Active' : 'Inactive'}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => startEdit(m)}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setDeleteMarketId(m.market_id)}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
        <ConfirmDelete open={deleteMarketId != null} busy={busy} onConfirm={confirmDeleteMarket} onCancel={() => setDeleteMarketId(null)} />
      </div>

      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Categories</span>
            <h3>{editingCat ? 'Edit category' : 'Add category'}</h3>
          </div>
        </div>
        <form className="form-grid" onSubmit={saveCategory}>
          <label>
            Name
            <input required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Vegetables" />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {editingCat ? 'Update' : 'Add'}
          </button>
        </form>
        {!categories.length ? (
          <EmptyState title="No categories" message="Add categories for product forms." />
        ) : (
          <div className="mini-table" style={{ marginTop: 12 }}>
            {categories.map((c) => (
              <div className="tr" key={c.category_id}>
                <span>
                  <b>{c.name}</b>
                </span>
                <span />
                <span style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(c.category_id);
                      setCatName(c.name);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setDeleteCatId(c.category_id)}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
        <ConfirmDelete open={deleteCatId != null} busy={busy} onConfirm={confirmDeleteCat} onCancel={() => setDeleteCatId(null)} title="Delete category?" />
      </div>
    </div>
  );
}
