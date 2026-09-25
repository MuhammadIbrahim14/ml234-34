import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MapPin, Search, ShoppingCart, Heart, Send, Filter, CheckCircle2, Trash2, Star, Bell } from 'lucide-react';
import Img from './Img';
import { navigate } from '../router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { listMarkets } from '../lib/api/markets';
import { listProducts, productFarmerName } from '../lib/api/products';
import { listCategories } from '../lib/api/categories';
import { listApprovedFarmers, farmerProductTags, getMyFarmerProfile } from '../lib/api/farmers';
import { createOrders, listOrdersForCustomer, cancelOrder, modifyOrderItems, canCustomerEditOrder, getOrderCutoffMinutes, getOrderEditCutoffAt } from '../lib/api/orders';
import { listFavorites, toggleProductFavorite } from '../lib/api/favorites';
import { createReview, listReviewsForProduct, listReviewsForFarmer } from '../lib/api/reviews';
import { toggleRestockAlert, hasRestockAlert } from '../lib/api/restockAlerts';
import { listPreferredMarkets, togglePreferredMarket, isMarketPreferred } from '../lib/api/preferredMarkets';
import { googleDirectionsUrl, osmDirectionsUrl, hasCoords } from '../lib/api/geo';
import { IMG } from '../data/data';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from './ui/DataState';
import { DataView, DataViewToolbar, DataCard, useDataViewMode } from './ui/DataView';
import HeartBtn from './HeartBtn';
import MarketsOsmMap from './MarketsOsmMap';

const OPERATING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function statusLabel(t, status) {
  if (!status) return '';
  return t(`status.${status}`, { defaultValue: status });
}

function Header({ title, sub }) {
  const { t } = useTranslation();
  return (
    <div className="inner-page-head wrap">
      <span className="eyebrow">{t('pages.brand')}</span>
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  );
}

function Stars({ rating }) {
  const { t } = useTranslation();
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="review-stars" aria-label={t('pages.starsAria', { n })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

function ReviewList({ reviews, emptyMessage }) {
  const { t } = useTranslation();
  const empty = emptyMessage ?? t('pages.noReviews');
  if (!reviews?.length) {
    return <p className="muted review-empty">{empty}</p>;
  }
  return (
    <ul className="review-list">
      {reviews.map((r) => (
        <li key={r.review_id}>
          <div className="review-meta">
            <Stars rating={r.rating} />
            <small>{r.profiles?.full_name || t('pages.customer')}</small>
          </div>
          {r.comment ? <p>{r.comment}</p> : <p className="muted">{t('pages.noComment')}</p>}
          {r.farmer_response ? (
            <small className="review-response">
              {t('pages.farmerPrefix')} {r.farmer_response}
            </small>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function DirectionsLinks({ lat, lng }) {
  const { t } = useTranslation();
  const g = googleDirectionsUrl(lat, lng);
  const o = osmDirectionsUrl(lat, lng);
  if (!g && !o) return null;
  return (
    <div className="directions-links">
      {g && (
        <a className="btn sm ghost" href={g} target="_blank" rel="noopener noreferrer">
          {t('pages.googleDirections')}
        </a>
      )}
      {o && (
        <a className="btn sm ghost" href={o} target="_blank" rel="noopener noreferrer">
          {t('pages.osmDirections')}
        </a>
      )}
    </div>
  );
}

function NotifyRestockBtn({ productId, outOfStock }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!outOfStock || !isConfigured || !isAuthenticated || !user?.id || !productId) return;
      const sub = await hasRestockAlert(user.id, productId);
      if (!cancelled) setOn(sub);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, user?.id, isAuthenticated, isConfigured, outOfStock]);

  if (!outOfStock) return null;

  async function onClick(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isConfigured) return;
    setBusy(true);
    const { subscribed, error } = await toggleRestockAlert(user.id, productId);
    if (!error) setOn(subscribed);
    setBusy(false);
  }

  return (
    <button type="button" className={'btn sm ghost' + (on ? ' on' : '')} disabled={busy} onClick={onClick}>
      <Bell size={14} /> {on ? t('pages.alertSet') : t('pages.notifyBack')}
    </button>
  );
}

function PreferMarketBtn({ marketId, onToggled }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConfigured || !isAuthenticated || !user?.id || marketId == null) return;
      const pref = await isMarketPreferred(user.id, marketId);
      if (!cancelled) setOn(pref);
    })();
    return () => {
      cancelled = true;
    };
  }, [marketId, user?.id, isAuthenticated, isConfigured]);

  async function onClick(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isConfigured) return;
    setBusy(true);
    const { preferred, error } = await togglePreferredMarket(user.id, marketId);
    if (!error) {
      setOn(preferred);
      onToggled?.(preferred);
    }
    setBusy(false);
  }

  return (
    <button type="button" className={'btn sm ghost' + (on ? ' on' : '')} disabled={busy} onClick={onClick} aria-label={t('pages.preferMarketAria')}>
      <Heart size={14} fill={on ? 'currentColor' : 'none'} /> {on ? t('pages.preferred') : t('pages.prefer')}
    </button>
  );
}

export function MarketsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [mRes, fRes] = await Promise.all([listMarkets({ activeOnly: true }), listApprovedFarmers({ limit: 80 })]);
      setRows(mRes.data || []);
      setFarmers(fRes.data || []);
      setSelectedId(mRes.data?.[0]?.market_id ?? null);
      setError(mRes.error);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Header title={t('pages.marketsTitle')} sub={t('pages.marketsLead')} />
      <div className="wrap">
        <DemoModeNotice />
        {loading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : !rows.length ? (
          <EmptyState title={t('pages.marketsEmpty')} message={t('pages.marketsEmptyHint')} />
        ) : (
          <>
            <div className="markets-map-block" style={{ marginBottom: 24 }}>
              <MarketsOsmMap
                markets={rows}
                farmers={farmers}
                selectedId={selectedId}
                onSelect={(m) => setSelectedId(m.market_id)}
                height={360}
              />
            </div>
            <div className="catalog-grid">
              {rows.map((m) => {
                const coordsOk = hasCoords(m.latitude, m.longitude);
                return (
                  <article
                    className={'catalog-card' + (selectedId === m.market_id ? ' sel' : '')}
                    key={m.market_id}
                    onClick={() => setSelectedId(m.market_id)}
                  >
                    <div className="catalog-img">
                      <Img src={IMG.marketFallback} alt={m.market_name} />
                      <span>{m.is_active ? t('common.open') : t('common.closed')}</span>
                    </div>
                    <div className="catalog-body">
                      <h3>{m.market_name}</h3>
                      <p>
                        <MapPin size={14} /> {m.address || t('home.addressTbd')}
                      </p>
                      <small>
                        {(m.operating_days || []).join(', ') || t('home.scheduleTbd')}
                        {m.timings ? ` · ${m.timings}` : ''}
                        {coordsOk ? '' : ` · ${t('pages.locationPending')}`}
                      </small>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <PreferMarketBtn marketId={m.market_id} />
                        {coordsOk && <DirectionsLinks lat={m.latitude} lng={m.longitude} />}
                      </div>
                      <button className="btn sm" type="button" onClick={() => navigate('/products')}>
                        {t('home.browseProduce')} <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function ProductsPage() {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { isAuthenticated, role, ROLES } = useAuth();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [q, setQ] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || '';
    } catch {
      return '';
    }
  });
  const [categoryId, setCategoryId] = useState('');
  const [marketId, setMarketId] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [operatingDay, setOperatingDay] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailReviews, setDetailReviews] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const pageSize = 24;

  useEffect(() => {
    const syncQ = () => {
      try {
        const next = new URLSearchParams(window.location.search).get('q') || '';
        setQ(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('popstate', syncQ);
    return () => window.removeEventListener('popstate', syncQ);
  }, []);

  async function load() {
    setLoading(true);
    const offset = (page - 1) * pageSize;
    const [p, c, m] = await Promise.all([
      listProducts({
        availableOnly: true,
        search: q,
        categoryId: categoryId || null,
        marketId: marketId || null,
        priceMin: priceMin === '' ? null : priceMin,
        priceMax: priceMax === '' ? null : priceMax,
        operatingDay: operatingDay || null,
        limit: pageSize,
        offset,
      }),
      listCategories(),
      listMarkets({ activeOnly: true }),
    ]);
    setRows(p.data || []);
    setHasMore((p.data || []).length === pageSize);
    setCategories(c.data || []);
    setMarkets(m.data || []);
    setError(p.error);
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
  }, [q, categoryId, marketId, priceMin, priceMax, operatingDay]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, marketId, priceMin, priceMax, operatingDay, page]);

  async function openDetail(p) {
    setDetail(p);
    setDetailLoading(true);
    const { data } = await listReviewsForProduct(p.product_id);
    setDetailReviews(data || []);
    setDetailLoading(false);
  }

  function add(p) {
    addItem({
      product_id: p.product_id,
      farmer_id: p.farmer_id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      image_url: p.image_url,
      farmer_name: productFarmerName(p),
    });
    setToast(t('pages.addedCartNamed', { name: p.name }));
    setTimeout(() => setToast(''), 2000);
  }

  return (
    <>
      <Header title={t('pages.productsTitle')} sub={t('pages.productsLead')} />
      <div className="wrap product-toolbar">
        <div>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('pages.searchProducts')} />
        </div>
        <button className="btn ghost" type="button" onClick={() => setShowFilters((v) => !v)}>
          <Filter size={15} /> {t('pages.filters')}
        </button>
      </div>
      {showFilters && (
        <div className="wrap form-grid" style={{ marginBottom: 16 }}>
          <label>
            {t('pages.category')}
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t('common.all')}</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('pages.market')}
            <select value={marketId} onChange={(e) => setMarketId(e.target.value)}>
              <option value="">{t('common.all')}</option>
              {markets.map((m) => (
                <option key={m.market_id} value={m.market_id}>
                  {m.market_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('pages.priceMin')}
            <input type="number" min="0" step="1" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" />
          </label>
          <label>
            {t('pages.priceMax')}
            <input type="number" min="0" step="1" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder={t('pages.priceAny')} />
          </label>
          <label>
            {t('pages.dayFilter')}
            <select value={operatingDay} onChange={(e) => setOperatingDay(e.target.value)}>
              <option value="">{t('common.anyDay')}</option>
              {OPERATING_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="wrap">
        <DemoModeNotice />
        {toast && (
          <p className="muted" role="status">
            {toast}
          </p>
        )}
        {loading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !rows.length ? (
          <EmptyState title={t('pages.productsEmpty')} message={t('pages.productsEmptyHint')} />
        ) : (
          <>
            <div className="catalog-grid product-catalog">
              {rows.map((p) => {
                const outOfStock = !p.is_available || Number(p.stock_quantity) <= 0;
                return (
                  <article className="product-card" key={p.product_id}>
                    <div className="pc-img" role="button" tabIndex={0} onClick={() => openDetail(p)} onKeyDown={(e) => e.key === 'Enter' && openDetail(p)}>
                      <Img src={p.image_url || IMG.produceFallback} alt={p.name} />
                      <HeartBtn productId={p.product_id} />
                      {p.product_categories?.name && <span>{p.product_categories.name}</span>}
                    </div>
                    <div className="pc-body">
                      <h3>
                        <button type="button" className="linkish" onClick={() => openDetail(p)}>
                          {p.name}
                        </button>
                      </h3>
                      <p>
                        {productFarmerName(p)}
                        {p.markets?.market_name ? ` · ${p.markets.market_name}` : ''}
                      </p>
                      <strong>
                        {t('common.rs')} {p.price}
                        <small>/{p.unit}</small>
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <NotifyRestockBtn productId={p.product_id} outOfStock={outOfStock} />
                        <button
                          className="btn full"
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            if (!isAuthenticated) return navigate('/login');
                            if (role && role !== ROLES.CUSTOMER) return navigate('/cart');
                            add(p);
                          }}
                        >
                          {outOfStock ? t('pages.outOfStock') : (
                            <>
                              {t('pages.addToCart')} <ShoppingCart size={15} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t('home.prev')}
              </button>
              <span className="muted">{t('pages.pageLabel', { page })}</span>
              <button type="button" className="btn ghost" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
                {t('home.next')}
              </button>
            </div>
          </>
        )}
      </div>
      {detail && (
        <div className="product-drawer-backdrop" role="presentation" onClick={() => setDetail(null)}>
          <aside
            className="product-drawer"
            role="dialog"
            aria-label={detail.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="btn ghost sm" onClick={() => setDetail(null)}>
              {t('common.close')}
            </button>
            <div className="pc-img" style={{ borderRadius: 16, overflow: 'hidden', marginTop: 8 }}>
              <Img src={detail.image_url || IMG.produceFallback} alt={detail.name} />
            </div>
            <h2>{detail.name}</h2>
            <p className="muted">
              {productFarmerName(detail)}
              {detail.markets?.market_name ? ` · ${detail.markets.market_name}` : ''}
            </p>
            <strong>
              {t('common.rs')} {detail.price}
              <small>/{detail.unit}</small>
            </strong>
            {detail.description ? <p>{detail.description}</p> : null}
            <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <HeartBtn productId={detail.product_id} />
              <NotifyRestockBtn
                productId={detail.product_id}
                outOfStock={!detail.is_available || Number(detail.stock_quantity) <= 0}
              />
            </div>
            <h3 style={{ marginTop: 16, fontSize: 16 }}>{t('pages.reviews')}</h3>
            {detailLoading ? <LoadingBlock label={t('common.loading')} /> : <ReviewList reviews={detailReviews} />}
          </aside>
        </div>
      )}
    </>
  );
}

export function FarmersPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [tagsMap, setTagsMap] = useState({});
  const [reviewsMap, setReviewsMap] = useState({});
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await listApprovedFarmers();
      setRows(data || []);
      setError(err);
      const tags = {};
      await Promise.all(
        (data || []).map(async (f) => {
          tags[f.user_id] = await farmerProductTags(f.user_id);
        })
      );
      setTagsMap(tags);
      setLoading(false);
    })();
  }, []);

  async function toggleReviews(farmer) {
    const id = farmer.user_id;
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (reviewsMap[id]) return;
    const { data } = await listReviewsForFarmer(id);
    setReviewsMap((prev) => ({ ...prev, [id]: data || [] }));
  }

  return (
    <>
      <Header title={t('pages.farmersTitle')} sub={t('pages.farmersLead')} />
      <div className="wrap">
        <DemoModeNotice />
        {loading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : !rows.length ? (
          <EmptyState title={t('pages.farmersEmpty')} message={t('pages.farmersEmptyHint')} />
        ) : (
          <div className="catalog-grid farmer-catalog">
            {rows.map((f) => (
              <article className="farmer-card" key={f.id}>
                <div>
                  <Img src={f.profiles?.avatar_url || IMG.avatar} alt={f.stall_name} />
                </div>
                <section>
                  <span className="eyebrow">{f.approved ? t('common.verified') : t('auth.roleFarmer')}</span>
                  <h3>{f.stall_name}</h3>
                  <p>{f.contact_person || f.profiles?.full_name || t('home.localFarmer')}</p>
                  <small>
                    <MapPin size={13} /> {f.profiles?.address || t('home.localMarket')}
                    {(f.operating_days || []).length ? ` · ${(f.operating_days || []).join(', ')}` : ''}
                  </small>
                  {hasCoords(f.latitude, f.longitude) && (
                    <div style={{ margin: '8px 0' }}>
                      <DirectionsLinks lat={f.latitude} lng={f.longitude} />
                    </div>
                  )}
                  <div>
                    {(tagsMap[f.user_id] || []).map((tag) => (
                      <em key={tag}>{tag}</em>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <HeartBtn farmerId={f.user_id} />
                    <button className="btn sm ghost" type="button" onClick={() => toggleReviews(f)}>
                      {openId === f.user_id ? t('pages.hideReviews') : t('pages.reviews')}
                    </button>
                    <button className="btn sm" type="button" onClick={() => navigate('/products')}>
                      {t('pages.viewProduce')} <ArrowRight size={14} />
                    </button>
                  </div>
                  {openId === f.user_id && (
                    <div className="farmer-reviews-block">
                      <ReviewList reviews={reviewsMap[f.user_id]} emptyMessage={t('pages.noFarmerReviews')} />
                    </div>
                  )}
                </section>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <>
      <Header title={t('pages.aboutTitle')} sub={t('pages.aboutLead')} />
      <div className="wrap info-page">
        <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1300&q=85" alt={t('pages.aboutAlt')} />
        <div>
          <span className="eyebrow">{t('pages.aboutPurpose')}</span>
          <h2>{t('pages.aboutHeadline')}</h2>
          <p>{t('pages.aboutBody')}</p>
          <button className="btn" type="button" onClick={() => navigate('/markets')}>
            {t('home.ctaExplore')} <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <section className="wrap about-story" id="about-story" aria-labelledby="about-story-title">
        <span className="eyebrow">{t('pages.story.eyebrow')}</span>
        <h2 id="about-story-title">{t('pages.story.title')}</h2>
        <p className="muted">{t('pages.story.lead')}</p>
        <div className="about-story-grid">
          <article className="about-story-col before">
            <span className="about-story-label">{t('pages.story.beforeLabel')}</span>
            <h3>{t('pages.story.beforeTitle')}</h3>
            <p>{t('pages.story.beforeBody')}</p>
          </article>
          <article className="about-story-col after">
            <span className="about-story-label">{t('pages.story.afterLabel')}</span>
            <h3>{t('pages.story.afterTitle')}</h3>
            <p>{t('pages.story.afterBody')}</p>
          </article>
        </div>
      </section>
    </>
  );
}

export function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk('');
    const { submitContactMessage } = await import('../lib/api/contact');
    const { error: err, mailOk, mailError } = await submitContactMessage(form);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setForm({ name: '', email: '', message: '' });
    setOk(
      mailOk === false
        ? t('pages.contactEmailFailed', { detail: mailError ? `: ${mailError}` : '.' })
        : t('pages.contactSuccess')
    );
  }

  return (
    <>
      <Header title={t('pages.contactTitle')} sub={t('pages.contactLead')} />
      <div className="wrap contact-grid">
        <form className="contact-form" onSubmit={onSubmit}>
          <ErrorBanner message={error} />
          {ok && <p className="muted" role="status">{ok}</p>}
          <label>
            {t('pages.nameLabel')}
            <input
              required
              placeholder={t('pages.contactName')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            {t('pages.emailLabel')}
            <input
              type="email"
              required
              placeholder={t('pages.contactEmailPlaceholder')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            {t('pages.messageLabel')}
            <textarea
              required
              placeholder={t('pages.contactMessagePlaceholder')}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? t('pages.contactSending') : t('pages.contactSend')} <Send size={15} />
          </button>
        </form>
        <div className="contact-card">
          <MapPin size={25} />
          <h3>{t('pages.contactHub')}</h3>
          <p>{t('pages.contactCity')}</p>
          <small>{t('pages.contactHubHint')}</small>
          <button className="btn ghost" type="button" onClick={() => navigate('/markets')}>
            {t('pages.findMarkets')} <MapPin size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { listNotifications } = await import('../lib/api/notifications');
    const { data, error: err } = await listNotifications(user.id);
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]);

  async function onRead(id) {
    const { markNotificationRead } = await import('../lib/api/notifications');
    await markNotificationRead(id);
    await load();
  }

  async function onReadAll() {
    const { markAllNotificationsRead } = await import('../lib/api/notifications');
    await markAllNotificationsRead(user.id);
    await load();
  }

  return (
    <>
      <Header title={t('pages.notificationsTitle')} sub={t('pages.notificationsLead')} />
      <div className="wrap">
        <DemoModeNotice />
        {!isConfigured ? null : loading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !rows.length ? (
          <EmptyState title={t('pages.notificationsEmpty')} message={t('pages.notificationsEmptyHint')} />
        ) : (
          <>
            {rows.some((n) => !n.read_at) && (
              <button className="btn sm" type="button" onClick={onReadAll} style={{ marginBottom: 12 }}>
                {t('pages.markAllRead')}
              </button>
            )}
            <div className="notif-list">
              {rows.map((n) => (
                <article key={n.id} className={'notif-item' + (n.read_at ? '' : ' unread')}>
                  <div className="notif-body">
                    <b>{n.title}</b>
                    {n.body && <p>{n.body}</p>}
                    <small>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</small>
                    <div className="notif-actions">
                      {n.link && (
                        <button type="button" className="btn sm ghost" onClick={() => navigate(n.link)}>
                          {t('pages.open')}
                        </button>
                      )}
                      {!n.read_at && (
                        <button type="button" className="btn sm" onClick={() => onRead(n.id)}>
                          {t('pages.markRead')}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function CartPage() {
  const { t } = useTranslation();
  const { items, removeItem, updateQty, total, clear } = useCart();
  const { user, profile, isAuthenticated, role, ROLES, isConfigured } = useAuth();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [cutoffMinutes, setCutoffMinutes] = useState(120);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');

  useEffect(() => {
    (async () => {
      const farmerIds = [...new Set(items.map((i) => i.farmer_id).filter(Boolean))];
      if (!farmerIds.length) {
        setSlots([]);
        setCutoffMinutes(120);
        return;
      }
      const windows = [];
      let maxCutoff = 120;
      for (const id of farmerIds) {
        const { data } = await getMyFarmerProfile(id);
        const pw = Array.isArray(data?.pickup_windows) ? data.pickup_windows : [];
        pw.forEach((w) => windows.push(w.label || `${w.day} ${w.start}–${w.end}`));
        const mins = data?.order_cutoff_minutes != null ? Number(data.order_cutoff_minutes) : 120;
        if (Number.isFinite(mins) && mins > maxCutoff) maxCutoff = mins;
      }
      setSlots([...new Set(windows)]);
      setCutoffMinutes(maxCutoff);
    })();
  }, [items]);

  async function checkout() {
    setError(null);
    setOk('');
    if (!isConfigured) {
      setError(t('pages.checkoutNeedsLive'));
      return;
    }
    if (!isAuthenticated || role !== ROLES.CUSTOMER) {
      navigate('/login');
      return;
    }
    if (!items.length) {
      setError(t('pages.basketEmptyError'));
      return;
    }
    if (!pickupDate || !pickupSlot) {
      setError(t('pages.choosePickup'));
      return;
    }
    setBusy(true);
    const rows = items.map((i) => ({
      customer_id: user.id,
      farmer_id: i.farmer_id,
      product_id: i.product_id,
      quantity: i.quantity,
      total_amount: Number((i.price * i.quantity).toFixed(2)),
      pickup_date: pickupDate,
      pickup_slot: pickupSlot,
      order_status: 'placed',
    }));
    const { data: created, error: err } = await createOrders(rows);
    setBusy(false);
    if (err) setError(err);
    else {
      const toEmail = profile?.email || user?.email || '';
      if (toEmail) {
        const { sendOrderConfirmationMail } = await import('../lib/emailjs');
        const enriched = (created || []).map((o) => {
          const cartItem = items.find((i) => i.product_id === o.product_id);
          return {
            ...o,
            product_name: o.products?.name || cartItem?.name,
            unit: o.products?.unit || cartItem?.unit,
          };
        });
        const mail = await sendOrderConfirmationMail({
          toEmail,
          toName: profile?.full_name || 'Customer',
          orders: enriched.length ? enriched : rows,
          pickupDate,
          pickupSlot,
        });
        if (!mail.ok) {
          console.warn('[MarketLink] order email:', mail.error);
        }
      }
      clear();
      setOk(t('pages.ordersPlacedOk'));
      navigate('/orders');
    }
  }

  return (
    <>
      <Header title={t('pages.cartTitle')} sub={t('pages.cartLead')} />
      <div className="wrap cart-page">
        <DemoModeNotice />
        <ErrorBanner message={error} />
        {ok && <p className="muted">{ok}</p>}
        {!items.length ? (
          <EmptyState
            title={t('pages.cartEmpty')}
            message={t('pages.cartEmptyHint')}
            action={
              <button className="btn sm" type="button" onClick={() => navigate('/products')} style={{ marginTop: 8 }}>
                {t('pages.browseProducts')}
              </button>
            }
          />
        ) : (
          <>
            {items.map((i) => (
              <div className="cart-item" key={i.product_id}>
                <div>
                  <CheckCircle2 size={22} />
                  <div>
                    <b>{i.name}</b>
                    <small>
                      {i.quantity} {i.unit} · {i.farmer_name}
                    </small>
                    <label>
                      {t('common.qty')}
                      <input
                        type="number"
                        min="1"
                        value={i.quantity}
                        onChange={(e) => updateQty(i.product_id, e.target.value)}
                        style={{ width: 64, marginLeft: 8 }}
                      />
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong>{t('common.rs')} {(i.price * i.quantity).toFixed(0)}</strong>
                  <button type="button" className="btn ghost sm" onClick={() => removeItem(i.product_id)} aria-label={t('pages.removeAria')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="form-grid" style={{ marginTop: 16 }}>
              <label>
                {t('pages.pickupDate')}
                <input type="date" required value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              </label>
              <label>
                {t('pages.pickupSlot')}
                <select required value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
                  <option value="">{t('pages.selectSlot')}</option>
                  {(slots.length
                    ? slots.map((slot) => ({ value: slot, label: slot }))
                    : [
                        { value: 'Morning 8–11 AM', label: t('pages.slotMorning') },
                        { value: 'Afternoon 2–5 PM', label: t('pages.slotAfternoon') },
                      ]
                  ).map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {t('pages.cutoffHint', { minutes: cutoffMinutes })}
            </p>
            <div className="cart-total">
              <span>{t('pages.totalPickup')}</span>
              <b>{t('common.rs')} {total.toFixed(0)}</b>
              <button className="btn" type="button" disabled={busy} onClick={checkout}>
                {busy ? t('pages.placing') : t('pages.placeOrder')}
              </button>
              <button className="btn ghost" type="button" onClick={() => navigate('/products')}>
                {t('pages.continueShopping')} <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function OrdersPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, role, ROLES, isConfigured } = useAuth();
  const { preloadItems } = useCart();
  const { mode, setMode } = useDataViewMode('customer-orders');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({});
  const [qtyDraft, setQtyDraft] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listOrdersForCustomer(user.id);
    setRows(data || []);
    const nextQty = {};
    (data || []).forEach((o) => {
      nextQty[o.order_id] = o.quantity;
    });
    setQtyDraft(nextQty);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]);

  function onOrderAgain(order) {
    const p = order.products;
    preloadItems([
      {
        product_id: order.product_id,
        farmer_id: order.farmer_id,
        name: p?.name || 'Product',
        price: p?.price ?? order.total_amount / Math.max(1, order.quantity),
        unit: p?.unit || 'kg',
        image_url: p?.image_url || null,
        farmer_name: 'Local farmer',
        quantity: order.quantity,
      },
    ]);
    navigate('/cart');
  }

  async function onSaveQty(order) {
    setError(null);
    if (!canCustomerEditOrder(order)) {
      setError(t('pages.orderEditClosed'));
      return;
    }
    const qty = Number(qtyDraft[order.order_id]);
    if (!Number.isFinite(qty) || qty < 1) {
      setError(t('pages.qtyMinError'));
      return;
    }
    setBusyId(order.order_id);
    const { error: err } = await modifyOrderItems(order.order_id, qty);
    setBusyId(null);
    if (err) setError(err);
    else load();
  }

  async function onCancel(order) {
    setError(null);
    if (!canCustomerEditOrder(order)) {
      setError(t('pages.orderEditClosed'));
      return;
    }
    setBusyId(order.order_id);
    const { error: err } = await cancelOrder(order.order_id);
    setBusyId(null);
    if (err) setError(err);
    else load();
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header title={t('pages.ordersTitle')} sub={t('pages.ordersLoginLead')} />
        <div className="wrap">
          <EmptyState
            title={t('pages.loginRequired')}
            message={t('pages.ordersLoginMsg')}
            action={
              <button className="btn sm" type="button" onClick={() => navigate('/login')} style={{ marginTop: 8 }}>
                {t('nav.login')}
              </button>
            }
          />
        </div>
      </>
    );
  }

  if (role && role !== ROLES.CUSTOMER) {
    return (
      <>
        <Header title={t('pages.ordersTitle')} sub={t('pages.ordersWrongRoleLead')} />
        <div className="wrap">
          <EmptyState title={t('pages.wrongRole')} message={t('pages.wrongRoleMsg')} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={t('pages.ordersTitle')} sub={t('pages.ordersLead')} />
      <div className="wrap">
        <DemoModeNotice />
        <ErrorBanner message={error} />
        {!isConfigured ? null : loading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : !rows.length ? (
          <EmptyState title={t('pages.ordersEmpty')} message={t('pages.ordersEmptyHint')} />
        ) : (
          <>
            <div className="panel-title" style={{ marginBottom: 12 }}>
              <div>
                <span className="eyebrow">{t('pages.brand')}</span>
                <h3>{t('pages.ordersTitle')}</h3>
              </div>
              <DataViewToolbar mode={mode} onChange={setMode} />
            </div>
            <DataView mode={mode}>
              {rows.map((o) => {
                const editable = canCustomerEditOrder(o);
                const cutoffAt = getOrderEditCutoffAt(o, getOrderCutoffMinutes(o));
                const cutoffLabel = cutoffAt
                  ? cutoffAt.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                  : null;
                return (
                  <DataCard
                    key={o.order_id}
                    title={`#${o.order_id} — ${o.products?.name || t('pages.productFallback')}`}
                    subtitle={[
                      t('pages.orderLineMeta', { qty: o.quantity, rs: t('common.rs'), amount: o.total_amount }),
                      o.pickup_date || null,
                      o.pickup_slot || null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    status={statusLabel(t, o.order_status)}
                    statusClass="s1"
                    actions={
                      editable ? (
                        <button type="button" disabled={busyId === o.order_id} onClick={() => onCancel(o)}>
                          {t('pages.cancelOrder')}
                        </button>
                      ) : null
                    }
                  >
                    {o.order_status === 'placed' && cutoffLabel && (
                      <small className="muted" style={{ display: 'block' }}>
                        {editable
                          ? t('pages.editableUntil', { when: cutoffLabel })
                          : t('pages.changesClosedAfter', { when: cutoffLabel })}
                      </small>
                    )}
                    {editable && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <label>
                          {t('common.qty')}
                          <input
                            type="number"
                            min="1"
                            value={qtyDraft[o.order_id] ?? o.quantity}
                            onChange={(e) => setQtyDraft({ ...qtyDraft, [o.order_id]: e.target.value })}
                            style={{ width: 64, marginLeft: 8 }}
                            disabled={busyId === o.order_id}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn sm"
                          disabled={busyId === o.order_id}
                          onClick={() => onSaveQty(o)}
                        >
                          {busyId === o.order_id ? t('common.saving') : t('pages.updateQty')}
                        </button>
                      </div>
                    )}
                    {o.order_status === 'completed' && (
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="btn sm" style={{ marginBottom: 8 }} onClick={() => onOrderAgain(o)}>
                          {t('pages.orderAgain')}
                        </button>
                        <label>
                          {t('pages.rateLabel')}
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={reviewDraft[o.order_id]?.rating || ''}
                            onChange={(e) =>
                              setReviewDraft({
                                ...reviewDraft,
                                [o.order_id]: { ...reviewDraft[o.order_id], rating: e.target.value },
                              })
                            }
                          />
                        </label>
                        <input
                          placeholder={t('pages.commentPlaceholder')}
                          value={reviewDraft[o.order_id]?.comment || ''}
                          onChange={(e) =>
                            setReviewDraft({
                              ...reviewDraft,
                              [o.order_id]: { ...reviewDraft[o.order_id], comment: e.target.value },
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn sm"
                          onClick={async () => {
                            const d = reviewDraft[o.order_id] || {};
                            const rating = Number(d.rating);
                            if (!rating || rating < 1 || rating > 5) {
                              setError(t('pages.ratingError'));
                              return;
                            }
                            const { error: err } = await createReview({
                              productId: o.product_id,
                              customerId: user.id,
                              farmerId: o.farmer_id,
                              rating,
                              comment: d.comment || '',
                            });
                            if (err) setError(err);
                            else setError(null);
                          }}
                        >
                          {t('pages.submitReview')}
                        </button>
                      </div>
                    )}
                  </DataCard>
                );
              })}
            </DataView>
          </>
        )}
      </div>
    </>
  );
}

export function FavoritesPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const [fav, pref] = await Promise.all([listFavorites(user.id), listPreferredMarkets(user.id)]);
    setRows(fav.data || []);
    setMarkets(pref.data || []);
    setError(fav.error || pref.error);
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <Header title={t('pages.favoritesTitle')} sub={t('pages.favoritesLead')} />
        <div className="wrap">
          <EmptyState
            title={t('pages.loginRequired')}
            message={t('pages.favoritesLoginMsg')}
            action={
              <button className="btn sm" type="button" onClick={() => navigate('/login')} style={{ marginTop: 8 }}>
                {t('nav.login')}
              </button>
            }
          />
        </div>
      </>
    );
  }

  const productFavs = rows.filter((f) => f.product_id && f.products);
  const farmerFavs = rows.filter((f) => f.farmer_id && !f.product_id);
  const emptyAll = !productFavs.length && !farmerFavs.length && !markets.length;

  return (
    <>
      <Header title={t('pages.favoritesTitle')} sub={t('pages.favoritesLeadFull')} />
      <div className="wrap">
        <DemoModeNotice />
        {!isConfigured ? null : loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : emptyAll ? (
          <EmptyState title={t('pages.favoritesEmpty')} message={t('pages.favoritesEmptyHint')} />
        ) : (
          <>
            {markets.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: 22, marginBottom: 12 }}>{t('pages.preferredMarkets')}</h2>
                <div className="catalog-grid">
                  {markets.map((row) => {
                    const m = row.markets;
                    if (!m) return null;
                    return (
                      <article className="catalog-card" key={row.id}>
                        <div className="catalog-img">
                          <Img src={IMG.marketFallback} alt={m.market_name} />
                        </div>
                        <div className="catalog-body">
                          <h3>{m.market_name}</h3>
                          <p>
                            <MapPin size={14} /> {m.address || t('home.addressTbd')}
                          </p>
                          <small>{(m.operating_days || []).join(', ') || t('home.scheduleTbd')}</small>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <PreferMarketBtn marketId={m.market_id} onToggled={() => load()} />
                            {hasCoords(m.latitude, m.longitude) && (
                              <DirectionsLinks lat={m.latitude} lng={m.longitude} />
                            )}
                            <button className="btn sm" type="button" onClick={() => navigate('/products')}>
                              {t('pages.browse')} <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
            {productFavs.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: 22, marginBottom: 12 }}>{t('pages.savedProducts')}</h2>
                <div className="catalog-grid product-catalog">
                  {productFavs.map((f) => {
                    const p = f.products;
                    const outOfStock = !p.is_available || Number(p.stock_quantity) <= 0;
                    return (
                      <article className="product-card" key={f.favorite_id}>
                        <div className="pc-img">
                          <Img src={p.image_url || IMG.produceFallback} alt={p.name} />
                          <Heart size={17} />
                        </div>
                        <div className="pc-body">
                          <h3>{p.name}</h3>
                          <strong>
                            {t('common.rs')} {p.price}
                            <small>/{p.unit}</small>
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <NotifyRestockBtn productId={p.product_id} outOfStock={outOfStock} />
                            <button
                              className="btn ghost full"
                              type="button"
                              onClick={async () => {
                                await toggleProductFavorite(user.id, p.product_id);
                                load();
                              }}
                            >
                              {t('pages.remove')}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
            {farmerFavs.length > 0 && (
              <section>
                <h2 style={{ fontSize: 22, marginBottom: 12 }}>{t('pages.savedFarmers')}</h2>
                <div className="catalog-grid">
                  {farmerFavs.map((f) => {
                    const stall =
                      (Array.isArray(f.profiles?.farmer_profiles)
                        ? f.profiles.farmer_profiles[0]?.stall_name
                        : f.profiles?.farmer_profiles?.stall_name) ||
                      f.profiles?.full_name ||
                      t('auth.roleFarmer');
                    return (
                      <article className="catalog-card" key={f.favorite_id}>
                        <div className="catalog-body">
                          <h3>{stall}</h3>
                          <p>{t('pages.savedFarmerLabel')}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
