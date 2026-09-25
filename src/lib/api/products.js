import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const PRODUCT_SELECT = `
  product_id, farmer_id, market_id, category_id, name, description,
  price, unit, stock_quantity, image_url, is_available, created_at, updated_at,
  product_categories ( category_id, name ),
  markets ( market_id, market_name, operating_days ),
  profiles!farmer_id ( id, full_name, farmer_profiles ( stall_name, approved, operating_days ) )
`;

function notConfigured() {
  return { data: [], error: DEMO_CRUD_MSG };
}

function isApprovedFarmerProduct(p) {
  const fp = p?.profiles?.farmer_profiles;
  const row = Array.isArray(fp) ? fp[0] : fp;
  return row?.approved === true;
}

/**
 * @param {object} opts
 * @param {boolean} [opts.approvedFarmersOnly] — default true for public catalog;
 *   false for admin; auto-skipped when farmerId is set (owner list).
 */
export async function listProducts({
  availableOnly = false,
  farmerId = null,
  categoryId = null,
  marketId = null,
  search = '',
  priceMin = null,
  priceMax = null,
  operatingDay = null,
  limit = 100,
  offset = 0,
  approvedFarmersOnly,
} = {}) {
  if (!isSupabaseConfigured || !supabase) return notConfigured();

  let q = supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (availableOnly) q = q.eq('is_available', true);
  if (farmerId) q = q.eq('farmer_id', farmerId);
  if (categoryId) q = q.eq('category_id', categoryId);
  if (marketId) q = q.eq('market_id', marketId);
  if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`);
  if (priceMin != null && priceMin !== '' && !Number.isNaN(Number(priceMin))) {
    q = q.gte('price', Number(priceMin));
  }
  if (priceMax != null && priceMax !== '' && !Number.isNaN(Number(priceMax))) {
    q = q.lte('price', Number(priceMax));
  }

  const day = operatingDay?.trim?.() || (typeof operatingDay === 'string' ? operatingDay.trim() : '');
  if (day) {
    const [mkRes, fpRes] = await Promise.all([
      supabase.from('markets').select('market_id').contains('operating_days', [day]),
      supabase.from('farmer_profiles').select('user_id').eq('approved', true).contains('operating_days', [day]),
    ]);
    if (mkRes.error) return { data: [], error: apiError(mkRes.error) };
    if (fpRes.error) return { data: [], error: apiError(fpRes.error) };
    const marketIds = (mkRes.data || []).map((m) => m.market_id);
    const farmerIds = (fpRes.data || []).map((f) => f.user_id);
    if (!marketIds.length && !farmerIds.length) {
      return { data: [], error: null };
    }
    const parts = [];
    if (marketIds.length) parts.push(`market_id.in.(${marketIds.join(',')})`);
    if (farmerIds.length) parts.push(`farmer_id.in.(${farmerIds.map((id) => `"${id}"`).join(',')})`);
    q = q.or(parts.join(','));
  }

  const { data, error } = await q;
  if (error) return { data: [], error: apiError(error) };

  const filterApproved = approvedFarmersOnly === true || (approvedFarmersOnly !== false && !farmerId);
  const rows = filterApproved ? (data || []).filter(isApprovedFarmerProduct) : data || [];
  return { data: rows, error: null };
}

export async function listLowStockProducts({ threshold = 10, limit = 12, approvedFarmersOnly = true } = {}) {
  if (!isSupabaseConfigured || !supabase) return notConfigured();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_available', true)
    .gt('stock_quantity', 0)
    .lte('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true })
    .limit(limit);
  if (error) return { data: [], error: apiError(error) };
  const rows = approvedFarmersOnly ? (data || []).filter(isApprovedFarmerProduct) : data || [];
  return { data: rows, error: null };
}

export async function getProduct(productId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('product_id', productId).maybeSingle();
  return { data, error: error ? apiError(error) : null };
}

export async function createProduct(payload) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('products').insert(payload).select(PRODUCT_SELECT).single();
  return { data, error: error ? apiError(error) : null };
}

export async function updateProduct(productId, patch) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('products')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('product_id', productId)
    .select(PRODUCT_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

/**
 * Hard-delete when no orders reference the product.
 * If orders exist (FK restrict), hides the product instead so order history stays intact.
 * Returns { error, data: { hiddenDueToOrders?: boolean } }.
 */
export async function deleteProduct(productId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };

  const { count, error: countErr } = await supabase
    .from('orders')
    .select('order_id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (countErr) return { data: null, error: apiError(countErr) };

  if ((count || 0) > 0) {
    const { error: hideErr } = await setProductAvailable(productId, false);
    if (hideErr) return { data: null, error: hideErr };
    return { data: { hiddenDueToOrders: true }, error: null };
  }

  const { error } = await supabase.from('products').delete().eq('product_id', productId);
  if (error) {
    const msg = apiError(error) || '';
    if (/orders_product_id_fkey|foreign key/i.test(msg)) {
      const { error: hideErr } = await setProductAvailable(productId, false);
      if (hideErr) return { data: null, error: hideErr };
      return { data: { hiddenDueToOrders: true }, error: null };
    }
    return { data: null, error: msg };
  }
  return { data: { deleted: true }, error: null };
}

export async function setProductAvailable(productId, isAvailable) {
  return updateProduct(productId, { is_available: isAvailable });
}

export function productFarmerName(p) {
  const fp = p?.profiles?.farmer_profiles;
  const stall = Array.isArray(fp) ? fp[0]?.stall_name : fp?.stall_name;
  return stall || p?.profiles?.full_name || 'Local farmer';
}

export function productImage(p) {
  return p?.image_url || null;
}
