export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (path.includes('#')) setTimeout(() => document.getElementById(path.split('#')[1])?.scrollIntoView({behavior:'smooth'}), 80); else window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function getRoute() {
  return window.location.pathname || '/';
}
