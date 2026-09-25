import { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Search, ShoppingCart, Heart, Send, Filter, CheckCircle2, Trash2 } from 'lucide-react';
import Img from './Img';
import { navigate } from '../router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { listMarkets, marketPinPosition } from '../lib/api/markets';
import { listProducts, productFarmerName } from '../lib/api/products';
import { listCategories } from '../lib/api/categories';
import { listApprovedFarmers, farmerProductTags, getMyFarmerProfile } from '../lib/api/farmers';
import { createOrders, listOrdersForCustomer, cancelOrder } from '../lib/api/orders';
import { listFavorites, toggleProductFavorite } from '../lib/api/favorites';
import { createReview } from '../lib/api/reviews';
import { IMG } from '../data/data';
import { LoadingBlock, ErrorBanner, EmptyState, DemoModeNotice } from './ui/DataState';
import HeartBtn from './HeartBtn';

function Header({ title, sub }) {
  return (
    <div className="inner-page-head wrap">
      <span className="eyebrow">MarketLink</span>
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  );
}

export function MarketsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await listMarkets({ activeOnly: true });
      setRows(data || []);
      setError(err);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Header title="Explore Farmers Markets" sub="Find fresh local produce, market days and convenient pickup points." />
      <div className="wrap">
        <DemoModeNotice />
        {loading ? (
          <LoadingBlock label="Loading markets…" />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : !rows.length ? (
          <EmptyState title="No markets yet" message="Active markets will appear here once an admin adds them." />
        ) : (
          <div className="catalog-grid">
            {rows.map((m, i) => {
              const pin = marketPinPosition(m, i, rows.length);
              return (
                <article className="catalog-card" key={m.market_id}>
                  <div className="catalog-img">
                    <Img src={IMG.marketFallback} alt={m.market_name} />
                    <span>{m.is_active ? 'Open' : 'Closed'}</span>
                  </div>
                  <div className="catalog-body">
                    <h3>{m.market_name}</h3>
                    <p>
                      <MapPin size={14} /> {m.address || 'Address coming soon'}
                    </p>
                    <small>
                      {(m.operating_days || []).join(', ') || 'Days TBD'}
                      {m.timings ? ` · ${m.timings}` : ''}
                      {m.latitude != null ? ` · pin ${Math.round(pin.x)}%,${Math.round(pin.y)}%` : ''}
                    </small>
                    <button className="btn sm" type="button" onClick={() => navigate('/products')}>
                      Browse produce <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export function ProductsPage() {
  const { addItem } = useCart();
  const { isAuthenticated, role, ROLES } = useAuth();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [marketId, setMarketId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 24;

  async function load() {
    setLoading(true);
    const offset = (page - 1) * pageSize;
    const [p, c, m] = await Promise.all([
      listProducts({
        availableOnly: true,
        search: q,
        categoryId: categoryId || null,
        marketId: marketId || null,
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
  }, [q, categoryId, marketId]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, marketId, page]);

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
    setToast(p.name + ' added to cart');
    setTimeout(() => setToast(''), 2000);
  }

  return (
    <>
      <Header title="Fresh Products" sub="Browse vegetables, fruits and seasonal produce from local farmers." />
      <div className="wrap product-toolbar">
        <div>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
        </div>
        <button className="btn ghost" type="button" onClick={() => setShowFilters((v) => !v)}>
          <Filter size={15} /> Filters
        </button>
      </div>
      {showFilters && (
        <div className="wrap form-grid" style={{ marginBottom: 16 }}>
          <label>
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Market
            <select value={marketId} onChange={(e) => setMarketId(e.target.value)}>
              <option value="">All</option>
              {markets.map((m) => (
                <option key={m.market_id} value={m.market_id}>
                  {m.market_name}
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
          <LoadingBlock label="Loading products…" />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !rows.length ? (
          <EmptyState title="No products yet" message="Available produce will show here when farmers list stock." />
        ) : (
          <>
            <div className="catalog-grid product-catalog">
              {rows.map((p) => (
                <article className="product-card" key={p.product_id}>
                  <div className="pc-img">
                    <Img src={p.image_url || IMG.produceFallback} alt={p.name} />
                    <HeartBtn productId={p.product_id} />
                    {p.product_categories?.name && <span>{p.product_categories.name}</span>}
                  </div>
                  <div className="pc-body">
                    <h3>{p.name}</h3>
                    <p>
                      {productFarmerName(p)}
                      {p.markets?.market_name ? ` · ${p.markets.market_name}` : ''}
                    </p>
                    <strong>
                      Rs. {p.price}
                      <small>/{p.unit}</small>
                    </strong>
                    <button
                      className="btn full"
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) return navigate('/login');
                        if (role && role !== ROLES.CUSTOMER) return navigate('/cart');
                        add(p);
                      }}
                    >
                      Add to Cart <ShoppingCart size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </button>
              <span className="muted">Page {page}</span>
              <button type="button" className="btn ghost" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function FarmersPage() {
  const [rows, setRows] = useState([]);
  const [tagsMap, setTagsMap] = useState({});
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

  return (
    <>
      <Header title="Meet Local Farmers" sub="Real people growing and supplying fresh food to their communities." />
      <div className="wrap">
        <DemoModeNotice />
        {loading ? (
          <LoadingBlock label="Loading farmers…" />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : !rows.length ? (
          <EmptyState title="No approved farmers yet" message="Approved farmer stalls will appear here." />
        ) : (
          <div className="catalog-grid farmer-catalog">
            {rows.map((f) => (
              <article className="farmer-card" key={f.id}>
                <div>
                  <Img src={f.profiles?.avatar_url || IMG.avatar} alt={f.stall_name} />
                </div>
                <section>
                  <span className="eyebrow">{f.approved ? 'Verified' : 'Farmer'}</span>
                  <h3>{f.stall_name}</h3>
                  <p>{f.contact_person || f.profiles?.full_name || 'Local farmer'}</p>
                  <small>
                    <MapPin size={13} /> {f.profiles?.address || 'Local market'}
                  </small>
                  <div>
                    {(tagsMap[f.user_id] || []).map((t) => (
                      <em key={t}>{t}</em>
                    ))}
                  </div>
                  <button className="btn sm" type="button" onClick={() => navigate('/products')}>
                    View produce <ArrowRight size={14} />
                  </button>
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
  return (
    <>
      <Header title="About MarketLink" sub="A digital bridge between local farmers, markets and their communities." />
      <div className="wrap info-page">
        <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1300&q=85" alt="Farm landscape" />
        <div>
          <span className="eyebrow">Our purpose</span>
          <h2>Fresh food. Stronger local connections.</h2>
          <p>
            MarketLink brings market availability, farmer profiles, product discovery and pickup pre-orders into one friendly
            experience. Customers can discover nearby markets, browse products, save favorites and review completed orders.
          </p>
          <button className="btn" type="button" onClick={() => navigate('/markets')}>
            Explore Markets <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <Header title="Contact Us" sub="Have a question about markets, farmers or pickup? Reach out." />
      <div className="wrap contact-grid">
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            alert('Thanks — your message was recorded locally. Connect a mail backend later.');
          }}
        >
          <label>
            Name
            <input required placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" required placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea required placeholder="How can we help?" />
          </label>
          <button className="btn" type="submit">
            Send Message <Send size={15} />
          </button>
        </form>
        <div className="contact-card">
          <MapPin size={25} />
          <h3>MarketLink Community Hub</h3>
          <p>Lahore, Pakistan</p>
          <small>Browse live markets on the Markets page for pickup locations.</small>
          <button className="btn ghost" type="button" onClick={() => navigate('/markets')}>
            Find Markets <MapPin size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

export function CartPage() {
  const { items, removeItem, updateQty, total, clear } = useCart();
  const { user, isAuthenticated, role, ROLES, isConfigured } = useAuth();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState('');

  useEffect(() => {
    (async () => {
      const farmerIds = [...new Set(items.map((i) => i.farmer_id).filter(Boolean))];
      if (!farmerIds.length) {
        setSlots([]);
        return;
      }
      const windows = [];
      for (const id of farmerIds) {
        const { data } = await getMyFarmerProfile(id);
        const pw = Array.isArray(data?.pickup_windows) ? data.pickup_windows : [];
        pw.forEach((w) => windows.push(w.label || `${w.day} ${w.start}–${w.end}`));
      }
      setSlots([...new Set(windows)]);
    })();
  }, [items]);

  async function checkout() {
    setError(null);
    setOk('');
    if (!isConfigured) {
      setError('Checkout needs live Supabase.');
      return;
    }
    if (!isAuthenticated || role !== ROLES.CUSTOMER) {
      navigate('/login');
      return;
    }
    if (!items.length) {
      setError('Your basket is empty.');
      return;
    }
    if (!pickupDate || !pickupSlot) {
      setError('Choose a pickup date and slot.');
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
    const { error: err } = await createOrders(rows);
    setBusy(false);
    if (err) setError(err);
    else {
      clear();
      setOk('Orders placed. Track them under My Orders.');
      navigate('/orders');
    }
  }

  return (
    <>
      <Header title="Your Basket" sub="Review your selected produce before choosing a pickup slot." />
      <div className="wrap cart-page">
        <DemoModeNotice />
        <ErrorBanner message={error} />
        {ok && <p className="muted">{ok}</p>}
        {!items.length ? (
          <EmptyState
            title="Basket is empty"
            message="Browse products and add items to pre-order for pickup."
            action={
              <button className="btn sm" type="button" onClick={() => navigate('/products')} style={{ marginTop: 8 }}>
                Browse products
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
                      Qty
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
                  <strong>Rs. {(i.price * i.quantity).toFixed(0)}</strong>
                  <button type="button" className="btn ghost sm" onClick={() => removeItem(i.product_id)} aria-label="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="form-grid" style={{ marginTop: 16 }}>
              <label>
                Pickup date
                <input type="date" required value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              </label>
              <label>
                Pickup slot
                <select required value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
                  <option value="">Select slot</option>
                  {(slots.length ? slots : ['Morning 8–11 AM', 'Afternoon 2–5 PM']).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="cart-total">
              <span>Total at pickup</span>
              <b>Rs. {total.toFixed(0)}</b>
              <button className="btn" type="button" disabled={busy} onClick={checkout}>
                {busy ? 'Placing…' : 'Place pre-order'}
              </button>
              <button className="btn ghost" type="button" onClick={() => navigate('/products')}>
                Continue Shopping <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function OrdersPage() {
  const { user, isAuthenticated, role, ROLES, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({});

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listOrdersForCustomer(user.id);
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <Header title="My Orders" sub="Sign in as a customer to view order history." />
        <div className="wrap">
          <EmptyState
            title="Login required"
            message="Customers track pickup orders here."
            action={
              <button className="btn sm" type="button" onClick={() => navigate('/login')} style={{ marginTop: 8 }}>
                Login
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
        <Header title="My Orders" sub="Order history is for customer accounts." />
        <div className="wrap">
          <EmptyState title="Wrong role" message="Use your dashboard for farmer/admin order tools." />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="My Orders" sub="Track pickup status and leave reviews after completion." />
      <div className="wrap">
        <DemoModeNotice />
        {!isConfigured ? null : loading ? (
          <LoadingBlock label="Loading orders…" />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !rows.length ? (
          <EmptyState title="No orders yet" message="Place a pre-order from your basket to see it here." />
        ) : (
          <div className="mini-table">
            {rows.map((o) => (
              <div className="tr" key={o.order_id}>
                <span>
                  <b>
                    #{o.order_id} — {o.products?.name || 'Product'}
                  </b>
                  <small>
                    Qty {o.quantity} · Rs. {o.total_amount}
                    {o.pickup_date ? ` · ${o.pickup_date}` : ''} {o.pickup_slot || ''}
                  </small>
                  {o.order_status === 'completed' && (
                    <div style={{ marginTop: 8 }}>
                      <label>
                        Rate 1–5
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
                        placeholder="Comment"
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
                            setError('Rating must be 1–5.');
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
                        Submit review
                      </button>
                    </div>
                  )}
                </span>
                <span className="status s1">{o.order_status}</span>
                <span>
                  {o.order_status === 'placed' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const { error: err } = await cancelOrder(o.order_id);
                        if (err) setError(err);
                        else load();
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function FavoritesPage() {
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await listFavorites(user.id);
    setRows(data || []);
    setError(err);
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <Header title="Favorites" sub="Save products you love." />
        <div className="wrap">
          <EmptyState
            title="Login required"
            message="Sign in to manage favorites."
            action={
              <button className="btn sm" type="button" onClick={() => navigate('/login')} style={{ marginTop: 8 }}>
                Login
              </button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Favorites" sub="Your saved products and farmers." />
      <div className="wrap">
        <DemoModeNotice />
        {!isConfigured ? null : loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !rows.length ? (
          <EmptyState title="No favorites yet" message="Tap the heart on a product to save it here." />
        ) : (
          <div className="catalog-grid product-catalog">
            {rows.map((f) => {
              if (f.product_id && f.products) {
                const p = f.products;
                return (
                  <article className="product-card" key={f.favorite_id}>
                    <div className="pc-img">
                      <Img src={p.image_url || IMG.produceFallback} alt={p.name} />
                      <Heart size={17} />
                    </div>
                    <div className="pc-body">
                      <h3>{p.name}</h3>
                      <strong>
                        Rs. {p.price}
                        <small>/{p.unit}</small>
                      </strong>
                      <button
                        className="btn ghost full"
                        type="button"
                        onClick={async () => {
                          await toggleProductFavorite(user.id, p.product_id);
                          load();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              }
              const stall =
                (Array.isArray(f.profiles?.farmer_profiles)
                  ? f.profiles.farmer_profiles[0]?.stall_name
                  : f.profiles?.farmer_profiles?.stall_name) || f.profiles?.full_name || 'Farmer';
              return (
                <article className="catalog-card" key={f.favorite_id}>
                  <div className="catalog-body">
                    <h3>{stall}</h3>
                    <p>Saved farmer</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
