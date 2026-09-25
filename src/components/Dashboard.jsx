import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../router';
import { useAuth } from '../context/AuthContext';
import { flashToast } from '../lib/flashToast';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Store, MessageSquare,
  Bell, Settings, BarChart3, ClipboardList, LogOut, Menu,
  X, Plus, ShieldCheck, Megaphone, CalendarDays
} from 'lucide-react';
import DashboardOverview from './dashboard/DashboardOverview';
import FarmerProducts from './dashboard/FarmerProducts';
import FarmerOrders from './dashboard/FarmerOrders';
import FarmerProfile from './dashboard/FarmerProfile';
import FarmerReviews from './dashboard/FarmerReviews';
import AdminMarkets from './dashboard/AdminMarkets';
import AdminFarmers from './dashboard/AdminFarmers';
import AdminCustomers from './dashboard/AdminCustomers';
import AdminProducts from './dashboard/AdminProducts';
import AdminOrders from './dashboard/AdminOrders';
import AdminAnnouncements from './dashboard/AdminAnnouncements';
import AdminReports from './dashboard/AdminReports';
import AdminReviews from './dashboard/AdminReviews';
import NotificationsPanel from './dashboard/NotificationsPanel';
import ProfileSettings from './dashboard/ProfileSettings';
import AdminContactMessages from './dashboard/AdminContactMessages';
import AdminPickupSlots from './dashboard/AdminPickupSlots';
import { EmptyState, DemoModeNotice } from './ui/DataState';
import LanguageSwitcher from './LanguageSwitcher';

/** English section ids (stable for paths / routing) → dash.nav* keys */
const NAV_LABEL_KEY = {
  Overview: 'navOverview',
  'My Products': 'navProducts',
  'Add Product': 'navAddProduct',
  'Pre-Orders': 'navPreOrders',
  'Sales & Insights': 'navInsights',
  Reviews: 'navReviews',
  Profile: 'navProfile',
  Notifications: 'navNotifications',
  Settings: 'navSettings',
  Markets: 'navMarkets',
  Farmers: 'navFarmers',
  Customers: 'navCustomers',
  Products: 'navCatalog',
  Inventory: 'navInventory',
  Orders: 'navOrders',
  Moderation: 'navModeration',
  Announcements: 'navAnnouncements',
  Reports: 'navReports',
  'Pickup Slots': 'navSlots',
};

const roles = {
  farmer: {
    roleKey: 'farmerRole',
    workspaceKey: 'farmerWorkspace',
    nameKey: 'farmerRole',
    items: [
      ['Overview', LayoutDashboard], ['My Products', Package], ['Add Product', Plus],
      ['Pre-Orders', ClipboardList], ['Markets', Store], ['Sales & Insights', BarChart3],
      ['Reviews', MessageSquare], ['Notifications', Bell], ['Profile', Users], ['Settings', Settings]
    ]
  },
  admin: {
    roleKey: 'adminRole',
    workspaceKey: 'adminWorkspace',
    nameKey: 'adminName',
    items: [
      ['Overview', LayoutDashboard], ['Farmers', Users], ['Customers', Users],
      ['Markets', Store], ['Products', Package], ['Orders', ShoppingBag],
      ['Moderation', ShieldCheck], ['Reviews', MessageSquare], ['Reports', BarChart3],
      ['Announcements', Megaphone], ['Notifications', Bell], ['Settings', Settings]
    ]
  },
  manager: {
    roleKey: 'managerRole',
    workspaceKey: 'managerWorkspace',
    nameKey: 'managerName',
    items: [
      ['Overview', LayoutDashboard], ['Markets', Store], ['Orders', ShoppingBag],
      ['Farmers', Users], ['Inventory', Package], ['Pickup Slots', CalendarDays],
      ['Reports', BarChart3], ['Announcements', Megaphone], ['Notifications', Bell], ['Settings', Settings]
    ]
  }
};

function navLabel(t, label) {
  const key = NAV_LABEL_KEY[label];
  return key ? t(`dash.${key}`) : label;
}

function Placeholder({ title, message }) {
  return (
    <div className="dash-panel">
      <EmptyState title={title} message={message} />
    </div>
  );
}

function DashboardContent({ role, section }) {
  const { t } = useTranslation();

  if (section === 'Overview' || !section) return <DashboardOverview role={role} />;

  if (section === 'Notifications') return <NotificationsPanel />;
  if (section === 'Settings') {
    return (
      <div className="panel-grid">
        <ProfileSettings />
        {role === 'admin' && <AdminContactMessages />}
        {role === 'farmer' && (
          <div className="dash-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">{t('dash.farmer.stallSettingsEyebrow')}</span>
                <h3>{t('dash.farmer.stallProfile')}</h3>
              </div>
            </div>
            <p className="muted">{t('dash.farmer.stallSettingsHint')}</p>
            <button className="btn sm" type="button" onClick={() => navigate('/dashboard/farmer/profile')}>
              {t('dash.farmer.openStallProfile')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (role === 'farmer') {
    if (section === 'My Products') return <FarmerProducts mode="list" />;
    if (section === 'Add Product') return <FarmerProducts mode="add" />;
    if (section === 'Pre-Orders') return <FarmerOrders focus="orders" />;
    if (section === 'Sales & Insights') return <FarmerOrders focus="insights" />;
    if (section === 'Markets' || section === 'Profile') return <FarmerProfile />;
    if (section === 'Reviews') return <FarmerReviews />;
  }

  if (role === 'admin' || role === 'manager') {
    if (section === 'Markets') return <AdminMarkets />;
    if (section === 'Farmers') return <AdminFarmers />;
    if (section === 'Customers') return <AdminCustomers />;
    if (section === 'Products' || section === 'Inventory') return <AdminProducts />;
    if (section === 'Moderation') {
      return (
        <div className="panel-grid">
          <AdminProducts moderation />
          {role === 'admin' && <AdminReviews />}
          {role === 'admin' && <AdminContactMessages />}
        </div>
      );
    }
    if (section === 'Reviews' && role === 'admin') return <AdminReviews />;
    if (section === 'Orders') return <AdminOrders />;
    if (section === 'Announcements') return <AdminAnnouncements />;
    if (section === 'Reports') return <AdminReports />;
    if (section === 'Pickup Slots') return <AdminPickupSlots />;
  }

  return (
    <section className="dash-content-panel">
      <div className="page-head">
        <div>
          <span className="eyebrow">MarketLink</span>
          <h1>{navLabel(t, section) || section}</h1>
          <p>{t('dash.sectionFallback')}</p>
        </div>
        <button className="btn" type="button" onClick={() => navigate('/')}>{t('dash.backHome')}</button>
      </div>
      <DemoModeNotice />
      <Placeholder title={navLabel(t, section) || section} message={t('dash.placeholderEmpty')} />
    </section>
  );
}

export default function Dashboard({ role = 'farmer' }) {
  const { t } = useTranslation();
  const { profile, signOut, isConfigured } = useAuth();
  const cfg = roles[role] || roles.farmer;
  const displayName = profile?.full_name || t(`dash.${cfg.nameKey}`);
  const pathPart = window.location.pathname.split('/').slice(3).join('/');
  const initialSection = pathPart
    ? (cfg.items.find(([label]) => label.toLowerCase().replaceAll(' ', '-') === pathPart)?.[0] || 'Overview')
    : 'Overview';
  const [section, setSection] = useState(initialSection);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const sync = () => {
      const part = window.location.pathname.split('/').slice(3).join('/');
      const label = part
        ? (cfg.items.find(([l]) => l.toLowerCase().replaceAll(' ', '-') === part)?.[0] || 'Overview')
        : 'Overview';
      setSection(label);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [cfg.items]);

  const choose = (label) => {
    setSection(label);
    setMobile(false);
    navigate('/dashboard/' + role + '/' + label.toLowerCase().replaceAll(' ', '-'));
  };

  const logout = async () => {
    await signOut();
    flashToast(t('nav.logoutToast'));
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      <aside className={'dash-sidebar ' + (mobile ? 'mobile-open' : '')}>
        <div className="dash-brand">
          <div className="dash-leaf">⌁</div>
          <div>
            <b>MarketLink</b>
            <small>{t(`dash.${cfg.workspaceKey}`)}</small>
          </div>
          <button className="dash-close" type="button" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="dash-profile">
          <div className="dash-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              displayName.slice(0, 1)
            )}
          </div>
          <div>
            <b>{displayName}</b>
            <small>
              {t(`dash.${cfg.roleKey}`)}
              {!isConfigured ? ` · ${t('dash.demo')}` : ''}
            </small>
          </div>
        </div>
        <div style={{ padding: '0 8px 12px' }}>
          <LanguageSwitcher />
        </div>
        <nav className="dash-nav">
          {cfg.items.map(([label, I]) => (
            <button className={section === label ? 'active' : ''} key={label} type="button" onClick={() => choose(label)}>
              <I size={18} />
              <span>{navLabel(t, label)}</span>
            </button>
          ))}
        </nav>
        <button className="dash-logout" type="button" onClick={() => navigate('/')}>
          {t('dash.backHome')}
        </button>
        <button className="dash-logout" type="button" onClick={logout}>
          <LogOut size={17} /> {t('dash.signOut')}
        </button>
      </aside>
      <main className="dash-main">
        <header className="dash-top">
          <button className="mobile-menu" type="button" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div>
            <span className="eyebrow">{t(`dash.${cfg.roleKey}`)} {t('dash.portal')}</span>
            <strong>{navLabel(t, section)}</strong>
          </div>
          <div className="dash-actions">
            <button type="button" onClick={() => choose('Notifications')}>
              <Bell size={19} />
            </button>
            <button type="button" onClick={() => choose('Settings')}>
              <Settings size={19} />
            </button>
          </div>
        </header>
        <div className="dash-page">
          <DashboardContent role={role} section={section} />
        </div>
      </main>
    </div>
  );
}
