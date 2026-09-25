import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listProducts, createProduct, updateProduct, deleteProduct, setProductAvailable } from '../../lib/api/products';
import { listCategories } from '../../lib/api/categories';
import { listMarkets } from '../../lib/api/markets';
import {
  getMyFarmerProfile,
  saveWeeklyStockTemplate,
  applyWeeklyStockTemplate,
  todayWeekdayKey,
  WEEKDAYS,
} from '../../lib/api/farmers';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
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
  const { t } = useTranslation();
  const { user, profile, isConfigured } = useAuth();
  const { mode: productsView, setMode: setProductsView } = useDataViewMode('farmer-products');
  const { mode: templateView, setMode: setTemplateView } = useDataViewMode('farmer-template');
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
  const [template, setTemplate] = useState({});
  const [templateDay, setTemplateDay] = useState(todayWeekdayKey());
  const [templateBusy, setTemplateBusy] = useState(false);
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
    const tpl = fp.data?.weekly_stock_template;
    setTemplate(tpl && typeof tpl === 'object' && !Array.isArray(tpl) ? tpl : {});
    setError(p.error || c.error || m.error || fp.error);
    setLoading(false);
  }

  function templateQty(productId) {
    const dayMap = template[templateDay];
    if (!dayMap || typeof dayMap !== 'object') return '';
    const v = dayMap[String(productId)];
    return v == null ? '' : String(v);
  }

  function setTemplateQty(productId, raw) {
    const key = String(productId);
    setTemplate((prev) => {
      const next = { ...prev };
      const dayMap = { ...(next[templateDay] || {}) };
      if (raw === '' || raw == null) {
        delete dayMap[key];
      } else {
        dayMap[key] = Math.max(0, parseInt(raw, 10) || 0);
      }
      if (Object.keys(dayMap).length) next[templateDay] = dayMap;
      else delete next[templateDay];
      return next;
    });
  }

  async function onSaveTemplate() {
    if (!user?.id) return;
    setTemplateBusy(true);
    setOk('');
    setError(null);
    const { error: err } = await saveWeeklyStockTemplate(user.id, template);
    setTemplateBusy(false);
    if (err) setError(err);
    else setOk(t('dash.farmer.templateSaved'));
  }

  async function onApplyTemplate(day) {
    setTemplateBusy(true);
    setOk('');
    setError(null);
    const { data, error: err } = await applyWeeklyStockTemplate(day);
    setTemplateBusy(false);
    if (err) {
      const msg = String(err);
      if (/row-level security|policy|permission|not allowed|awaiting|approved/i.test(msg) || pending) {
        setError(t('dash.farmer.templateBlocked'));
      } else {
        setError(err);
      }
      return;
    }
    const updated = data?.updated ?? 0;
    setOk(t('dash.farmer.templateApplied', { day, count: updated }));
    await load();
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
      setError(t('dash.farmer.namePriceRequired'));
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
        setError(t('dash.farmer.productBlocked'));
      } else {
        setError(result.error);
      }
      return;
    }
    setOk(editingId ? t('dash.farmer.productUpdated') : t('dash.farmer.productCreated'));
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
    const { error: err, data } = await deleteProduct(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (err) setError(err);
    else {
      setOk(
        data?.hiddenDueToOrders
          ? t('dash.farmer.productHiddenDueToOrders')
          : t('dash.farmer.productDeleted')
      );
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.farmer.loadingProducts')} />;

  return (
    <div className="panel-grid">
      {pending && (
        <div className="dash-panel" role="status" style={{ borderColor: 'var(--primary)' }}>
          <div className="panel-title">
            <div>
              <span className="eyebrow">{t('dash.farmer.approvalEyebrow')}</span>
              <h3>{t('dash.farmer.awaitingApproval')}</h3>
            </div>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {t('dash.farmer.awaitingApprovalMsg')}
          </p>
        </div>
      )}
      {(showForm || mode === 'add') && (
        <div className="dash-panel action-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">{t('dash.farmer.productEyebrow')}</span>
              <h3>{editingId ? t('dash.farmer.editProduct') : t('dash.farmer.addProduct')}</h3>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm}>
                {t('dash.farmer.cancelEdit')}
              </button>
            )}
          </div>
          <ErrorBanner message={error} />
          <SuccessNote message={ok} />
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              {t('dash.farmer.name')}
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fresh Tomatoes" />
            </label>
            <label>
              {t('dash.farmer.priceRs')}
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label>
              {t('dash.farmer.unit')}
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg" />
            </label>
            <label>
              {t('dash.farmer.stockQty')}
              <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
            </label>
            <label>
              {t('dash.farmer.category')}
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">{t('dash.farmer.selectCategory')}</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('dash.farmer.market')}
              <select value={form.market_id} onChange={(e) => setForm({ ...form, market_id: e.target.value })}>
                <option value="">{t('dash.farmer.selectMarket')}</option>
                {markets.map((m) => (
                  <option key={m.market_id} value={m.market_id}>
                    {m.market_name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              {t('dash.farmer.description')}
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Short description" />
            </label>
            <ImageUploadField
              label={t('upload.label')}
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              disabled={busy}
            />
            <label>
              {t('dash.farmer.available')}
              <select value={form.is_available ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, is_available: e.target.value === 'yes' })}>
                <option value="yes">{t('common.yes')}</option>
                <option value="no">{t('common.no')}</option>
              </select>
            </label>
            <button className="btn" type="submit" disabled={busy}>
              <Plus size={15} /> {busy ? t('common.saving') : editingId ? t('dash.farmer.updateProduct') : t('dash.farmer.createProduct')}
            </button>
          </form>
        </div>
      )}

      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.farmer.inventoryEyebrow')}</span>
            <h3>{t('dash.farmer.myProducts')}</h3>
          </div>
          {rows.length > 0 && <DataViewToolbar mode={productsView} onChange={setProductsView} />}
        </div>
        <ErrorBanner message={!showForm ? error : null} onRetry={load} />
        {!rows.length ? (
          <EmptyState title={t('dash.farmer.noProducts')} message={t('dash.farmer.noProductsMsg')} />
        ) : (
          <DataView mode={productsView}>
            {rows.map((row) => (
              <DataCard
                key={row.product_id}
                title={row.name}
                subtitle={`${t('common.rs')} ${row.price}/${row.unit} · stock ${row.stock_quantity}${
                  row.product_categories?.name ? ` · ${row.product_categories.name}` : ''
                }`}
                status={row.is_available ? t('common.available') : t('common.hidden')}
                statusClass={row.is_available ? 's2' : 's1'}
                actions={
                  <>
                    <button type="button" onClick={() => startEdit(row)} title={t('common.edit')}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => onToggle(row)} title={t('dash.farmer.toggleAvailability')}>
                      {row.is_available ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={() => setDeleteId(row.product_id)} title={t('common.delete')}>
                      <Trash2 size={14} />
                    </button>
                  </>
                }
              />
            ))}
          </DataView>
        )}
        <ConfirmDelete open={deleteId != null} busy={busy} onConfirm={onDelete} onCancel={() => setDeleteId(null)} title={t('dash.farmer.deleteProduct')} />
      </div>

      {mode === 'list' && (
        <div className="dash-panel action-panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">{t('dash.farmer.weeklyPlan')}</span>
              <h3>{t('dash.farmer.stockTemplate')}</h3>
            </div>
            {rows.length > 0 && <DataViewToolbar mode={templateView} onChange={setTemplateView} />}
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            {t('dash.farmer.stockTemplateHint')}
          </p>
          <SuccessNote message={!showForm ? ok : ''} />
          <div className="chips" style={{ marginTop: 4 }}>
            {WEEKDAYS.map((d) => (
              <button key={d} type="button" className={templateDay === d ? 'on' : ''} onClick={() => setTemplateDay(d)}>
                {d}
              </button>
            ))}
          </div>
          {!rows.length ? (
            <EmptyState title={t('dash.farmer.addProductsFirst')} message={t('dash.farmer.addProductsFirstMsg')} />
          ) : (
            <DataView mode={templateView}>
              {rows.map((row) => (
                <DataCard
                  key={`tpl-${row.product_id}`}
                  title={row.name}
                  subtitle={t('dash.farmer.currentStock', { qty: row.stock_quantity })}
                  details={[
                    {
                      label: t('dash.farmer.plannedQty', { day: templateDay }),
                      value: (
                        <input
                          type="number"
                          min="0"
                          style={{ width: 96 }}
                          value={templateQty(row.product_id)}
                          onChange={(e) => setTemplateQty(row.product_id, e.target.value)}
                          placeholder="—"
                        />
                      ),
                    },
                  ]}
                />
              ))}
            </DataView>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <button type="button" className="btn" disabled={templateBusy || !rows.length} onClick={onSaveTemplate}>
              {templateBusy ? t('dash.farmer.working') : t('dash.farmer.saveTemplate')}
            </button>
            <button
              type="button"
              className="btn"
              disabled={templateBusy || pending || !rows.length}
              onClick={() => onApplyTemplate(todayWeekdayKey())}
            >
              {t('dash.farmer.applyToday', { day: todayWeekdayKey() })}
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={templateBusy || pending || !rows.length}
              onClick={() => onApplyTemplate(templateDay)}
            >
              {t('dash.farmer.applyDay', { day: templateDay })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
