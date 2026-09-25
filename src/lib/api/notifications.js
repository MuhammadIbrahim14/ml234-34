import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const NOTIF_SELECT = 'id, user_id, title, body, link, read_at, created_at';

export async function listNotifications(userId, { limit = 50 } = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  if (!userId) return { data: [], error: 'Not signed in.' };
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIF_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function countUnreadNotifications(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) return 0;
  return count || 0;
}

export async function markNotificationRead(id) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .select(NOTIF_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function markAllNotificationsRead(userId) {
  if (!isSupabaseConfigured || !supabase) return { error: DEMO_CRUD_MSG };
  if (!userId) return { error: 'Not signed in.' };
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  return { error: error ? apiError(error) : null };
}

/** Admin insert (or system). Prefer table insert under admin RLS. */
export async function createNotification({ userId, title, body = null, link = null }) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, body, link })
    .select(NOTIF_SELECT)
    .single();
  if (!error) return { data, error: null };

  // Optional RPC if available (migration may revoke client execute)
  const { data: rpcId, error: rpcErr } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_link: link,
  });
  if (rpcErr) return { data: null, error: apiError(error) };
  return { data: { id: rpcId }, error: null };
}
