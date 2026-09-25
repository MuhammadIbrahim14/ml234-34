import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';

const REVIEW_SELECT = `
  review_id, product_id, customer_id, farmer_id, rating, comment, farmer_response, review_date,
  products ( product_id, name ),
  profiles:customer_id ( full_name )
`;

export async function listReviewsForProduct(productId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('product_id', productId)
    .order('review_date', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function listReviewsForFarmer(farmerId) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('farmer_id', farmerId)
    .order('review_date', { ascending: false });
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function createReview({ productId, customerId, farmerId, rating, comment }) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      customer_id: customerId,
      farmer_id: farmerId || null,
      rating,
      comment: comment || null,
    })
    .select(REVIEW_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function updateFarmerResponse(reviewId, farmerResponse) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('reviews')
    .update({ farmer_response: farmerResponse })
    .eq('review_id', reviewId)
    .select(REVIEW_SELECT)
    .single();
  return { data, error: error ? apiError(error) : null };
}

export async function averageRatingForProduct(productId) {
  const { data } = await listReviewsForProduct(productId);
  if (!data?.length) return null;
  const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
  return { avg: Math.round(avg * 10) / 10, count: data.length };
}
