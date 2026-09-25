import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

export async function listCategories() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('product_categories').select('category_id, name, created_at').order('name');
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function createCategory(name) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase.from('product_categories').insert({ name: name.trim() }).select().single();
  return { data, error: error ? apiError(error) : null };
}

export async function updateCategory(categoryId, name) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('product_categories')
    .update({ name: name.trim() })
    .eq('category_id', categoryId)
    .select()
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function deleteCategory(categoryId) {
  if (!isSupabaseConfigured || !supabase) return { error: DEMO_CRUD_MSG };
  const { error } = await supabase.from('product_categories').delete().eq('category_id', categoryId);
  return { error: error ? apiError(error) : null };
}
