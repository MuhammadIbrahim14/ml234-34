import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listProducts, createProduct, updateProduct, deleteProduct, setProductAvailable } from '../../lib/api/products';
import { listCategories } from '../../lib/api/categories';
import { listMarkets } from '../../lib/api/markets';
import { getMyFarmerProfile } from '../../lib/api/farmers';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';
import ImageUploadField from '../ui/ImageUploadField';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  unit: 'kg',
  stock_quantity: '0',
  image_url: '',
  category_id: '',
  market_id: '',
  is_available: true,
};

export default function FarmerProducts({ mode = 'list' }) {
  const { user, profile, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [approved, setApproved] = useState(true);
  const showForm = mode === 'add' || editingId != null;
  const pending =
    profile?.status === 'pending' || profile?.status === 'suspended' || approved === false;

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const [p, c, m, fp] = await Promise.all([
      listProducts({ farmerId: user.id }),
      listCategories(),
      listMarkets({ activeOnly: true }),
      getMyFarmerProfile(user.id),
    ]);
    setRows(p.data || []);
    setCategories(c.data || []);
    setMarkets(m.data || []);
    setApproved(fp.data?.approved !== false);
    setError(p.error || c.error || m.error || fp.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function startEdit(row) {
    setEditingId(row.product_id);
    setForm({
      name: row.name || '',
      description: row.description || '',
      price: String(row.price ?? ''),
      unit: row.unit || 'kg',
      stock_quantity: String(row.stock_quantity ?? 0),
      image_url: row.image_url || '',
      category_id: row.category_id != null ? String(row.category_id) : '',
      market_id: row.market_id != null ? String(row.market_id) : '',
      is_available: row.is_available !== false,
    });
    setOk('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!user?.id) return;
    setBusy(true);
    setOk('');
    setError(null);
    const payload = {
      farmer_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      unit: form.unit.trim() || 'kg',
      stock_quantity: Math.max(0, parseInt(form.stock_quantity, 10) || 0),
      image_url: form.image_url.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      market_id: form.market_id ? Number(form.market_id) : null,
      is_available: Boolean(form.is_available),
    };
    if (!payload.name || Number.isNaN(payload.price) || payload.price < 0) {
      setError('Name and a valid price are required.');
      setBusy(false);
      return;
    }
    const result = editingId
      ? await updateProduct(editingId, payload)
      : await createProduct(payload);
    setBusy(false);
    if (result.error) {
      const msg = String(result.error);
      if (/row-level security|policy|permission|not allowed|violates/i.test(msg) || pending) {
        setError(
          'Awaiting admin approval — you can edit your stall profile, but product create/update is blocked until approved.'
        );
      } else {
        setError(result.error);
      }
      return;
    }
    setOk(editingId ? 'Product updated.' : 'Product created.');
    resetForm();
    await load();
  }

  async function onToggle(row) {
    const { error: err } = await setProductAvailable(row.product_id, !row.is_available);
    if (err) setError(err);
    else await load();
  }

  async function onDelete() {
    if (!deleteId) return;
    setBusy(true);
    const { error: err } = await deleteProduct(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (err) setError(err);
    else {
      setOk('Product deleted.');
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label="Loading products…" />;

  return (
    <div className="panel-grid">
      {pending && (
        <div className="dash-panel" role="status" style={{ borderColor: 'var(--primary)' }}>
          <div className="panel-title">
            <div>
              <span className="eyebrow">Approval</span>
              <h3>Awaiting admin approval</h3>
            </div>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            You can sign in and update your stall profile, but new product listings stay blocked until an admin approves
            your farmer account.
          </p>
        </div>
      )}
      {(showForm || mode === 'add') && (
        <div className="dash-panel action-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Product</span>
              <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
          <ErrorBanner message={error} />
          <SuccessNote message={ok} />
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fresh Tomatoes" />
            </label>
            <label>
              Price (Rs)
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label>
              Unit
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg" />
            </label>
            <label>
              Stock quantity
              <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
            </label>
            <label>
              Category
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Market
              <select value={form.market_id} onChange={(e) => setForm({ ...form, market_id: e.target.value })}>
                <option value="">Select market</option>
                {markets.map((m) => (
                  <option key={m.market_id} value={m.market_id}>
                    {m.market_name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Short description" />
            </label>
            <ImageUploadField
              label="Product image"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              disabled={busy}
            />
            <label>
              Available
              <select value={form.is_available ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, is_available: e.target.value === 'yes' })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <button className="btn" type="submit" disabled={busy}>
              <Plus size={15} /> {busy ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
            </button>
          </form>
        </div>
      )}

      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Inventory</span>
            <h3>My products</h3>
          </div>
        </div>
        <ErrorBanner message={!showForm ? error : null} onRetry={load} />
        {!rows.length ? (
          <EmptyState title="No products yet" message="Add your first listing to appear on the public catalog." />
        ) : (
          <div className="mini-table">
            <div className="tr head">
              <span>Item</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {rows.map((row) => (
              <div className="tr" key={row.product_id}>
                <span>
                  <b>{row.name}</b>
                  <small>
                    Rs. {row.price}/{row.unit} · stock {row.stock_quantity}
                    {row.product_categories?.name ? ` · ${row.product_categories.name}` : ''}
                  </small>
                </span>
                <span className={'status ' + (row.is_available ? 's2' : 's1')}>{row.is_available ? 'Available' : 'Hidden'}</span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => startEdit(row)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => onToggle(row)} title="Toggle availability">
                    {row.is_available ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button type="button" onClick={() => setDeleteId(row.product_id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
        <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={onDelete} onCancel={() => setDeleteId(null)} title="Delete product?" />
      </div>
    </div>
  );
}
