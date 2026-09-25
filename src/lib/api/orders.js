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

/** Accept order and decrement stock in one flow. */
export async function acceptOrder(orderId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };

  const { data: existing, error: fetchErr } = await supabase
    .from('orders')
    .select('order_id, order_status, product_id, quantity')
    .eq('order_id', orderId)
    .maybeSingle();
  if (fetchErr) return { data: null, error: apiError(fetchErr) };
  if (!existing) return { data: null, error: 'Order not found.' };
  if (existing.order_status !== 'placed') return { data: null, error: 'Only placed orders can be accepted.' };

  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('product_id, stock_quantity')
    .eq('product_id', existing.product_id)
    .maybeSingle();
  if (pErr) return { data: null, error: apiError(pErr) };
  if (!product || product.stock_quantity < existing.quantity) {
    return { data: null, error: 'Not enough stock to accept this order.' };
  }

  const nextStock = product.stock_quantity - existing.quantity;
  const stockPatch = {
    stock_quantity: nextStock,
    updated_at: new Date().toISOString(),
  };
  if (nextStock === 0) stockPatch.is_available = false;

  const { error: stockErr } = await supabase.from('products').update(stockPatch).eq('product_id', product.product_id);
  if (stockErr) return { data: null, error: apiError(stockErr) };

  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: 'accepted', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select(ORDER_SELECT)
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
