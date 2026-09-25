/** Fire a global MarketLink toast (App listens for `ml-flash`). */
export function flashToast(message) {
  if (!message) return;
  window.dispatchEvent(new CustomEvent('ml-flash', { detail: String(message) }));
}
