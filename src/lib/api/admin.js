import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

export async function listCustomers() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, contact_number, address, role, status, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function listProfilesByRole(role) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, contact_number, address, role, status, created_at')
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

export async function getOrdersByDateRange(fromIso, toIso) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  let q = supabase.from('orders').select('order_id, total_amount, order_status, order_date');
  if (fromIso) q = q.gte('order_date', fromIso);
  if (toIso) q = q.lte('order_date', toIso);
  const { data, error } = await q;
  return { data: data || [], error: error ? apiError(error) : null };
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
