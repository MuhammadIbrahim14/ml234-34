import { useState } from 'react';
import { navigate } from '../router';
import { useAuth } from '../context/AuthContext';
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
import { EmptyState, DemoModeNotice } from './ui/DataState';

const roles = {
  farmer: {
    title: 'Farmer Dashboard', name: 'Farmer', color: 'Farmer',
    items: [
      ['Overview', LayoutDashboard], ['My Products', Package], ['Add Product', Plus],
      ['Pre-Orders', ClipboardList], ['Markets', Store], ['Sales & Insights', BarChart3],
      ['Reviews', MessageSquare], ['Notifications', Bell], ['Profile', Users], ['Settings', Settings]
    ]
  },
  admin: {
    title: 'Admin Dashboard', name: 'MarketLink Admin', color: 'Admin',
    items: [
      ['Overview', LayoutDashboard], ['Farmers', Users], ['Customers', Users],
      ['Markets', Store], ['Products', Package], ['Orders', ShoppingBag],
      ['Moderation', ShieldCheck], ['Reports', BarChart3], ['Announcements', Megaphone],
      ['Settings', Settings]
    ]
  },
  manager: {
    title: 'Manager Dashboard', name: 'Market Manager', color: 'Manager',
    items: [
      ['Overview', LayoutDashboard], ['Markets', Store], ['Orders', ShoppingBag],
      ['Farmers', Users], ['Inventory', Package], ['Pickup Slots', CalendarDays],
      ['Reports', BarChart3], ['Announcements', Megaphone], ['Settings', Settings]
    ]
  }
};

const titles = {
  'Reviews': 'Ratings and customer feedback',
  'Profile': 'Profile management',
  'My Products': 'Manage weekly stock and pricing',
  'Add Product': 'Add a new product listing',
  'Pre-Orders': 'Incoming pre-orders',
  'Markets': 'Market locations and schedules',
  'Sales & Insights': 'Sales history and performance insights',
  'Farmers': 'Farmer accounts and approvals',
  'Customers': 'Customer accounts',
  'Orders': 'Platform orders',
  'Products': 'Platform product listings',
  'Moderation': 'Content moderation queue',
  'Reports': 'Reports and analytics',
  'Announcements': 'Platform announcements',
  'Inventory': 'Inventory overview',
  'Pickup Slots': 'Pickup time windows',
  'Notifications': 'Notifications',
  'Settings': 'Account and system settings',
};

function Placeholder({ title, message }) {
  return (
    <div className="dash-panel">
      <EmptyState title={title} message={message} />
    </div>
  );
}

function DashboardContent({ role, section }) {
  if (section === 'Overview' || !section) return <DashboardOverview role={role} />;

  if (role === 'farmer') {
    if (section === 'My Products') return <FarmerProducts mode="list" />;
    if (section === 'Add Product') return <FarmerProducts mode="add" />;
    if (section === 'Pre-Orders' || section === 'Sales & Insights') return <FarmerOrders />;
    if (section === 'Markets' || section === 'Profile') return <FarmerProfile />;
    if (section === 'Reviews') return <FarmerReviews />;
  }

  if (role === 'admin' || role === 'manager') {
    if (section === 'Markets') return <AdminMarkets />;
    if (section === 'Farmers') return <AdminFarmers />;
    if (section === 'Customers') return <AdminCustomers />;
    if (section === 'Products' || section === 'Inventory') return <AdminProducts />;
    if (section === 'Moderation') return <AdminProducts moderation />;
    if (section === 'Orders') return <AdminOrders />;
    if (section === 'Announcements') return <AdminAnnouncements />;
    if (section === 'Reports') return <AdminReports />;
  }

  return (
    <section className="dash-content-panel">
      <div className="page-head">
        <div>
          <span className="eyebrow">MarketLink</span>
          <h1>{titles[section] || section}</h1>
          <p>{titles[section] || 'Workspace section'}</p>
        </div>
        <button className="btn" type="button" onClick={() => navigate('/')}>Back Home</button>
      </div>
      <DemoModeNotice />
      <Placeholder
        title={section}
        message={
          section === 'Notifications'
            ? 'In-app notifications will appear here when wired to email/push.'
            : section === 'Settings'
              ? 'Account settings use your profile from Auth for now.'
              : section === 'Pickup Slots'
                ? 'Farmers manage pickup windows under Profile.'
                : 'This section has no extra records yet.'
        }
      />
    </section>
  );
}

export default function Dashboard({ role = 'farmer' }) {
  const { profile, signOut, isConfigured } = useAuth();
  const cfg = roles[role] || roles.farmer;
  const displayName = profile?.full_name || cfg.name;
  const pathPart = window.location.pathname.split('/').slice(3).join('/');
  const initialSection = pathPart
    ? (cfg.items.find(([label]) => label.toLowerCase().replaceAll(' ', '-') === pathPart)?.[0] || 'Overview')
    : 'Overview';
  const [section, setSection] = useState(initialSection);
  const [mobile, setMobile] = useState(false);

  const choose = (label) => {
    setSection(label);
    setMobile(false);
    navigate('/dashboard/' + role + '/' + label.toLowerCase().replaceAll(' ', '-'));
  };

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      <aside className={'dash-sidebar ' + (mobile ? 'mobile-open' : '')}>
        <div className="dash-brand">
          <div className="dash-leaf">⌁</div>
          <div>
            <b>MarketLink</b>
            <small>{cfg.color} Workspace</small>
          </div>
          <button className="dash-close" type="button" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="dash-profile">
          <div className="dash-avatar">{displayName.slice(0, 1)}</div>
          <div>
            <b>{displayName}</b>
            <small>
              {cfg.color}
              {!isConfigured ? ' · demo' : ''}
            </small>
          </div>
        </div>
        <nav className="dash-nav">
          {cfg.items.map(([label, I]) => (
            <button className={section === label ? 'active' : ''} key={label} type="button" onClick={() => choose(label)}>
              <I size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="dash-logout" type="button" onClick={logout}>
          <LogOut size={17} /> Sign out
        </button>
      </aside>
      <main className="dash-main">
        <header className="dash-top">
          <button className="mobile-menu" type="button" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div>
            <span className="eyebrow">{cfg.color} portal</span>
            <strong>{section}</strong>
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
