import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const PROFILE_SELECT = 'id, email, full_name, contact_number, address, role, status, avatar_url, created_at, updated_at';

export async function updateMyProfile(userId, patch) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  if (!userId) return { data: null, error: 'Not signed in.' };

  const allowed = {};
  if (patch.full_name !== undefined) allowed.full_name = String(patch.full_name || '').trim();
  if (patch.contact_number !== undefined) allowed.contact_number = String(patch.contact_number || '').trim() || null;
  if (patch.address !== undefined) allowed.address = String(patch.address || '').trim() || null;
  if (patch.avatar_url !== undefined) allowed.avatar_url = patch.avatar_url || null;
  allowed.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(allowed)
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function getMyProfile(userId) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).eq('id', userId).maybeSingle();
  return { data, error: error ? apiError(error) : null };
}
