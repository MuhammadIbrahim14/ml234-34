import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../router';
import { Leaf, MapPin, Truck, Sprout, ArrowRight, ShoppingBasket, CloudSun, CloudRain, Sun, CloudFog, Cloud, LocateFixed } from 'lucide-react';
import { listMarkets } from '../../lib/api/markets';
import { distanceKm, hasCoords, googleDirectionsUrl } from '../../lib/api/geo';
import { fetchCurrentWeather, reversePlaceLabel } from '../../lib/api/weather';
import Img from '../../components/Img';

function WeatherIcon({ kind, size = 36 }) {
  if (kind === 'rain' || kind === 'showers' || kind === 'drizzle' || kind === 'storm') {
    return <CloudRain size={size} />;
  }
  if (kind === 'fog') return <CloudFog size={size} />;
  if (kind === 'clear' || kind === 'mainlyClear') return <Sun size={size} />;
  if (kind === 'partlyCloudy' || kind === 'overcast') return <CloudSun size={size} />;
  return <Cloud size={size} />;
}

export default function Hero() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState(null);
  const [place, setPlace] = useState('');
  const [weather, setWeather] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | locating | ready | denied | error
  const [busy, setBusy] = useState(false);

  function goSearch(e) {
    if (e) e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
  }

  async function loadVisitPanel(coords) {
    const { latitude, longitude } = coords;
    setLoc(coords);

    const [wRes, mRes, label] = await Promise.all([
      fetchCurrentWeather(latitude, longitude),
      listMarkets({ activeOnly: true, limit: 100 }),
      reversePlaceLabel(latitude, longitude),
    ]);

    if (wRes.data) setWeather(wRes.data);
    if (label) setPlace(label);

    const markets = (mRes.data || [])
      .map((m) => {
        const km = distanceKm(latitude, longitude, m.latitude, m.longitude);
        return km == null ? null : { ...m, _km: km };
      })
      .filter(Boolean)
      .sort((a, b) => a._km - b._km);

    setNearest(markets[0] || null);
    setStatus(wRes.error && !markets.length ? 'error' : 'ready');
  }

  function requestLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      return;
    }
    setBusy(true);
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await loadVisitPanel({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        } catch {
          setStatus('error');
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  }

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once for hero panel
  }, []);

  const perks = [
    { i: Sprout, title: t('hero.perkFarmers'), sub: t('hero.perkFarmersSub') },
    { i: ShoppingBasket, title: t('hero.perkProduce'), sub: t('hero.perkProduceSub') },
    { i: Truck, title: t('hero.perkPickup'), sub: t('hero.perkPickupSub') },
  ];

  const tipKey = weather?.tipKind ? `hero.weatherTip.${weather.tipKind}` : 'hero.weatherTip.ok';
  const condKey = weather?.kind ? `hero.weatherCond.${weather.kind}` : 'hero.weatherCond.unknown';
  const dirG =
    nearest && hasCoords(nearest.latitude, nearest.longitude)
      ? googleDirectionsUrl(nearest.latitude, nearest.longitude)
      : null;

  return (
    <section className="hero">
      <div className="hero-bg" data-parallax-speed="0.35">
        <Img
          className="hero-bg-layer hero-bg-day"
          src="/images/LandingBackground.jpg"
          alt={t('hero.altField')}
        />
        <Img
          className="hero-bg-layer hero-bg-night"
          src="/images/NightBackground.png"
          alt={t('hero.altFieldNight')}
        />
      </div>
      {[18, 52, 78].map((l, i) => (
        <Leaf
          key={i}
          className="fall"
          size={16 + (i % 2) * 6}
          style={{ left: l + '%', animationDelay: i * 3.2 + 's', animationDuration: 14 + i * 3 + 's' }}
        />
      ))}
      <div className="wrap hero-in">
        <div className="hero-l" data-parallax-speed="0.06">
          <span className="script tag rise" style={{ '--d': '0s' }}>
            {t('hero.tag')}
          </span>
          <h1 className="hero-h">
            <span className="rise" style={{ '--d': '.1s' }}>
              {t('hero.line1')}
            </span>
            <span className="rise" style={{ '--d': '.22s' }}>
              <em className="brush">{t('hero.line2Farm')}</em> <Leaf className="h1leaf" size={34} />
            </span>
            <span className="rise" style={{ '--d': '.34s' }}>
              {t('hero.line3a')} <em className="you">{t('hero.line3You')}</em>
            </span>
          </h1>
          <p className="lead rise" style={{ '--d': '.46s' }}>
            {t('hero.lead')}
          </p>
          <form className="bigsearch rise" style={{ '--d': '.58s' }} onSubmit={goSearch}>
            <MapPin size={18} />
            <input
              placeholder={t('hero.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('hero.searchAria')}
            />
            <button type="submit" className="circle shine" aria-label={t('common.search')}>
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="feats rise" style={{ '--d': '.7s' }}>
            {perks.map((f) => (
              <div className="feat" key={f.title}>
                <div className="fic">
                  <f.i size={20} />
                </div>
                <div>
                  <b>{f.title}</b>
                  <small>{f.sub}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-r" data-parallax-speed="-0.1">
          <div className="hero-visit pop" style={{ '--d': '.15s' }}>
            <div className="hero-visit-glow" aria-hidden="true" />
            <header className="hero-visit-head">
              <span className="eyebrow">{t('hero.visitEyebrow')}</span>
              <h3>{t('hero.visitTitle')}</h3>
            </header>

            <div className="hero-weather">
              <div className="hero-weather-ic" aria-hidden="true">
                <WeatherIcon kind={weather?.kind} />
              </div>
              <div className="hero-weather-meta">
                {status === 'locating' || busy ? (
                  <b>{t('hero.locating')}</b>
                ) : weather ? (
                  <>
                    <b>
                      {Math.round(weather.temperature)}°
                      <small>{t(condKey)}</small>
                    </b>
                    <span>
                      {place || t('hero.nearYou')}
                      {weather.humidity != null && Number.isFinite(weather.humidity)
                        ? ` · ${t('hero.humidity', { n: Math.round(weather.humidity) })}`
                        : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <b>{t('hero.weatherFallback')}</b>
                    <span>{t('hero.weatherFallbackSub')}</span>
                  </>
                )}
              </div>
            </div>

            {status !== 'locating' && (
              <p className="hero-weather-tip">
                {weather ? t(tipKey) : t('hero.weatherFallbackSub')}
              </p>
            )}

            <div className="hero-nearest">
              <div className="hero-nearest-label">
                <MapPin size={14} />
                <span>{t('hero.nearestLabel')}</span>
              </div>
              {nearest ? (
                <>
                  <b className="hero-nearest-name">{nearest.market_name}</b>
                  <small>
                    {nearest._km != null
                      ? t('hero.kmAway', { km: nearest._km.toFixed(1) })
                      : nearest.address || t('home.addressTbd')}
                  </small>
                  {nearest.address && nearest._km != null && (
                    <small className="hero-nearest-addr">{nearest.address}</small>
                  )}
                </>
              ) : status === 'denied' ? (
                <p className="muted">{t('hero.locDenied')}</p>
              ) : status === 'locating' ? (
                <p className="muted">{t('hero.locating')}</p>
              ) : (
                <p className="muted">{t('hero.noNearest')}</p>
              )}
            </div>

            <div className="hero-visit-actions">
              {(status === 'denied' || status === 'error' || (!loc && status !== 'locating')) && (
                <button type="button" className="btn sm" disabled={busy} onClick={requestLocation}>
                  <LocateFixed size={14} /> {t('hero.useLocation')}
                </button>
              )}
              {dirG && (
                <a className="btn sm ghost" href={dirG} target="_blank" rel="noopener noreferrer">
                  {t('home.directions')}
                </a>
              )}
              <button type="button" className="btn sm" onClick={() => navigate('/markets')}>
                {t('hero.exploreMarkets')} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
