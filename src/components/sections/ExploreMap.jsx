import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../router';
import { Leaf, Search, MapPin, ArrowRight, Users, LocateFixed, Clock } from 'lucide-react';
import { listMarkets } from '../../lib/api/markets';
import { listApprovedFarmers, todayWeekdayKey } from '../../lib/api/farmers';
import { listProducts } from '../../lib/api/products';
import { IMG } from '../../data/data';
import Img from '../../components/Img';
import MarketsOsmMap from '../MarketsOsmMap';
import { EmptyState, LoadingBlock, DemoModeNotice } from '../ui/DataState';
import { googleDirectionsUrl, osmDirectionsUrl, hasCoords, distanceKm } from '../../lib/api/geo';

const PRODUCE_RE = /fruit|veg|vegetable|produce|green|sabzi|phal|berry|apple|mango|citrus/i;

function isProduceProduct(p) {
  const cat = p?.product_categories?.name || '';
  const name = p?.name || '';
  return PRODUCE_RE.test(cat) || PRODUCE_RE.test(name);
}

export default function ExploreMap() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [produceMarketIds, setProduceMarketIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);
  const [chips, setChips] = useState({ km: false, fv: false, open: false });
  const [q, setQ] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState(''); // '', asking, denied, error, ready
  const [locBusy, setLocBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [mRes, fRes, pRes] = await Promise.all([
        listMarkets({ activeOnly: true }),
        listApprovedFarmers({ limit: 80 }),
        listProducts({ availableOnly: true, limit: 200 }),
      ]);
      setRows(mRes.data || []);
      setFarmers(fRes.data || []);
      const ids = new Set();
      (pRes.data || []).forEach((p) => {
        if (p?.market_id && isProduceProduct(p)) ids.add(p.market_id);
      });
      setProduceMarketIds(ids);
      setSel(0);
      setLoading(false);
    })();
  }, []);

  const todayKey = todayWeekdayKey();

  function requestLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocStatus('error');
      setChips((c) => ({ ...c, km: false }));
      return;
    }
    setLocBusy(true);
    setLocStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocStatus('ready');
        setLocBusy(false);
        setChips((c) => ({ ...c, km: true }));
      },
      () => {
        setUserLoc(null);
        setLocStatus('denied');
        setLocBusy(false);
        setChips((c) => ({ ...c, km: false }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  function toggleKm() {
    if (chips.km) {
      setChips((c) => ({ ...c, km: false }));
      setLocStatus('');
      return;
    }
    if (userLoc) {
      setChips((c) => ({ ...c, km: true }));
      setLocStatus('ready');
      return;
    }
    requestLocation();
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows.filter((m) => {
      const qOk =
        !needle ||
        (m.market_name || '').toLowerCase().includes(needle) ||
        (m.address || '').toLowerCase().includes(needle);
      if (!qOk) return false;

      if (chips.open) {
        const days = Array.isArray(m.operating_days) ? m.operating_days : [];
        if (!days.includes(todayKey)) return false;
      }

      if (chips.fv && !produceMarketIds.has(m.market_id)) return false;

      return true;
    });

    if (chips.km && userLoc) {
      list = list
        .map((m) => {
          const d = distanceKm(userLoc.latitude, userLoc.longitude, m.latitude, m.longitude);
          return { ...m, _km: d };
        })
        .filter((m) => m._km != null && m._km <= 10)
        .sort((a, b) => a._km - b._km);
    } else if (userLoc) {
      list = list.map((m) => {
        const d = distanceKm(userLoc.latitude, userLoc.longitude, m.latitude, m.longitude);
        return { ...m, _km: d };
      });
    }

    return list;
  }, [rows, q, chips.open, chips.fv, chips.km, todayKey, produceMarketIds, userLoc]);

  useEffect(() => {
    setSel(0);
  }, [chips.open, chips.fv, chips.km, q, userLoc]);

  const m = filtered[sel] || filtered[0];
  const dirG = m && hasCoords(m.latitude, m.longitude) ? googleDirectionsUrl(m.latitude, m.longitude) : null;
  const dirO = m && hasCoords(m.latitude, m.longitude) ? osmDirectionsUrl(m.latitude, m.longitude) : null;

  const emptyMsg =
    chips.km && locStatus === 'ready' && !filtered.length
      ? t('home.locNone')
      : chips.km && (locStatus === 'denied' || locStatus === 'error')
        ? t('home.locDenied')
        : t('home.exploreEmpty');

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
            <span className="explore-tab-static on">{t('nav.markets')}</span>
          </div>
          <form
            className="insearch"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Search size={16} aria-hidden />
            <input
              placeholder={t('home.exploreSearch')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('home.exploreSearch')}
            />
            <button className="sq" type="submit" aria-label={t('common.search')}>
              <Search size={15} />
            </button>
          </form>
          <div className="chips">
            <button
              type="button"
              className={chips.km ? 'on' : ''}
              disabled={locBusy}
              onClick={toggleKm}
            >
              <LocateFixed size={13} /> {locBusy ? t('home.locAsking') : t('home.chipNear')}
            </button>
            <button
              type="button"
              className={chips.fv ? 'on' : ''}
              onClick={() => setChips((c) => ({ ...c, fv: !c.fv }))}
            >
              <Leaf size={13} /> {t('home.chipVeg')}
            </button>
            <button
              type="button"
              className={chips.open ? 'on' : ''}
              onClick={() => setChips((c) => ({ ...c, open: !c.open }))}
            >
              <Clock size={13} /> {t('home.chipOpen')}
            </button>
          </div>
          {locStatus === 'asking' && <p className="muted explore-loc-hint">{t('home.locAsking')}</p>}
          {locStatus === 'denied' && <p className="muted explore-loc-hint">{t('home.locDenied')}</p>}
          {chips.km && locStatus === 'ready' && (
            <p className="muted explore-loc-hint">{t('home.locReady', { count: filtered.length })}</p>
          )}
          <DemoModeNotice />
          {loading ? (
            <LoadingBlock label={t('common.loading')} />
          ) : !filtered.length ? (
            <EmptyState title={t('common.emptyTitle')} message={emptyMsg} />
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
                    {mk._km != null && Number.isFinite(mk._km) && (
                      <small className="explore-km">
                        <LocateFixed size={12} /> {t('home.kmAway', { km: mk._km.toFixed(1) })}
                      </small>
                    )}
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); navigate('/markets'); }} className="btn sm">
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
              <div className="osm-popup-top">
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
                  {m._km != null && Number.isFinite(m._km) && (
                    <small className="explore-km">
                      <LocateFixed size={12} /> {t('home.kmAway', { km: m._km.toFixed(1) })}
                    </small>
                  )}
                </div>
              </div>
              <div className="directions-links osm-popup-actions">
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
              <button type="button" onClick={() => navigate('/markets')} className="btn wide shine osm-popup-cta">
                {t('home.exploreMarket')} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
