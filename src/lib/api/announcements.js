import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const ANN_SELECT = 'announcement_id, title, body, published_by, is_published, created_at';

export async function listAnnouncements({ publishedOnly = true } = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  let q = supabase.from('announcements').select(ANN_SELECT).order('created_at', { ascending: false });
  if (publishedOnly) q = q.eq('is_published', true);
  const { data, error } = await q;
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function createAnnouncement({ title, body, publishedBy, isPublished = true }) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      published_by: publishedBy || null,
      is_published: isPublished,
    })
    .select(ANN_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function updateAnnouncement(announcementId, patch) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('announcements')
    .update(patch)
    .eq('announcement_id', announcementId)
    .select(ANN_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function deleteAnnouncement(announcementId) {
  if (!isSupabaseConfigured || !supabase) return { error: DEMO_CRUD_MSG };
  const { error } = await supabase.from('announcements').delete().eq('announcement_id', announcementId);
  return { error: error ? apiError(error) : null };
}
