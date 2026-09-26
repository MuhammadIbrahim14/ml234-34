import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Search, Sun, Moon, Heart, ShoppingCart, LayoutDashboard, Package, LogOut, LogIn, Bell, Leaf } from 'lucide-react';
import { navigate } from '../../router';
import Logo from '../../components/Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { flashToast } from '../../lib/flashToast';
import { countUnreadNotifications } from '../../lib/api/notifications';

export default function Navbar({ setTheme, dark, cart, active }) {
  const { t } = useTranslation();
  const { isAuthenticated, dashboardPath, signOut, profile, role, loading, user, isConfigured } = useAuth();
  const showDashboard = isAuthenticated && dashboardPath.startsWith('/dashboard');
  const displayName = profile?.full_name || profile?.email || t('common.member');
  const [unread, setUnread] = useState(0);
  const [navQ, setNavQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [portalHost, setPortalHost] = useState(null);
  const navRef = useRef(null);
  const path = active || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const links = [
    [t('nav.home'), '/'],
    [t('nav.markets'), '/markets'],
    [t('nav.products'), '/products'],
    [t('nav.farmers'), '/farmers'],
    [t('nav.about'), '/about'],
  ];

  useEffect(() => {
    const host = navRef.current?.closest('.ml') || document.body;
    setPortalHost(host);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConfigured || !isAuthenticated || !user?.id) {
        if (!cancelled) setUnread(0);
        return;
      }
      const n = await countUnreadNotifications(user.id);
      if (!cancelled) setUnread(n);
    })();
    const tmr = setInterval(async () => {
      if (!isConfigured || !isAuthenticated || !user?.id) return;
      const n = await countUnreadNotifications(user.id);
      if (!cancelled) setUnread(n);
    }, 45000);
    return () => {
      cancelled = true;
      clearInterval(tmr);
    };
  }, [isConfigured, isAuthenticated, user?.id]);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 1150) setMenuOpen(false);
    };
    const ml = navRef.current?.closest('.ml');
    ml?.classList.add('menu-open-lock');
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      ml?.classList.remove('menu-open-lock');
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  async function onLogout() {
    if (loading) return;
    setMenuOpen(false);
    await signOut();
    flashToast(t('nav.logoutToast'));
    navigate('/');
  }

  function goNotifications() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (showDashboard) {
      navigate(`${dashboardPath}/notifications`);
    } else {
      navigate('/notifications');
    }
  }

  function submitSearch(e) {
    if (e) e.preventDefault();
    const q = navQ.trim();
    setMenuOpen(false);
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  }

  function go(p) {
    setMenuOpen(false);
    navigate(p);
  }

  const vineMenu = (
    <div
      className={'nav-vine' + (menuOpen ? ' is-open' : '')}
      id="ml-vine-menu"
      aria-hidden={!menuOpen}
      inert={menuOpen ? undefined : true}
    >
      <button
        type="button"
        className="nav-vine-scrim"
        aria-label={t('nav.closeMenu')}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />
      <div className="nav-vine-sheet" role="dialog" aria-modal="true" aria-label={t('nav.menuTitle')}>
        <div className="nav-vine-stem" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="nav-vine-head">
          <div>
            <span className="eyebrow">{t('pages.brand')}</span>
            <h2>{t('nav.menuTitle')}</h2>
          </div>
          <button
            type="button"
            className="nav-vine-close"
            aria-label={t('nav.closeMenu')}
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <form className="nav-vine-search" onSubmit={submitSearch}>
          <Search size={16} aria-hidden />
          <input
            value={navQ}
            onChange={(e) => setNavQ(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('common.search')}
          />
        </form>

        <nav className="nav-vine-links" aria-label={t('nav.primary')}>
          {links.map(([l, p], i) => (
            <button
              key={p}
              type="button"
              className={'nav-vine-link' + (path === p ? ' on' : '')}
              style={{ '--i': i }}
              onClick={() => go(p)}
            >
              <span className="nav-vine-dot" aria-hidden="true" />
              <span className="nav-vine-label">{l}</span>
              <Leaf size={16} aria-hidden />
            </button>
          ))}
        </nav>

        <div className="nav-vine-foot">
          <LanguageSwitcher />
          {!isAuthenticated ? (
            <button type="button" className="btn sm" onClick={() => go('/login')}>
              {t('nav.login')}
            </button>
          ) : showDashboard ? (
            <button type="button" className="btn sm" onClick={() => go(dashboardPath)}>
              {t('nav.dashboard')}
            </button>
          ) : (
            <button type="button" className="btn sm" onClick={() => go('/orders')}>
              {t('nav.orders')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <header className={'nav' + (menuOpen ? ' nav-menu-open' : '')} ref={navRef}>
      <div className="wrap nav-in">
        <button className="nav-logo-btn" type="button" onClick={() => go('/')}>
          <Logo />
        </button>
        <nav className="links" aria-label={t('nav.primary')}>
          {links.map(([l, p]) => (
            <button
              key={p}
              type="button"
              className={path === p ? 'on' : ''}
              onClick={() => navigate(p)}
            >
              {l}
            </button>
          ))}
        </nav>
        <form className="nsearch" onSubmit={submitSearch}>
          <Search size={16} aria-hidden />
          <input
            value={navQ}
            onChange={(e) => setNavQ(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('common.search')}
          />
        </form>
        <div className="nicons">
          <LanguageSwitcher />
          <button className="theme-sw" type="button" onClick={() => setTheme()} aria-label={t('nav.theme')}>
            <Sun size={13} />
            <Moon size={13} />
            <span className="knob">{dark ? <Moon size={13} /> : <Sun size={13} />}</span>
          </button>

          {isAuthenticated && (
            <button className="ic nav-ic-bell" type="button" onClick={goNotifications} aria-label={t('nav.notifications')} title={t('nav.notifications')}>
              <Bell size={18} className="bell" />
              {unread > 0 && <span className="dot bump">{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}

          {showDashboard && (
            <button className="ic nav-ic-dash" type="button" onClick={() => navigate(dashboardPath)} aria-label={t('nav.dashboard')} title={t('nav.dashboard')}>
              <LayoutDashboard size={18} />
            </button>
          )}

          {isAuthenticated && !showDashboard && (
            <button className="ic nav-ic-orders" type="button" onClick={() => navigate('/orders')} aria-label={t('nav.orders')} title={t('nav.orders')}>
              <Package size={18} />
            </button>
          )}

          <button
            className="ic"
            type="button"
            onClick={() => navigate(isAuthenticated ? '/favorites' : '/login')}
            aria-label={t('nav.favourites')}
          >
            <Heart size={18} />
          </button>

          <button className="ic" type="button" onClick={() => navigate('/cart')} aria-label={t('nav.cart')}>
            <ShoppingCart size={18} />
            {cart > 0 && <span className="dot bump">{cart}</span>}
          </button>

          {isAuthenticated ? (
            <>
              <div className="nav-user-chip" title={`${displayName}${role ? ` · ${role}` : ''}`}>
                <span className="nav-user-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    displayName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <span className="nav-user-meta">
                  <b>{displayName.split(' ')[0]}</b>
                  <small>{t('nav.signedIn', { role: role || '' })}</small>
                </span>
              </div>
              <button className="ic nav-logout" type="button" onClick={onLogout} aria-label={t('nav.logout')} title={t('nav.logout')}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="ic nav-user"
              type="button"
              onClick={() => navigate('/login')}
              aria-label={t('nav.login')}
              title={t('nav.login')}
            >
              <LogIn size={18} />
            </button>
          )}

          <button
            type="button"
            className={'nav-burger' + (menuOpen ? ' is-open' : '')}
            aria-expanded={menuOpen}
            aria-controls="ml-vine-menu"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="nav-burger-lines" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <Leaf className="nav-burger-leaf" size={14} aria-hidden />
          </button>
        </div>
      </div>

      {portalHost ? createPortal(vineMenu, portalHost) : null}
    </header>
  );
}
