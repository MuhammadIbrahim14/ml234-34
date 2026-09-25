import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import useReveal from './hooks/useReveal';
import Navbar from './components/sections/Navbar';
import Hero from './components/sections/Hero';
import Ticker from './components/sections/Ticker';
import ExploreMap from './components/sections/ExploreMap';
import YourMarkets from './components/sections/YourMarkets';
import FreshPicks from './components/sections/FreshPicks';
import Farmers from './components/sections/Farmers';
import HowItWorks from './components/sections/HowItWorks';
import DashboardBand from './components/sections/DashboardBand';
import Surplus from './components/sections/Surplus';
import CallToAction from './components/sections/CallToAction';
import Footer from './components/sections/Footer';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import RoleGuard from './components/RoleGuard';
import SplashScreen from './components/SplashScreen';
import ThemeShed, { useThemeShed } from './components/ThemeShed';
import FaqChatbot from './components/FaqChatbot';
import JudgeTour from './components/JudgeTour';
import LandingMotion from './components/LandingMotion';
import RolePitchStrip from './components/sections/RolePitchStrip';
import {
  MarketsPage,
  ProductsPage,
  FarmersPage,
  AboutPage,
  ContactPage,
  CartPage,
  OrdersPage,
  FavoritesPage,
  NotificationsPage,
} from './components/SitePages';
import { getRoute } from './router';
import { useCart } from './context/CartContext';
import './styles/marketlink.css';

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('ml-theme') === 'dark');
  const { setTheme, fx: shedFx, shedding } = useThemeShed(setDark, dark);
  const { count: cart } = useCart();
  const [toast, setToast] = useState('');
  const [route, setRoute] = useState(getRoute());
  useReveal();
  useEffect(() => {
    const fn = () => setRoute(getRoute());
    window.addEventListener('popstate', fn);
    return () => window.removeEventListener('popstate', fn);
  }, []);
  useEffect(() => {
    localStorage.setItem('ml-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(window.__mlToast);
    window.__mlToast = setTimeout(() => setToast(''), 2800);
  };
  useEffect(() => {
    const onFlash = (e) => showToast(e.detail);
    window.addEventListener('ml-flash', onFlash);
    return () => window.removeEventListener('ml-flash', onFlash);
  }, []);
  const isDash = route.startsWith('/dashboard/');
  const dashRole = isDash ? route.split('/')[2] : null;
  const toastEl = (
    <div className={'toast' + (toast ? ' show' : '')} role="status">
      <Check size={16} /> {toast}
    </div>
  );
  const shell = (children) => (
    <div className={'ml' + (dark ? ' dark' : '') + (shedding ? ' theme-shedding' : '')}>
      <SplashScreen />
      <ThemeShed fx={shedFx} />
      {children}
      {toastEl}
    </div>
  );

  if (isDash) {
    return shell(
      <>
        <RoleGuard role={dashRole}>
          <Dashboard role={dashRole} />
        </RoleGuard>
        <div className="theme-floating">
          <button className="theme-sw" onClick={() => setTheme()} type="button">
            <span className="knob">{dark ? '☾' : '☀'}</span>
          </button>
        </div>
      </>
    );
  }
  if (route === '/login' || route === '/register') {
    return shell(
      <>
        <Auth mode={route.slice(1)} />
        <FaqChatbot />
      </>
    );
  }
  const pageMap = {
    '/markets': <MarketsPage />,
    '/products': <ProductsPage />,
    '/farmers': <FarmersPage />,
    '/about': <AboutPage />,
    '/contact': <ContactPage />,
    '/cart': <CartPage />,
    '/orders': <OrdersPage />,
    '/favorites': <FavoritesPage />,
    '/notifications': <NotificationsPage />,
  };
  const page = pageMap[route];
  return shell(
    <>
      <div className="aurora">
        <i />
        <i />
        <i />
      </div>
      <Navbar active={route} setTheme={setTheme} dark={dark} cart={cart} />
      {page ? (
        page
      ) : (
        <LandingMotion>
          <Hero />
          <Ticker />
          <ExploreMap />
          <YourMarkets />
          <FreshPicks onToast={showToast} />
          <Farmers />
          <HowItWorks />
          <RolePitchStrip />
          <DashboardBand />
          <Surplus />
          <CallToAction />
        </LandingMotion>
      )}
      <Footer dark={dark} setTheme={setTheme} />
      <JudgeTour />
      <FaqChatbot />
    </>
  );
}
