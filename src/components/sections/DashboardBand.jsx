import { navigate } from "../../router";
import { Sprout, ArrowRight, LayoutDashboard } from "lucide-react";
import { IMG, STATS } from "../../data/data";
import Img from "../../components/Img";
import CountUp from "../../components/CountUp";

export default function DashboardBand() {
  return (
      <section className="band">
        <div className="wrap band-in reveal">
          <div className="band-crate"><Img src={IMG.crate} alt="Vegetables crate" /></div>
          <div className="dash-txt">
            <h3><LayoutDashboard size={22} /> Farmer Dashboard Preview</h3>
            <p>Manage your produce, track orders, and connect with local buyers — all in one place.</p>
            <button onClick={() => navigate("/register")} className="btn lime shine">Start Selling <ArrowRight size={15} /></button>
          </div>
          <div className="laptop">
            <div className="screen">
              <aside>{Array.from({ length: 7 }).map((_, i) => <i key={i} className={i === 1 ? "on" : ""} />)}</aside>
              <div className="dash">
                <div className="dtop"><span>Welcome back, Ali 👋</span><em>Today</em></div>
                <div className="dstats">
                  <div><small>Total Orders</small><b>128</b></div>
                  <div><small>Pending</small><b>12</b></div>
                  <div><small>Revenue</small><b>Rs 48k</b></div>
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
            <h3><Sprout size={22} /> Grow Your Business.<br />Not Your Workload.</h3>
            <div className="stats">
              {STATS.map((s) => (
                <div className="stat" key={s.l}>
                  <div className="stic"><s.icon size={20} /></div>
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
