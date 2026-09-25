import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const ALERT_SELECT = `
  id, user_id, product_id, created_at,
  products ( product_id, name, price, unit, image_url, is_available, stock_quantity )
`;

export async function listRestockAlerts(userId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('restock_alerts')
    .select(ALERT_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function hasRestockAlert(userId, productId) {
  if (!isSupabaseConfigured || !supabase || !userId || !productId) return false;
  const { data } = await supabase
    .from('restock_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleRestockAlert(userId, productId) {
  if (!isSupabaseConfigured || !supabase) return { subscribed: false, error: DEMO_CRUD_MSG };
  const { data: existing } = await supabase
    .from('restock_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('restock_alerts').delete().eq('id', existing.id);
    return { subscribed: false, error: error ? apiError(error) : null };
  }
  const { error } = await supabase.from('restock_alerts').insert({ user_id: userId, product_id: productId });
  return { subscribed: true, error: error ? apiError(error) : null };
}
