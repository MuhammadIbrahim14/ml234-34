import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const FAV_SELECT = `
  favorite_id, customer_id, farmer_id, product_id, created_at,
  products ( product_id, name, price, unit, image_url, is_available ),
  profiles!favorites_farmer_id_fkey ( full_name, farmer_profiles ( stall_name ) )
`;

export async function listFavorites(customerId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('favorites')
    .select(FAV_SELECT)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function isProductFavorited(customerId, productId) {
  if (!isSupabaseConfigured || !supabase || !customerId || !productId) return false;
  const { data } = await supabase
    .from('favorites')
    .select('favorite_id')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleProductFavorite(customerId, productId) {
  if (!isSupabaseConfigured || !supabase) return { favorited: false, error: DEMO_CRUD_MSG };
  const { data: existing } = await supabase
    .from('favorites')
    .select('favorite_id')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('favorite_id', existing.favorite_id);
    return { favorited: false, error: error ? apiError(error) : null };
  }
  const { error } = await supabase.from('favorites').insert({ customer_id: customerId, product_id: productId });
  return { favorited: true, error: error ? apiError(error) : null };
}

export async function toggleFarmerFavorite(customerId, farmerId) {
  if (!isSupabaseConfigured || !supabase) return { favorited: false, error: DEMO_CRUD_MSG };
  const { data: existing } = await supabase
    .from('favorites')
    .select('favorite_id')
    .eq('customer_id', customerId)
    .eq('farmer_id', farmerId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('favorite_id', existing.favorite_id);
    return { favorited: false, error: error ? apiError(error) : null };
  }
  const { error } = await supabase.from('favorites').insert({ customer_id: customerId, farmer_id: farmerId });
  return { favorited: true, error: error ? apiError(error) : null };
}
