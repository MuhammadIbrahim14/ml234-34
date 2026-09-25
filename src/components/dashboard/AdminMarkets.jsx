import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { listMarkets, createMarket, updateMarket, deleteMarket } from '../../lib/api/markets';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api/categories';
import { parseCoordsFromMapUrl } from '../../lib/api/geo';
import LocationPickerMap from '../LocationPickerMap';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice, ConfirmDelete, SuccessNote } from '../ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from '../ui/DataView';
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
  const { t } = useTranslation();
  const { isConfigured } = useAuth();
  const marketsView = useDataViewMode('admin-markets');
  const categoriesView = useDataViewMode('admin-categories');
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
  const [mapLink, setMapLink] = useState('');
  const [linkHint, setLinkHint] = useState('');

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
    setMapLink('');
    setLinkHint('');
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

  function applyMapLink() {
    const parsed = parseCoordsFromMapUrl(mapLink);
    if (!parsed) {
      setLinkHint(t('map.linkHint'));
      return;
    }
    setForm((prev) => ({
      ...prev,
      latitude: String(parsed.latitude),
      longitude: String(parsed.longitude),
    }));
    setLinkHint(t('map.setFromLink', { lat: parsed.latitude.toFixed(5), lng: parsed.longitude.toFixed(5) }));
  }

  function onPickLocation(lat, lng) {
    setForm((prev) => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
    }));
    setLinkHint('');
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
      setError(t('dash.admin.marketNameRequired'));
      setBusy(false);
      return;
    }
    const result = editingId ? await updateMarket(editingId, payload) : await createMarket(payload);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setOk(editingId ? t('dash.admin.marketUpdated') : t('dash.admin.marketCreated'));
      setEditingId(null);
      setForm(emptyMarket);
      setMapLink('');
      setLinkHint('');
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
      setOk(t('dash.admin.marketDeleted'));
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
      setOk(editingCat ? t('dash.admin.categoryUpdated') : t('dash.admin.categoryCreated'));
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
      setOk(t('dash.admin.categoryDeleted'));
      await load();
    }
  }

  if (!isConfigured) return <DemoModeNotice />;
  if (loading) return <LoadingBlock label={t('dash.admin.loadingMarkets')} />;

  return (
    <div className="panel-grid">
      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.admin.marketsEyebrow')}</span>
            <h3>{editingId ? t('dash.admin.editMarket') : t('dash.admin.addMarket')}</h3>
          </div>
        </div>
        <ErrorBanner message={error} />
        <SuccessNote message={ok} />
        <form className="form-grid" onSubmit={saveMarket}>
          <label>
            {t('dash.admin.marketName')}
            <input required value={form.market_name} onChange={(e) => setForm({ ...form, market_name: e.target.value })} />
          </label>
          <label>
            {t('dash.admin.address')}
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <label>
            {t('dash.admin.operatingDays')}
            <input value={form.operating_days} onChange={(e) => setForm({ ...form, operating_days: e.target.value })} placeholder="Mon, Wed, Sat" />
          </label>
          <label>
            {t('dash.admin.timings')}
            <input value={form.timings} onChange={(e) => setForm({ ...form, timings: e.target.value })} placeholder="8 AM – 2 PM" />
          </label>
          <label className="span-2">
            {t('map.pasteLink')}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                style={{ flex: 1, minWidth: 180 }}
                value={mapLink}
                onChange={(e) => {
                  setMapLink(e.target.value);
                  setLinkHint('');
                }}
                placeholder={t('map.linkPlaceholder')}
              />
              <button type="button" className="btn ghost" onClick={applyMapLink} disabled={!mapLink.trim()}>
                {t('map.useLink')}
              </button>
            </div>
            {linkHint ? <small style={{ display: 'block', marginTop: 4 }}>{linkHint}</small> : null}
          </label>
          <div className="span-2">
            <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>{t('map.pickOnMap')}</span>
            <LocationPickerMap
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={onPickLocation}
            />
          </div>
          <label>
            {t('dash.admin.latitude')}
            <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          </label>
          <label>
            {t('dash.admin.longitude')}
            <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </label>
          <label>
            {t('dash.admin.active')}
            <select value={form.is_active ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'yes' })}>
              <option value="yes">{t('common.yes')}</option>
              <option value="no">{t('common.no')}</option>
            </select>
          </label>
          <button className="btn" type="submit" disabled={busy}>
            <Plus size={15} /> {busy ? t('common.saving') : editingId ? t('common.update') : t('common.create')}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyMarket);
                setMapLink('');
                setLinkHint('');
              }}
            >
              {t('common.cancel')}
            </button>
          )}
        </form>
      </div>

      <div className="dash-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.admin.directory')}</span>
            <h3>{t('dash.admin.allMarkets')}</h3>
          </div>
          {markets.length > 0 && <DataViewToolbar mode={marketsView.mode} onChange={marketsView.setMode} />}
        </div>
        {!markets.length ? (
          <EmptyState title={t('dash.admin.noMarkets')} message={t('dash.admin.noMarketsMsg')} />
        ) : (
          <DataView mode={marketsView.mode}>
            {markets.map((m) => {
              const days = Array.isArray(m.operating_days) ? m.operating_days.join(', ') : m.operating_days;
              const coords =
                m.latitude != null && m.longitude != null ? `${m.latitude}, ${m.longitude}` : '';
              return (
                <DataCard
                  key={m.market_id}
                  title={m.market_name}
                  subtitle={m.address || t('dash.admin.noAddress')}
                  status={m.is_active ? t('common.active') : t('common.inactive')}
                  statusClass={m.is_active ? 's2' : 's1'}
                  details={[
                    { label: t('dash.fields.address'), value: m.address },
                    { label: t('dash.fields.operatingDays'), value: days },
                    { label: t('dash.admin.timings'), value: m.timings },
                    { label: t('dash.fields.coords'), value: coords },
                    {
                      label: t('dash.fields.status'),
                      value: m.is_active ? t('common.active') : t('common.inactive'),
                    },
                    { label: 'ID', value: m.market_id },
                  ]}
                  actions={
                    <>
                      <button type="button" onClick={() => startEdit(m)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => setDeleteMarketId(m.market_id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  }
                />
              );
            })}
          </DataView>
        )}
        <ConfirmDelete open={deleteMarketId != null} busy={busy} onConfirm={confirmDeleteMarket} onCancel={() => setDeleteMarketId(null)} />
      </div>

      <div className="dash-panel action-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">{t('dash.admin.categories')}</span>
            <h3>{editingCat ? t('dash.admin.editCategory') : t('dash.admin.addCategory')}</h3>
          </div>
          {categories.length > 0 && (
            <DataViewToolbar mode={categoriesView.mode} onChange={categoriesView.setMode} />
          )}
        </div>
        <form className="form-grid" onSubmit={saveCategory}>
          <label>
            {t('dash.admin.categoryName')}
            <input required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Vegetables" />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {editingCat ? t('common.update') : t('common.add')}
          </button>
        </form>
        {!categories.length ? (
          <EmptyState title={t('dash.admin.noCategories')} message={t('dash.admin.noCategoriesMsg')} />
        ) : (
          <div style={{ marginTop: 12 }}>
            <DataView mode={categoriesView.mode}>
              {categories.map((c) => (
                <DataCard
                  key={c.category_id}
                  title={c.name}
                  details={[{ label: 'ID', value: c.category_id }]}
                  actions={
                    <>
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
                    </>
                  }
                />
              ))}
            </DataView>
          </div>
        )}
        <ConfirmDelete open={deleteCatId != null} busy={busy} onConfirm={confirmDeleteCat} onCancel={() => setDeleteCatId(null)} title={t('dash.admin.deleteCategory')} />
      </div>
    </div>
  );
}
