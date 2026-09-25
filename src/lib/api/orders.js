import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const ORDER_SELECT = `
  order_id, customer_id, farmer_id, product_id, quantity, total_amount,
  order_status, pickup_date, pickup_slot, order_date, updated_at, updated_by_customer_at,
  products ( product_id, name, unit, price, image_url, stock_quantity ),
  customer:profiles!orders_customer_id_fkey ( id, full_name, email, contact_number ),
  farmer:profiles!orders_farmer_id_fkey (
    id, full_name,
    farmer_profiles ( order_cutoff_minutes, pickup_windows )
  )
`;

/** Extract first HH:MM from a pickup slot label (e.g. "Sat 09:00–12:00"). */
export function parseSlotStartTime(pickupSlot) {
  if (!pickupSlot || typeof pickupSlot !== 'string') return '00:00';
  const m = pickupSlot.match(/([01]?\d|2[0-3]):([0-5]\d)/);
  if (!m) return '00:00';
  return `${String(m[1]).padStart(2, '0')}:${m[2]}`;
}

/**
 * Wall-clock cutoff instant (local browser) = pickup start − cutoff minutes.
 * Returns null if pickup_date missing.
 */
export function getOrderEditCutoffAt(order, cutoffMinutes = 120) {
  if (!order?.pickup_date) return null;
  const start = parseSlotStartTime(order.pickup_slot);
  const pickup = new Date(`${order.pickup_date}T${start}:00`);
  if (Number.isNaN(pickup.getTime())) return null;
  const mins = Number.isFinite(Number(cutoffMinutes)) ? Number(cutoffMinutes) : 120;
  return new Date(pickup.getTime() - Math.max(mins, 0) * 60 * 1000);
}

export function getOrderCutoffMinutes(order) {
  const nested = order?.farmer?.farmer_profiles;
  const row = Array.isArray(nested) ? nested[0] : nested;
  const mins = row?.order_cutoff_minutes;
  return mins == null ? 120 : Number(mins);
}

/** True when status is placed and now is before farmer cutoff. */
export function canCustomerEditOrder(order, now = new Date()) {
  if (!order || order.order_status !== 'placed') return false;
  const cutoffAt = getOrderEditCutoffAt(order, getOrderCutoffMinutes(order));
  if (!cutoffAt) return false;
  return now.getTime() < cutoffAt.getTime();
}

export async function listOrdersForCustomer(customerId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('customer_id', customerId)
    .order('order_date', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function listOrdersForFarmer(farmerId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('farmer_id', farmerId)
    .order('order_date', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function listAllOrders({ limit = 100 } = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('order_date', { ascending: false })
    .limit(limit);
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function createOrder(row) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('orders').insert(row).select(ORDER_SELECT).single();
  return { data, error: error ? apiError(error) : null };
}

export async function createOrders(rows) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('orders').insert(rows).select(ORDER_SELECT);
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function updateOrderStatus(orderId, orderStatus) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: orderStatus, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select(ORDER_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

/** Accept order and decrement stock via transactional RPC (migration 005). */
export async function acceptOrder(orderId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };

  const { error: rpcErr } = await supabase.rpc('accept_order', { p_order_id: orderId });
  if (rpcErr) return { data: null, error: apiError(rpcErr) };

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_id', orderId)
    .single();
  return { data, error: error ? apiError(error) : null };
}

/** Cancel while placed + before farmer cutoff (migration 006). */
export async function cancelOrder(orderId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { error: rpcErr } = await supabase.rpc('update_order_before_cutoff', {
    p_order_id: orderId,
    p_quantity: null,
    p_cancel: true,
  });
  if (rpcErr) return { data: null, error: apiError(rpcErr) };

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_id', orderId)
    .single();
  return { data, error: error ? apiError(error) : null };
}

/** Change quantity while placed + before farmer cutoff (migration 006). */
export async function modifyOrderItems(orderId, quantity) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    return { data: null, error: 'Quantity must be at least 1.' };
  }
  const { error: rpcErr } = await supabase.rpc('modify_order_items', {
    p_order_id: orderId,
    p_quantity: Math.floor(qty),
  });
  if (rpcErr) return { data: null, error: apiError(rpcErr) };

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_id', orderId)
    .single();
  return { data, error: error ? apiError(error) : null };
}

/** Update qty or cancel via cutoff-gated RPC (migration 006). */
export async function updateOrderBeforeCutoff(orderId, { quantity = null, cancel = false } = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { error: rpcErr } = await supabase.rpc('update_order_before_cutoff', {
    p_order_id: orderId,
    p_quantity: quantity == null ? null : Math.floor(Number(quantity)),
    p_cancel: Boolean(cancel),
  });
  if (rpcErr) return { data: null, error: apiError(rpcErr) };

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_id', orderId)
    .single();
  return { data, error: error ? apiError(error) : null };
}

/**
 * Top products by sold qty (then revenue) from completed orders.
 * @returns {{ product_id: number|string, name: string, qty: number, revenue: number }[]}
 */
export function topProductsFromOrders(orders = [], { limit = 5 } = {}) {
  const completed = orders.filter((o) => o.order_status === 'completed');
  const byProduct = new Map();
  for (const o of completed) {
    const id = o.product_id;
    if (id == null) continue;
    const prev = byProduct.get(id) || {
      product_id: id,
      name: o.products?.name || 'Product',
      qty: 0,
      revenue: 0,
    };
    prev.qty += Number(o.quantity || 0);
    prev.revenue += Number(o.total_amount || 0);
    if (o.products?.name) prev.name = o.products.name;
    byProduct.set(id, prev);
  }
  return [...byProduct.values()]
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, Math.max(1, limit));
}

export function orderStats(orders = []) {
  const pending = orders.filter((o) => o.order_status === 'placed').length;
  const completed = orders.filter((o) => o.order_status === 'completed');
  const revenue = completed.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  return {
    total: orders.length,
    pending,
    completed: completed.length,
    revenue,
    bestsellers: topProductsFromOrders(orders, { limit: 5 }),
  };
}
