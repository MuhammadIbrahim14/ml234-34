import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const FARMER_SELECT = `
  id, user_id, stall_name, contact_person, education_level,
  operating_days, pickup_windows, order_cutoff_minutes, weekly_stock_template,
  latitude, longitude, map_provider,
  approved, created_at, updated_at,
  profiles:user_id ( id, full_name, email, contact_number, address, status, role, avatar_url )
`;

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Local weekday key matching template (Mon..Sun). */
export function todayWeekdayKey(date = new Date()) {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export async function listApprovedFarmers({ limit = 50 } = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('farmer_profiles')
    .select(FARMER_SELECT)
    .eq('approved', true)
    .order('stall_name')
    .limit(limit);
  if (error) return { data: [], error: apiError(error) };
  const active = (data || []).filter((f) => !f.profiles || f.profiles.status === 'active');
  return { data: active, error: null };
}

export async function listAllFarmerProfiles() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('farmer_profiles').select(FARMER_SELECT).order('created_at', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function getMyFarmerProfile(userId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('farmer_profiles').select(FARMER_SELECT).eq('user_id', userId).maybeSingle();
  return { data, error: error ? apiError(error) : null };
}

export async function updateFarmerProfile(userId, patch) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  // Strip approved unless caller is intentionally setting it (admin path uses setFarmerApproved).
  // DB trigger also blocks non-admin approved flips.
  const { data, error } = await supabase
    .from('farmer_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select(FARMER_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function setFarmerApproved(userId, approved) {
  return updateFarmerProfile(userId, { approved });
}

/** Persist weekday → product_id → qty map (does not change stock until apply). */
export async function saveWeeklyStockTemplate(userId, template) {
  return updateFarmerProfile(userId, {
    weekly_stock_template: template && typeof template === 'object' ? template : {},
  });
}

/**
 * Apply template for a weekday via security-invoker RPC (migration 008).
 * Respects approved-farmer product RLS — never elevates privileges.
 */
export async function applyWeeklyStockTemplate(weekday = null) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.rpc('apply_weekly_stock_template', {
    p_weekday: weekday || null,
  });
  return { data, error: error ? apiError(error) : null };
}

export async function farmerProductTags(farmerUserId, limit = 4) {
  if (!isSupabaseConfigured || !supabase || !farmerUserId) return [];
  const { data } = await supabase
    .from('products')
    .select('name')
    .eq('farmer_id', farmerUserId)
    .eq('is_available', true)
    .limit(limit);
  return (data || []).map((p) => p.name);
}
