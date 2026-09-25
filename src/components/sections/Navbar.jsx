import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Sun, Moon, Heart, ShoppingCart, LayoutDashboard, Package, LogOut, LogIn, Bell } from 'lucide-react';
import { navigate } from '../../router';
import Logo from '../../components/Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { flashToast } from '../../lib/flashToast';
import { countUnreadNotifications } from '../../lib/api/notifications';

export default function Navbar({ setTheme, dark, cart }) {
  const { t } = useTranslation();
  const { isAuthenticated, dashboardPath, signOut, profile, role, loading, user, isConfigured } = useAuth();
  const showDashboard = isAuthenticated && dashboardPath.startsWith('/dashboard');
  const displayName = profile?.full_name || profile?.email || t('common.member');
  const [unread, setUnread] = useState(0);
  const [navQ, setNavQ] = useState('');
  const links = [
    [t('nav.home'), '/'],
    [t('nav.markets'), '/markets'],
    [t('nav.products'), '/products'],
    [t('nav.farmers'), '/farmers'],
    [t('nav.about'), '/about'],
  ];

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

  async function onLogout() {
    if (loading) return;
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
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  }

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <button className="nav-logo-btn" type="button" onClick={() => navigate('/')}>
          <Logo />
        </button>
        <nav className="links" aria-label={t('nav.primary')}>
          {links.map(([l, p]) => (
            <button
              key={p}
              type="button"
              className={window.location.pathname === p ? 'on' : ''}
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
            <button className="ic" type="button" onClick={goNotifications} aria-label={t('nav.notifications')} title={t('nav.notifications')}>
              <Bell size={18} className="bell" />
              {unread > 0 && <span className="dot bump">{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}

          {showDashboard && (
            <button className="ic" type="button" onClick={() => navigate(dashboardPath)} aria-label={t('nav.dashboard')} title={t('nav.dashboard')}>
              <LayoutDashboard size={18} />
            </button>
          )}

          {isAuthenticated && !showDashboard && (
            <button className="ic" type="button" onClick={() => navigate('/orders')} aria-label={t('nav.orders')} title={t('nav.orders')}>
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
        </div>
      </div>
    </header>
  );
}
