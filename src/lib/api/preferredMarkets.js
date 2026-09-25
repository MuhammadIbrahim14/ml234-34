import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const PREF_SELECT = `
  id, user_id, market_id, created_at,
  markets ( market_id, market_name, address, operating_days, timings, latitude, longitude, is_active )
`;

export async function listPreferredMarkets(userId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('preferred_markets')
    .select(PREF_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function isMarketPreferred(userId, marketId) {
  if (!isSupabaseConfigured || !supabase || !userId || marketId == null) return false;
  const { data } = await supabase
    .from('preferred_markets')
    .select('id')
    .eq('user_id', userId)
    .eq('market_id', marketId)
    .maybeSingle();
  return Boolean(data);
}

export async function togglePreferredMarket(userId, marketId) {
  if (!isSupabaseConfigured || !supabase) return { preferred: false, error: DEMO_CRUD_MSG };
  const { data: existing } = await supabase
    .from('preferred_markets')
    .select('id')
    .eq('user_id', userId)
    .eq('market_id', marketId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('preferred_markets').delete().eq('id', existing.id);
    return { preferred: false, error: error ? apiError(error) : null };
  }
  const { error } = await supabase.from('preferred_markets').insert({ user_id: userId, market_id: marketId });
  return { preferred: true, error: error ? apiError(error) : null };
}
