import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const FARMER_SELECT = `
  id, user_id, stall_name, contact_person, education_level,
  operating_days, pickup_windows, latitude, longitude, map_provider,
  approved, created_at, updated_at,
  profiles:user_id ( id, full_name, email, contact_number, address, status, role, avatar_url )
`;

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
