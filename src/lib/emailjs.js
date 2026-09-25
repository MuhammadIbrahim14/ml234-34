/**
 * MarketLink mailing via EmailJS — one professional template, multiple intents.
 *
 * Template variables (configure the same names in EmailJS dashboard):
 *   to_email, to_name, subject, heading, intro, otp_code, details, footer_note, app_name
 *
 * Leave otp_code empty for non-OTP mails (e.g. order confirmation).
 */

import emailjs from '@emailjs/browser';

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

let initialized = false;

function ensureInit() {
  if (!initialized && publicKey) {
    emailjs.init({ publicKey });
    initialized = true;
  }
}

export function isEmailJsConfigured() {
  return Boolean(serviceId && templateId && publicKey);
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Email service timed out. Try again in a moment.')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * @param {object} params
 */
export async function sendMarketLinkMail({
  toEmail,
  toName = 'MarketLink member',
  subject,
  heading,
  intro,
  otpCode = '',
  details = '',
  footerNote = 'MarketLink — fresh from local hands.',
}) {
  if (!isEmailJsConfigured()) {
    return { ok: false, error: 'EmailJS is not configured. Set VITE_EMAILJS_* env vars.' };
  }
  if (!toEmail?.trim()) {
    return { ok: false, error: 'Recipient email is required.' };
  }

  try {
    ensureInit();
    await withTimeout(
      emailjs.send(serviceId, templateId, {
        to_email: toEmail.trim(),
        to_name: toName || 'MarketLink member',
        subject: subject || 'MarketLink notification',
        heading: heading || 'MarketLink',
        intro: intro || '',
        otp_code: otpCode || '',
        details: details || '',
        footer_note: footerNote,
        app_name: 'MarketLink',
        // Common EmailJS template aliases (helps if template uses different names)
        user_email: toEmail.trim(),
        user_name: toName || 'MarketLink member',
        message: [intro, otpCode ? `OTP: ${otpCode}` : '', details, footerNote].filter(Boolean).join('\n\n'),
      }),
      12000
    );
    return { ok: true };
  } catch (err) {
    const message = err?.text || err?.message || 'Failed to send email.';
    console.warn('[MarketLink] EmailJS:', message);
    return { ok: false, error: message };
  }
}

/** Forgot-password OTP mail (same template). */
export async function sendPasswordOtpMail({ toEmail, toName, otp }) {
  return sendMarketLinkMail({
    toEmail,
    toName,
    subject: 'MarketLink password reset OTP',
    heading: 'Password reset',
    intro: 'Use this one-time code to reset your MarketLink password. It expires in 10 minutes. If you did not request this, you can ignore this email.',
    otpCode: String(otp),
    details: 'Enter the OTP on the login page, then choose a new password.',
    footerNote: 'Never share this code. MarketLink will never ask for your password by email.',
  });
}

/** Order confirmation mail (same template, otp_code left empty). */
export async function sendOrderConfirmationMail({ toEmail, toName, orders = [], pickupDate, pickupSlot }) {
  const lines = (orders || []).map((o, i) => {
    const name = o.products?.name || o.product_name || `Item ${i + 1}`;
    const qty = o.quantity;
    const unit = o.products?.unit || o.unit || '';
    const amount = Number(o.total_amount || 0).toFixed(2);
    const id = o.order_id != null ? `#${o.order_id}` : '';
    return `${id} ${name} × ${qty} ${unit} — Rs. ${amount}`.trim();
  });
  const total = (orders || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const details = [
    ...lines,
    '',
    `Pickup date: ${pickupDate || '—'}`,
    `Pickup slot: ${pickupSlot || '—'}`,
    `Order total (pay at pickup): Rs. ${total.toFixed(2)}`,
  ].join('\n');

  return sendMarketLinkMail({
    toEmail,
    toName,
    subject: 'MarketLink order confirmation',
    heading: 'Order confirmed',
    intro: 'Thank you for pre-ordering with MarketLink. Your pickup details are below. Pay at the stall — no online payment.',
    otpCode: '',
    details,
    footerNote: 'Track status anytime under My Orders on MarketLink.',
  });
}
