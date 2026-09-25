import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const ORDER_SELECT = `
  order_id, customer_id, farmer_id, product_id, quantity, total_amount,
  order_status, pickup_date, pickup_slot, order_date, updated_at,
  products ( product_id, name, unit, price, image_url, stock_quantity ),
  customer:profiles!orders_customer_id_fkey ( id, full_name, email, contact_number ),
  farmer:profiles!orders_farmer_id_fkey ( id, full_name )
`;

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

export async function cancelOrder(orderId) {
  return updateOrderStatus(orderId, 'cancelled');
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
  };
}
