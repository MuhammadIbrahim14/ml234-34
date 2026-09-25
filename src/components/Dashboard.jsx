import { useState } from 'react';
import { navigate } from '../router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Store, Heart, Star, MapPin,
  Bell, Settings, BarChart3, ClipboardList, MessageSquare, LogOut, Menu,
  X, Search, Plus, Edit3, Trash2, CheckCircle2, Clock3, TrendingUp,
  ShieldCheck, Megaphone, FileText, CalendarDays
} from 'lucide-react';

const roles = {
  customer: {
    title: 'Customer Dashboard',
    name: 'Ayesha Khan',
    color: 'Customer',
    items: [
      ['Overview', LayoutDashboard], ['Browse Markets', Store], ['Products', Package],
      ['My Orders', ShoppingBag], ['Favorites', Heart], ['Reviews', Star],
      ['Notifications', Bell], ['Profile', Users], ['Settings', Settings]
    ]
  },
  farmer: {
    title: 'Farmer Dashboard', name: 'Ali Raza', color: 'Farmer',
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

const stats = {
  customer: [['Active Orders','3','Clock'],['Favorites','12','Heart'],['Completed','28','Check']],
  farmer: [['Total Orders','128','Shopping'],['Pending Orders','12','Clock'],['Revenue','Rs 48,200','Trend'],['Products','34','Package']],
  admin: [['Farmers','500','Users'],['Customers','10.2K','Users'],['Markets','50','Store'],['Orders','4,820','Shopping']],
  manager: [['Open Markets','12','Store'],['Pending Orders','86','Clock'],['Active Farmers','118','Users'],['Pickup Slots','42','Calendar']]
};

function IconStat({ kind }) {
  const M = {Clock:Clock3, Heart, Check:CheckCircle2, Shopping:ShoppingBag, Trend:TrendingUp, Package, Users, Store, Calendar:CalendarDays};
  const C = M[kind] || LayoutDashboard;
  return <C size={19}/>;
}

function DashboardContent({ role, section }) {
  const common = section === 'Overview' || !section;
  if (common) return <Overview role={role}/>;
  const titles = {
    'Browse Markets':'Discover nearby farmers markets', 'Products':'Fresh products catalog', 'My Orders':'Your pre-orders and pickup status',
    'Favorites':'Saved farmers and products', 'Reviews':'Ratings and customer feedback', 'Profile':'Profile management',
    'My Products':'Manage weekly stock and pricing', 'Add Product':'Add a new product listing', 'Pre-Orders':'Incoming pre-orders',
    'Markets':'Market locations and schedules', 'Sales & Insights':'Sales history and performance insights',
    'Farmers':'Farmer accounts and approvals', 'Customers':'Customer accounts', 'Orders':'Platform orders',
    'Moderation':'Content moderation queue', 'Reports':'Reports and analytics', 'Announcements':'Platform announcements',
    'Inventory':'Inventory overview', 'Pickup Slots':'Pickup time windows', 'Notifications':'Notifications', 'Settings':'Account and system settings'
  };
  return <section className="dash-content-panel"><div className="page-head"><div><span className="eyebrow">MarketLink</span><h1>{titles[section] || section}</h1><p>Frontend preview — every control is wired for navigation and interaction.</p></div><button className="btn" onClick={() => navigate('/')}>Back Home</button></div><div className="panel-grid"><ActionPanel title={section} role={role}/><TablePanel role={role}/></div></section>;
}

function Overview({role}) {
  const { profile } = useAuth();
  const cards = stats[role];
  const greetName = profile?.full_name || roles[role].name;
  return <>
    <section className="dash-hero"><div><span className="eyebrow">Good day, {greetName}</span><h1>Everything you need, in one place.</h1><p>Manage markets, fresh produce, orders and community activity with a smooth MarketLink workspace.</p></div><div className="dash-hero-art"><img src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=900&q=85" alt="Fresh vegetables on a farm table"/></div></section>
    <div className="dash-stats">{cards.map(([label,val,kind])=><div className="dash-stat" key={label}><span><IconStat kind={kind}/></span><small>{label}</small><strong>{val}</strong><em>Updated just now</em></div>)}</div>
    <div className="dash-lower"><section className="dash-panel"><div className="panel-title"><div><span className="eyebrow">Activity</span><h3>Recent activity</h3></div><button onClick={()=>navigate('/dashboard/'+role+'/orders')}>View all</button></div>{['Order #ML-2048 — Fresh Tomatoes','New farmer registration — Hassan Mehmood','Pickup slot confirmed — Saturday 10:30 AM','Review received — Green Valley Market'].map((x,i)=><div className="activity" key={x}><span className={'activity-dot d'+i}></span><div><b>{x}</b><small>{i+1} hour{i?'s':''} ago</small></div><Arrow /></div>)}</section><section className="dash-panel"><div className="panel-title"><div><span className="eyebrow">Quick actions</span><h3>What do you want to do?</h3></div></div><div className="quick-grid">{quick(role).map(q=><button key={q.t} onClick={()=>navigate(q.p)}><q.i size={20}/><b>{q.t}</b><small>{q.s}</small></button>)}</div></section></div>
  </>;
}
function Arrow(){return <span className="activity-arrow">›</span>}
function quick(role){ const map={customer:[['Browse Markets','Find fresh markets','/markets',Store],['Shop Products','Explore produce','/products',Package],['Track Orders','Check pickup status','/dashboard/customer/orders',ShoppingBag],['Favorites','View saved items','/dashboard/customer/favorites',Heart]],farmer:[['Add Product','List fresh stock','/dashboard/farmer/add-product',Plus],['Orders','Manage pre-orders','/dashboard/farmer/pre-orders',ClipboardList],['Insights','View performance','/dashboard/farmer/sales-insights',BarChart3],['Markets','Manage locations','/dashboard/farmer/markets',Store]],admin:[['Manage Farmers','Review accounts','/dashboard/admin/farmers',Users],['Manage Markets','Edit markets','/dashboard/admin/markets',Store],['Reports','Open analytics','/dashboard/admin/reports',BarChart3],['Announcements','Publish updates','/dashboard/admin/announcements',Megaphone]],manager:[['Orders','Review orders','/dashboard/manager/orders',ShoppingBag],['Inventory','Manage stock','/dashboard/manager/inventory',Package],['Pickup Slots','Set windows','/dashboard/manager/pickup-slots',CalendarDays],['Reports','Open analytics','/dashboard/manager/reports',BarChart3]]}; return map[role].map(([t,s,p,i])=>({t,s,p,i})); }
function ActionPanel({title,role}){return <div className="dash-panel action-panel"><div className="panel-title"><div><span className="eyebrow">Quick workspace</span><h3>{title}</h3></div></div><div className="form-grid"><label>Search<input placeholder="Search records..."/></label><label>Status<select><option>All</option><option>Active</option><option>Pending</option><option>Completed</option></select></label><label>Category<select><option>All categories</option><option>Vegetables</option><option>Fruits</option><option>Dairy</option></select></label><button className="btn" onClick={()=>alert('Frontend demo action completed.')}>Apply Filters</button></div><div className="empty-note"><CheckCircle2 size={22}/><div><b>{role === 'farmer' ? 'Stock is organized' : 'Workspace is ready'}</b><p>Use the controls above or the sidebar to explore this frontend module.</p></div></div></div>}
function TablePanel({role}){return <div className="dash-panel"><div className="panel-title"><div><span className="eyebrow">Live preview</span><h3>Recent records</h3></div><button onClick={()=>navigate('/dashboard/'+role+'/orders')}>View all</button></div><div className="mini-table"><div className="tr head"><span>Item</span><span>Status</span><span>Action</span></div>{['Fresh Vegetables Basket','Green Valley Market','Weekly Stock Update','Pickup Order #2048'].map((x,i)=><div className="tr" key={x}><span><b>{x}</b><small>MarketLink record</small></span><span className={'status s'+i%3}>{['Ready','Pending','Active'][i%3]}</span><button onClick={()=>alert(x+' opened')}>Open</button></div>)}</div></div>}

export default function Dashboard({role='customer'}) {
  const { profile, signOut, isConfigured } = useAuth();
  const cfg = roles[role] || roles.customer;
  const displayName = profile?.full_name || cfg.name;
  const pathPart = window.location.pathname.split('/').slice(3).join('/');
  const initialSection = pathPart ? (cfg.items.find(([label]) => label.toLowerCase().replaceAll(' ','-')===pathPart)?.[0] || 'Overview') : 'Overview';
  const [section,setSection] = useState(initialSection); const [mobile,setMobile]=useState(false);
  const choose=(label)=>{setSection(label);setMobile(false);navigate('/dashboard/'+role+'/'+label.toLowerCase().replaceAll(' ','-'));};
  const logout=async()=>{ await signOut(); navigate('/'); };
  return <div className="dashboard-shell">
    <aside className={'dash-sidebar '+(mobile?'mobile-open':'')}>
      <div className="dash-brand"><div className="dash-leaf">⌁</div><div><b>MarketLink</b><small>{cfg.color} Workspace</small></div><button className="dash-close" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="dash-profile"><div className="dash-avatar">{displayName.slice(0,1)}</div><div><b>{displayName}</b><small>{cfg.color}{!isConfigured?' · demo':''}</small></div></div>
      <nav className="dash-nav">{cfg.items.map(([label,I])=><button className={section===label?'active':''} key={label} onClick={()=>choose(label)}><I size={18}/><span>{label}</span>{label==='Notifications'&&<i>4</i>}</button>)}</nav>
      <button className="dash-logout" onClick={logout}><LogOut size={17}/> Sign out</button>
    </aside>
    <main className="dash-main"><header className="dash-top"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button><div><span className="eyebrow">{cfg.color} portal</span><strong>{section}</strong></div><div className="dash-actions"><button onClick={()=>choose('Notifications')}><Bell size={19}/><i>4</i></button><button onClick={()=>choose('Settings')}><Settings size={19}/></button></div></header><div className="dash-page"><DashboardContent role={role} section={section}/></div></main>
  </div>;
}
