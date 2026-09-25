/**
 * MarketLink FAQ knowledge base (offline).
 * Optional later: same UI can call an LLM when VITE_FAQ_LLM_API_KEY is set.
 */

export const FAQ_SUGGESTIONS = [
  { id: 'market_timings', label: 'Market timings' },
  { id: 'pickup', label: 'How pickup works' },
  { id: 'register_farmer', label: 'Register as farmer' },
  { id: 'cart_orders', label: 'Cart & orders' },
];

/** @typedef {{ id: string, keywords: string[], answer: string, links?: { href: string, label: string }[] }} FaqEntry */

/** @type {FaqEntry[]} */
export const FAQ_ENTRIES = [
  {
    id: 'market_timings',
    keywords: [
      'timing', 'timings', 'hours', 'open', 'opens', 'opening', 'schedule',
      'when', 'day', 'days', 'operating', 'market day', 'market days', 'time',
      'weekend', 'saturday', 'sunday',
    ],
    answer:
      'Market days and hours come from each market’s operating days and each farmer’s stall schedule. Open Markets to see locations, days, and map pins — then tap a market or farmer for details. Pickup slots at checkout follow the farmer’s listed windows.',
    links: [
      { href: '/markets', label: 'Browse markets' },
      { href: '/farmers', label: 'See farmers' },
    ],
  },
  {
    id: 'pickup',
    keywords: [
      'pickup', 'pick up', 'pick-up', 'collect', 'slot', 'pre-order', 'preorder',
      'how it works', 'checkout', 'pay', 'payment', 'stall',
    ],
    answer:
      'MarketLink is pickup only — no delivery. Discover markets and produce, add items to your basket, then choose a pickup date and slot at checkout. Pay at the stall when you collect. Farmers may close changes a set number of minutes before your slot starts; you can edit or cancel while the order is still Placed and before that cutoff.',
    links: [
      { href: '/products', label: 'Shop products' },
      { href: '/cart', label: 'Open cart' },
      { href: '/#how-it-works', label: 'How it works' },
    ],
  },
  {
    id: 'register_farmer',
    keywords: [
      'farmer', 'register', 'signup', 'sign up', 'sell', 'stall', 'grower',
      'vendor', 'become a farmer', 'join as farmer',
    ],
    answer:
      'To sell on MarketLink: open Register, choose Farmer, and complete your profile (stall name, area, etc.). An admin must approve your stall before products go public. After approval, use the farmer dashboard to add products, set pickup windows, and manage orders.',
    links: [
      { href: '/register', label: 'Register' },
      { href: '/about', label: 'About MarketLink' },
    ],
  },
  {
    id: 'cart_orders',
    keywords: [
      'cart', 'basket', 'order', 'orders', 'track', 'tracking', 'checkout',
      'favorite', 'favorites', 'notification', 'notifications', 'where is',
    ],
    answer:
      'Your basket is under Cart in the top nav (or /cart). After checkout, track pickup status on Orders (/orders). Favorites and restock alerts live under Favorites; notifications under the bell. Customers shop on the public site — there is no separate customer dashboard.',
    links: [
      { href: '/cart', label: 'Cart' },
      { href: '/orders', label: 'My orders' },
      { href: '/favorites', label: 'Favorites' },
    ],
  },
  {
    id: 'contact',
    keywords: ['contact', 'help', 'support', 'email', 'message', 'question'],
    answer:
      'Need something else? Use the Contact page to send a message to the MarketLink team. You can also browse FAQs here with the quick topics below.',
    links: [{ href: '/contact', label: 'Contact us' }],
  },
];

const FALLBACK =
  'I can help with market timings, how pickup works, registering as a farmer, and where to find your cart or orders. Try one of the topics below, or visit Contact for more help.';

/**
 * Score a user message against local FAQ entries.
 * @param {string} text
 * @returns {{ entry: FaqEntry | null, answer: string }}
 */
export function matchFaq(text) {
  const q = String(text || '')
    .toLowerCase()
    .replace(/[^\w\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q) return { entry: null, answer: FALLBACK };

  let best = null;
  let bestScore = 0;
  for (const entry of FAQ_ENTRIES) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.includes(' ') ? 3 : 2;
    }
    if (entry.id === q || FAQ_SUGGESTIONS.some((s) => s.id === entry.id && s.label.toLowerCase() === q)) {
      score += 20;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore < 2) {
    return { entry: null, answer: FALLBACK };
  }
  return { entry: best, answer: best.answer };
}

/** Resolve by suggestion chip id. */
export function getFaqById(id) {
  return FAQ_ENTRIES.find((e) => e.id === id) || null;
}

/**
 * Optional LLM hook point — returns null when no key / not implemented.
 * UI stays useful offline; wire a real provider later without changing the panel.
 * @param {string} _userText
 * @returns {Promise<string | null>}
 */
export async function tryOptionalLlmAnswer(_userText) {
  const key = import.meta.env.VITE_FAQ_LLM_API_KEY;
  if (!key) return null;
  // Placeholder: offline FAQ remains the default until a provider is wired.
  return null;
}
