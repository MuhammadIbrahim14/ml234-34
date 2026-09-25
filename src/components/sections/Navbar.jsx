import { Search, Sun, Moon, Heart, ShoppingCart, Bell, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import { navigate } from '../../router';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ setTheme, dark, cart }) {
  const { isAuthenticated, dashboardPath, signOut, profile } = useAuth();
  const showDashboard = isAuthenticated && dashboardPath.startsWith('/dashboard');
  const links = [
    ['Home', '/'],
    ['Markets', '/markets'],
    ['Farmers', '/farmers'],
    ['How It Works', '#how-it-works'],
    ['About', '/about'],
  ];

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <button className="nav-logo-btn" type="button" onClick={() => navigate('/')}>
          <Logo />
        </button>
        <nav className="links">
          {links.map(([l, p]) => (
            <button
              key={l}
              type="button"
              className={
                window.location.pathname === p || (l === 'How It Works' && window.location.pathname === '/')
                  ? 'on'
                  : ''
              }
              onClick={() =>
                p.startsWith('#')
                  ? document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                  : navigate(p)
              }
            >
              {l}
            </button>
          ))}
        </nav>
        <div className="nsearch">
          <Search size={16} />
          <input
            onKeyDown={(e) => e.key === 'Enter' && navigate('/products')}
            placeholder="Search markets, products, or farmers..."
          />
        </div>
        <div className="nicons">
          <button className="theme-sw" type="button" onClick={() => setTheme()} aria-label="Toggle theme">
            <Sun size={13} />
            <Moon size={13} />
            <span className="knob">{dark ? <Moon size={13} /> : <Sun size={13} />}</span>
          </button>
          {isAuthenticated ? (
            <>
              {showDashboard && (
                <button className="ic" type="button" onClick={() => navigate(dashboardPath)} aria-label="Dashboard" title={profile?.full_name || 'Dashboard'}>
                  <LayoutDashboard size={18} />
                </button>
              )}
              <button
                className="ic"
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <button className="ic" type="button" onClick={() => navigate('/login')} aria-label="Login">
                <LogIn size={18} />
              </button>
              <button className="ic" type="button" onClick={() => navigate('/register')} aria-label="Register">
                <UserPlus size={18} />
              </button>
            </>
          )}
          <button className="ic" type="button" onClick={() => navigate(isAuthenticated ? '/favorites' : '/login')} aria-label="Favourites">
            <Heart size={19} />
          </button>
          {isAuthenticated && !showDashboard && (
            <button className="ic" type="button" onClick={() => navigate('/orders')} aria-label="My orders" title="My orders">
              <Bell size={19} />
            </button>
          )}
          {showDashboard && (
            <button className="ic" type="button" onClick={() => navigate(`${dashboardPath}/notifications`)} aria-label="Notifications">
              <Bell size={19} />
            </button>
          )}
          <button className="ic" type="button" onClick={() => navigate('/cart')} aria-label="Cart">
            <ShoppingCart size={19} />
            <span className="dot bump">{cart}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
