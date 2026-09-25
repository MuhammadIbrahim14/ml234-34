import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const MARKET_SELECT = 'market_id, market_name, address, operating_days, timings, latitude, longitude, map_provider, is_active, created_at';

function notConfigured() {
  return { data: [], error: DEMO_CRUD_MSG };
}

export async function listMarkets({ activeOnly = false, limit = 100 } = {}) {
  if (!isSupabaseConfigured || !supabase) return notConfigured();
  let q = supabase.from('markets').select(MARKET_SELECT).order('market_name').limit(limit);
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function getMarket(marketId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('markets').select(MARKET_SELECT).eq('market_id', marketId).maybeSingle();
  return { data, error: error ? apiError(error) : null };
}

export async function createMarket(payload) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('markets').insert(payload).select(MARKET_SELECT).single();
  return { data, error: error ? apiError(error) : null };
}

export async function updateMarket(marketId, patch) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('markets').update(patch).eq('market_id', marketId).select(MARKET_SELECT).single();
  return { data, error: error ? apiError(error) : null };
}

export async function deleteMarket(marketId) {
  if (!isSupabaseConfigured || !supabase) return { error: DEMO_CRUD_MSG };
  const { error } = await supabase.from('markets').delete().eq('market_id', marketId);
  return { error: error ? apiError(error) : null };
}

/** Map pin % from lat/lng when present; otherwise distribute by index. */
export function marketPinPosition(market, index = 0, total = 1) {
  if (market?.latitude != null && market?.longitude != null) {
    const lat = Number(market.latitude);
    const lng = Number(market.longitude);
    // Rough Lahore-centric normalization for decorative SVG map
    const x = Math.min(90, Math.max(10, ((lng - 74.2) / 0.3) * 80 + 10));
    const y = Math.min(85, Math.max(15, ((31.6 - lat) / 0.25) * 70 + 15));
    return { x, y };
  }
  const t = Math.max(total, 1);
  return { x: 20 + ((index * 67) % 70), y: 25 + ((index * 41) % 55) };
}
