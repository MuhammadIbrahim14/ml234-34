import { useEffect, useState } from 'react';
import { navigate } from '../../router';
import { Sprout, ArrowRight, LayoutDashboard, Store, Users, MapPin, Leaf } from 'lucide-react';
import { IMG } from '../../data/data';
import { getDashboardCounts } from '../../lib/api/admin';
import Img from '../../components/Img';
import CountUp from '../../components/CountUp';

export default function DashboardBand() {
  const [stats, setStats] = useState([
    { icon: Store, n: 0, s: '', l: 'Happy Farmers' },
    { icon: Users, n: 0, s: '', l: 'Active Buyers' },
    { icon: MapPin, n: 0, s: '', l: 'Markets' },
    { icon: Leaf, n: 100, s: '%', l: 'Fresh & Natural' },
  ]);
  const [preview, setPreview] = useState({ orders: 0, pending: 0, products: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await getDashboardCounts();
      if (!data) return;
      setStats([
        { icon: Store, n: data.farmers || 0, s: '', l: 'Registered Farmers' },
        { icon: Users, n: data.customers || 0, s: '', l: 'Active Buyers' },
        { icon: MapPin, n: data.markets || 0, s: '', l: 'Markets' },
        { icon: Leaf, n: 100, s: '%', l: 'Fresh & Natural' },
      ]);
      setPreview({
        orders: data.orders || 0,
        pending: 0,
        products: data.products || 0,
      });
    })();
  }, []);

  return (
    <section className="band">
      <div className="wrap band-in reveal">
        <div className="band-crate">
          <Img src={IMG.crate} alt="Vegetables crate" />
        </div>
        <div className="dash-txt">
          <h3>
            <LayoutDashboard size={22} /> Farmer Dashboard Preview
          </h3>
          <p>Manage your produce, track orders, and connect with local buyers — all in one place.</p>
          <button type="button" onClick={() => navigate('/register')} className="btn lime shine">
            Start Selling <ArrowRight size={15} />
          </button>
        </div>
        <div className="laptop">
          <div className="screen">
            <aside>
              {Array.from({ length: 7 }).map((_, i) => (
                <i key={i} className={i === 1 ? 'on' : ''} />
              ))}
            </aside>
            <div className="dash">
              <div className="dtop">
                <span>Welcome back</span>
                <em>Live</em>
              </div>
              <div className="dstats">
                <div>
                  <small>Total Orders</small>
                  <b>{preview.orders}</b>
                </div>
                <div>
                  <small>Products</small>
                  <b>{preview.products}</b>
                </div>
                <div>
                  <small>Markets</small>
                  <b>{stats[2]?.n || 0}</b>
                </div>
              </div>
              <svg className="chart" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#4ade80" stopOpacity=".45" />
                    <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon className="area" points="0,60 0,50 20,40 40,44 60,28 80,34 100,20 120,30 140,14 160,22 180,8 200,16 200,60" />
                <polyline points="0,50 20,40 40,44 60,28 80,34 100,20 120,30 140,14 160,22 180,8 200,16" />
              </svg>
            </div>
          </div>
          <div className="base" />
        </div>
        <div className="grow">
          <h3>
            <Sprout size={22} /> Grow Your Business.
            <br />
            Not Your Workload.
          </h3>
          <div className="stats">
            {stats.map((s) => (
              <div className="stat" key={s.l}>
                <div className="stic">
                  <s.icon size={20} />
                </div>
                <CountUp to={s.n} suffix={s.s} />
                <small>{s.l}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
