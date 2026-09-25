import { useEffect, useState } from 'react';
import { navigate } from '../../router';
import { Leaf, Search, MapPin, ArrowRight, Users, LocateFixed, Clock } from 'lucide-react';
import { listMarkets } from '../../lib/api/markets';
import { IMG } from '../../data/data';
import Img from '../../components/Img';
import MarketsOsmMap from '../MarketsOsmMap';
import { EmptyState, LoadingBlock, DemoModeNotice } from '../ui/DataState';

export default function ExploreMap() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState('Markets');
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

  const filtered = rows.filter(
    (m) =>
      !q.trim() ||
      m.market_name.toLowerCase().includes(q.toLowerCase()) ||
      (m.address || '').toLowerCase().includes(q.toLowerCase())
  );
  const m = filtered[sel] || filtered[0];

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

        <div className="map osm-explore">
          <MarketsOsmMap
            markets={filtered}
            selectedId={m?.market_id ?? null}
            onSelect={(mk) => {
              const idx = filtered.findIndex((x) => x.market_id === mk.market_id);
              if (idx >= 0) setSel(idx);
            }}
            height={460}
          />
          {m && (
            <div className="osm-popup-card">
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
        </div>
      </div>
    </section>
  );
}
