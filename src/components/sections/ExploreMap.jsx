import { useEffect, useState } from 'react';
import { navigate } from '../../router';
import { Leaf, Search, MapPin, ArrowRight, Users, Plus, Minus, LocateFixed, Clock } from 'lucide-react';
import { listMarkets, marketPinPosition } from '../../lib/api/markets';
import { DECOR_PINS, IMG } from '../../data/data';
import Img from '../../components/Img';
import { EmptyState, LoadingBlock, DemoModeNotice } from '../ui/DataState';

export default function ExploreMap() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState('Markets');
  const [view, setView] = useState('Map');
  const [chips, setChips] = useState({ km: true, fv: true, open: false });
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await listMarkets({ activeOnly: true });
      setRows(data || []);
      setSel(0);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((m) => !q.trim() || m.market_name.toLowerCase().includes(q.toLowerCase()) || (m.address || '').toLowerCase().includes(q.toLowerCase()));
  const m = filtered[sel] || filtered[0];
  const pins = filtered.map((mk, i) => ({ ...mk, ...marketPinPosition(mk, i, filtered.length) }));

  return (
    <section className="wrap sec">
      <div className="explore reveal">
        <div className="ex-l">
          <span className="eyebrow">Explore Nearby</span>
          <h2>
            Find Your Local Market,
            <br />
            <span className="script big">Reimagined.</span>
          </h2>
          <p className="muted">Find markets near you, explore available products, and connect with local farmers — all on an interactive map.</p>
          <div className="tabs">
            {['Markets', 'Farmers', 'Produce'].map((t) => (
              <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="insearch">
            <Search size={16} />
            <input placeholder="Search by city, area, or market name..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="sq" type="button" aria-label="Search">
              <Search size={15} />
            </button>
          </div>
          <div className="chips">
            <button type="button" className={chips.km ? 'on' : ''} onClick={() => setChips({ ...chips, km: !chips.km })}>
              <LocateFixed size={13} /> Within 10 km
            </button>
            <button type="button" className={chips.fv ? 'on' : ''} onClick={() => setChips({ ...chips, fv: !chips.fv })}>
              <Leaf size={13} /> Fruits & Veggies
            </button>
            <button type="button" className={chips.open ? 'on' : ''} onClick={() => setChips({ ...chips, open: !chips.open })}>
              <Clock size={13} /> Open Now
            </button>
          </div>
          <DemoModeNotice />
          {loading ? (
            <LoadingBlock label="Loading markets…" />
          ) : !filtered.length ? (
            <EmptyState title="No markets yet" message="Active markets will appear on the map when added." />
          ) : (
            <div className="mlist">
              {filtered.map((mk, i) => (
                <div key={mk.market_id} className={'mitem' + (sel === i ? ' sel' : '')} onClick={() => setSel(i)}>
                  <div className="mthumb">
                    <Img src={IMG.marketFallback} alt={mk.market_name} />
                  </div>
                  <div className="minfo">
                    <b>{mk.market_name}</b>
                    <small>
                      <MapPin size={12} /> {mk.address || 'Address TBD'}
                    </small>
                    <small>
                      <Users size={12} /> {(mk.operating_days || []).join(', ') || 'Schedule TBD'}
                    </small>
                  </div>
                  <button type="button" onClick={() => navigate('/markets')} className="btn sm">
                    Explore <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={'map' + (view === 'Satellite' ? ' sat' : '')}>
          <svg className="mapsvg" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice">
            <rect width="600" height="420" className="m-bg" />
            <ellipse cx="120" cy="90" rx="90" ry="50" className="m-park" />
            <ellipse cx="470" cy="330" rx="110" ry="60" className="m-park" />
            <ellipse cx="480" cy="110" rx="70" ry="40" className="m-park" />
            <path d="M-10 300 C100 260 180 330 280 290 C380 250 430 190 610 210" className="m-water" />
            <path d="M0 200 L600 170" className="m-road" />
            <path d="M300 0 L280 420" className="m-road" />
            <path d="M0 60 C200 110 400 40 600 90" className="m-road" />
            <path d="M60 420 L200 0" className="m-road2" />
            <path d="M420 0 L520 420" className="m-road2" />
            <path d="M0 360 L600 330" className="m-road2" />
            <path d="M150 140 L450 260" className="m-road2 flow" />
            <path d="M100 260 L560 40" className="m-road3" />
            <path d="M0 120 L600 250" className="m-road3" />
            <path d="M360 420 L600 280" className="m-road3" />
            <text x="300" y="215" className="m-label">
              Lahore
            </text>
            <text x="90" y="160" className="m-small">
              Model Town
            </text>
            <text x="440" y="150" className="m-small">
              Gulberg
            </text>
            <text x="170" y="370" className="m-small">
              Johar Town
            </text>
            <text x="480" y="290" className="m-small">
              DHA
            </text>
          </svg>

          {DECOR_PINS.map(([x, y], i) => (
            <MapPin key={i} className={'dpin' + (i % 4 === 0 ? ' alt' : '')} size={22} style={{ left: x + '%', top: y + '%', animationDelay: i * 0.08 + 's' }} />
          ))}

          {pins.map((mk, i) => (
            <button
              key={mk.market_id}
              type="button"
              className={'mpin' + (sel === i ? ' sel' : '')}
              style={{ left: mk.x + '%', top: mk.y + '%' }}
              onClick={() => setSel(i)}
              aria-label={mk.market_name}
            >
              <span className="pimg-in">
                <Img src={IMG.marketFallback} alt="" />
              </span>
            </button>
          ))}

          <div className="me" style={{ left: '48%', top: '56%' }} />

          {m && (
            <div key={m.market_id} className="popup" style={{ left: Math.min(Math.max(pins[sel]?.x || 50, 30), 70) + '%', top: (pins[sel]?.y || 40) + '%' }}>
              <div className="pthumb">
                <Img src={IMG.marketFallback} alt={m.market_name} />
              </div>
              <div className="pinfo">
                <b>{m.market_name}</b>
                <small>
                  <MapPin size={12} /> {m.address || 'Address TBD'}
                </small>
                <small>
                  <Users size={12} /> {m.timings || (m.operating_days || []).join(', ') || 'Schedule TBD'}
                </small>
              </div>
              <button type="button" onClick={() => navigate('/markets')} className="btn wide shine">
                Explore Market <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div className="mtoggle">
            {['Map', 'Satellite'].map((v) => (
              <button key={v} type="button" className={view === v ? 'on' : ''} onClick={() => setView(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className="zoom">
            <button type="button" aria-label="Zoom in">
              <Plus size={16} />
            </button>
            <button type="button" aria-label="Zoom out">
              <Minus size={16} />
            </button>
          </div>
          <button className="locate" type="button" aria-label="My location">
            <LocateFixed size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
