import { useEffect, useState } from 'react';
import { Search, Sun, Moon, Heart, ShoppingCart, LayoutDashboard, Package, LogOut, LogIn, Bell } from 'lucide-react';
import { navigate } from '../../router';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { flashToast } from '../../lib/flashToast';
import { countUnreadNotifications } from '../../lib/api/notifications';

export default function Navbar({ setTheme, dark, cart }) {
  const { isAuthenticated, dashboardPath, signOut, profile, role, loading, user, isConfigured } = useAuth();
  const showDashboard = isAuthenticated && dashboardPath.startsWith('/dashboard');
  const displayName = profile?.full_name || profile?.email || 'Member';
  const [unread, setUnread] = useState(0);
  const [navQ, setNavQ] = useState('');
  const links = [
    ['Home', '/'],
    ['Markets', '/markets'],
    ['Products', '/products'],
    ['Farmers', '/farmers'],
    ['About', '/about'],
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
    const t = setInterval(async () => {
      if (!isConfigured || !isAuthenticated || !user?.id) return;
      const n = await countUnreadNotifications(user.id);
      if (!cancelled) setUnread(n);
    }, 45000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [isConfigured, isAuthenticated, user?.id]);

  async function onLogout() {
    if (loading) return;
    await signOut();
    flashToast('You are logged out. See you soon!');
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
        <nav className="links" aria-label="Primary">
          {links.map(([l, p]) => (
            <button
              key={l}
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
            placeholder="Search products, markets…"
            aria-label="Search"
          />
        </form>
        <div className="nicons">
          <button className="theme-sw" type="button" onClick={() => setTheme()} aria-label="Toggle theme">
            <Sun size={13} />
            <Moon size={13} />
            <span className="knob">{dark ? <Moon size={13} /> : <Sun size={13} />}</span>
          </button>

          {isAuthenticated && (
            <button className="ic" type="button" onClick={goNotifications} aria-label="Notifications" title="Notifications">
              <Bell size={18} className="bell" />
              {unread > 0 && <span className="dot bump">{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}

          {showDashboard && (
            <button className="ic" type="button" onClick={() => navigate(dashboardPath)} aria-label="Dashboard" title="Dashboard">
              <LayoutDashboard size={18} />
            </button>
          )}

          {isAuthenticated && !showDashboard && (
            <button className="ic" type="button" onClick={() => navigate('/orders')} aria-label="My orders" title="My orders">
              <Package size={18} />
            </button>
          )}

          <button
            className="ic"
            type="button"
            onClick={() => navigate(isAuthenticated ? '/favorites' : '/login')}
            aria-label="Favourites"
          >
            <Heart size={18} />
          </button>

          <button className="ic" type="button" onClick={() => navigate('/cart')} aria-label="Cart">
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
                  <small>Signed in{role ? ` · ${role}` : ''}</small>
                </span>
              </div>
              <button className="ic nav-logout" type="button" onClick={onLogout} aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="ic nav-user"
              type="button"
              onClick={() => navigate('/login')}
              aria-label="Log in"
              title="Log in"
            >
              <LogIn size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
