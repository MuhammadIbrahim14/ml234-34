import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

export async function listCustomers() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, contact_number, address, role, status, avatar_url, created_at, updated_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function listProfilesByRole(role) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, contact_number, address, role, status, avatar_url, created_at, updated_at')
    .eq('role', role)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function setProfileStatus(userId, status) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function getDashboardCounts() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: { farmers: 0, customers: 0, markets: 0, orders: 0, products: 0 },
      error: DEMO_CRUD_MSG,
    };
  }
  const [farmers, customers, markets, orders, products] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'farmer'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('markets').select('market_id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('order_id', { count: 'exact', head: true }),
    supabase.from('products').select('product_id', { count: 'exact', head: true }),
  ]);
  return {
    data: {
      farmers: farmers.count || 0,
      customers: customers.count || 0,
      markets: markets.count || 0,
      orders: orders.count || 0,
      products: products.count || 0,
    },
    error: null,
  };
}

const REPORT_ORDER_SELECT = `
  order_id, total_amount, order_status, order_date, farmer_id, product_id,
  products (
    product_id, name, market_id,
    markets ( market_id, market_name )
  ),
  farmer:profiles!orders_farmer_id_fkey (
    id, full_name,
    farmer_profiles ( stall_name )
  )
`;

export async function getOrdersByDateRange(fromIso, toIso) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  let q = supabase.from('orders').select(REPORT_ORDER_SELECT);
  if (fromIso) q = q.gte('order_date', fromIso);
  if (toIso) q = q.lte('order_date', toIso);
  const { data, error } = await q;
  return { data: data || [], error: error ? apiError(error) : null };
}

/** Aggregate completed-order revenue by market (order → product → market). */
export function revenueByMarket(orders) {
  const map = new Map();
  for (const o of orders || []) {
    if (o.order_status !== 'completed') continue;
    const market = o.products?.markets;
    const key = market?.market_id != null ? String(market.market_id) : 'none';
    const name = market?.market_name || 'Unassigned market';
    const cur = map.get(key) || { marketId: market?.market_id ?? null, marketName: name, revenue: 0, orders: 0 };
    cur.revenue += Number(o.total_amount || 0);
    cur.orders += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

/** Top farmers by completed revenue (and order count). */
export function topFarmersByRevenue(orders, { limit = 10 } = {}) {
  const map = new Map();
  for (const o of orders || []) {
    if (o.order_status !== 'completed') continue;
    const id = o.farmer_id;
    if (!id) continue;
    const fp = o.farmer?.farmer_profiles;
    const stall = Array.isArray(fp) ? fp[0]?.stall_name : fp?.stall_name;
    const cur = map.get(id) || {
      farmerId: id,
      name: stall || o.farmer?.full_name || 'Farmer',
      revenue: 0,
      orders: 0,
    };
    cur.revenue += Number(o.total_amount || 0);
    cur.orders += 1;
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.orders - a.orders).slice(0, limit);
}


export async function saveReport({ generatedBy, reportType, payload }) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('reports')
    .insert({
      generated_by: generatedBy,
      report_type: reportType,
      payload: payload || {},
    })
    .select()
    .single();
  return { data, error: error ? apiError(error) : null };
}
