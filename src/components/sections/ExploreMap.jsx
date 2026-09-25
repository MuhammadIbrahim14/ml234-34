import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../router';
import { Leaf, Search, MapPin, ArrowRight, Users, LocateFixed, Clock } from 'lucide-react';
import { listMarkets } from '../../lib/api/markets';
import { listApprovedFarmers, todayWeekdayKey } from '../../lib/api/farmers';
import { IMG } from '../../data/data';
import Img from '../../components/Img';
import MarketsOsmMap from '../MarketsOsmMap';
import { EmptyState, LoadingBlock, DemoModeNotice } from '../ui/DataState';
import { googleDirectionsUrl, osmDirectionsUrl, hasCoords } from '../../lib/api/geo';

export default function ExploreMap() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState('Markets');
  const [chips, setChips] = useState({ km: true, fv: true, open: false });
  const [q, setQ] = useState('');

  const tabs = [
    { id: 'Markets', label: t('nav.markets') },
    { id: 'Farmers', label: t('nav.farmers') },
    { id: 'Produce', label: t('nav.products') },
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [mRes, fRes] = await Promise.all([listMarkets({ activeOnly: true }), listApprovedFarmers({ limit: 80 })]);
      setRows(mRes.data || []);
      setFarmers(fRes.data || []);
      setSel(0);
      setLoading(false);
    })();
  }, []);

  const todayKey = todayWeekdayKey();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((m) => {
      const qOk =
        !needle ||
        m.market_name.toLowerCase().includes(needle) ||
        (m.address || '').toLowerCase().includes(needle);
      if (!qOk) return false;
      if (chips.open) {
        const days = Array.isArray(m.operating_days) ? m.operating_days : [];
        return days.includes(todayKey);
      }
      return true;
    });
  }, [rows, q, chips.open, todayKey]);

  useEffect(() => {
    setSel(0);
  }, [chips.open, q]);

  const m = filtered[sel] || filtered[0];
  const dirG = m && hasCoords(m.latitude, m.longitude) ? googleDirectionsUrl(m.latitude, m.longitude) : null;
  const dirO = m && hasCoords(m.latitude, m.longitude) ? osmDirectionsUrl(m.latitude, m.longitude) : null;

  return (
    <section className="wrap sec" id="explore-map">
      <div className="map-story reveal">
        <span className="eyebrow">{t('home.mapStory.eyebrow')}</span>
        <p>{t('home.mapStory.line')}</p>
      </div>
      <div className="explore reveal">
        <div className="ex-l">
          <span className="eyebrow">{t('home.exploreEyebrow')}</span>
          <h2>{t('home.exploreTitle')}</h2>
          <p className="muted">{t('home.exploreLead')}</p>
          <div className="tabs">
            {tabs.map((tabItem) => (
              <button key={tabItem.id} type="button" className={tab === tabItem.id ? 'on' : ''} onClick={() => setTab(tabItem.id)}>
                {tabItem.label}
              </button>
            ))}
          </div>
          <div className="insearch">
            <Search size={16} />
            <input placeholder={t('home.exploreSearch')} value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="sq" type="button" aria-label={t('common.search')}>
              <Search size={15} />
            </button>
          </div>
          <div className="chips">
            <button type="button" className={chips.km ? 'on' : ''} onClick={() => setChips({ ...chips, km: !chips.km })}>
              <LocateFixed size={13} /> {t('home.chipNear')}
            </button>
            <button type="button" className={chips.fv ? 'on' : ''} onClick={() => setChips({ ...chips, fv: !chips.fv })}>
              <Leaf size={13} /> {t('home.chipVeg')}
            </button>
            <button type="button" className={chips.open ? 'on' : ''} onClick={() => setChips({ ...chips, open: !chips.open })}>
              <Clock size={13} /> {t('home.chipOpen')}
            </button>
          </div>
          <DemoModeNotice />
          {loading ? (
            <LoadingBlock label={t('common.loading')} />
          ) : !filtered.length ? (
            <EmptyState title={t('common.emptyTitle')} message={t('home.exploreEmpty')} />
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
                      <MapPin size={12} /> {mk.address || t('home.addressTbd')}
                    </small>
                    <small>
                      <Users size={12} /> {(mk.operating_days || []).join(', ') || t('home.scheduleTbd')}
                    </small>
                  </div>
                  <button type="button" onClick={() => navigate('/markets')} className="btn sm">
                    {t('home.exploreBtn')} <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="map osm-explore">
          <MarketsOsmMap
            markets={filtered}
            farmers={farmers}
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
                  <MapPin size={12} /> {m.address || t('home.addressTbd')}
                </small>
                <small>
                  <Users size={12} /> {m.timings || (m.operating_days || []).join(', ') || t('home.scheduleTbd')}
                </small>
              </div>
              <div className="directions-links" style={{ marginBottom: 8 }}>
                {dirG && (
                  <a className="btn sm ghost" href={dirG} target="_blank" rel="noopener noreferrer">
                    {t('home.directions')}
                  </a>
                )}
                {dirO && (
                  <a className="btn sm ghost" href={dirO} target="_blank" rel="noopener noreferrer">
                    {t('pages.osmDirections')}
                  </a>
                )}
              </div>
              <button type="button" onClick={() => navigate('/markets')} className="btn wide shine">
                {t('home.exploreMarket')} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
