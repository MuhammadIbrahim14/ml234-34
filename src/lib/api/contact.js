import { supabase, isSupabaseConfigured } from '../supabase';
import { apiError, DEMO_CRUD_MSG } from './errors';
import { isEmailJsConfigured, sendMarketLinkMail } from '../emailjs';

export async function submitContactMessage({ name, email, message }) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const row = {
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    message: String(message || '').trim(),
  };
  if (!row.name || !row.email || !row.message) {
    return { data: null, error: 'Name, email, and message are required.' };
  }

  const { data, error } = await supabase.from('contact_messages').insert(row).select('id, created_at').single();
  if (error) return { data: null, error: apiError(error) };

  let mailOk = true;
  let mailError = null;
  if (isEmailJsConfigured()) {
    const adminTo = import.meta.env.VITE_CONTACT_TO_EMAIL || 'foraptech080@gmail.com';
    const mail = await sendMarketLinkMail({
      toEmail: adminTo,
      toName: 'MarketLink Admin',
      subject: `MarketLink contact from ${row.name}`,
      heading: 'New contact message',
      intro: `${row.name} (${row.email}) sent a message via the Contact page.`,
      otpCode: '',
      details: row.message,
      footerNote: 'Reply directly to the sender email listed above.',
    });
    mailOk = mail.ok;
    mailError = mail.error || null;
  }

  return { data, error: null, mailOk, mailError };
}

export async function listContactMessages({ limit = 50 } = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: DEMO_CRUD_MSG };
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, name, email, message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error: error ? apiError(error) : null };
}

export async function subscribeNewsletter(email) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: DEMO_CRUD_MSG };
  const trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    return { data: null, error: 'Enter a valid email address.' };
  }
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email: trimmed }, { onConflict: 'email' })
    .select('id, email, created_at')
    .single();
  if (error) {
    // Unique race / already subscribed — treat as success
    if (String(error.message || '').toLowerCase().includes('duplicate') || error.code === '23505') {
      return { data: { email: trimmed }, error: null };
    }
    return { data: null, error: apiError(error) };
  }
  return { data, error: null };
}
