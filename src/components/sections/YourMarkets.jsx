import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listPreferredMarkets } from '../../lib/api/preferredMarkets';
import { navigate } from '../../router';
import { IMG } from '../../data/data';
import Img from '../Img';

/** Home shortcut: signed-in customer's preferred markets. */
export default function YourMarkets() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isConfigured, role, ROLES } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConfigured || !isAuthenticated || !user?.id) {
        setRows([]);
        return;
      }
      if (role && role !== ROLES.CUSTOMER) {
        setRows([]);
        return;
      }
      const { data } = await listPreferredMarkets(user.id);
      if (!cancelled) setRows(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isAuthenticated, isConfigured, role, ROLES]);

  if (!isAuthenticated || !rows.length) return null;

  return (
    <section className="wrap sec your-markets">
      <div className="reveal">
        <span className="eyebrow">{t('home.yourMarketsEyebrow')}</span>
        <h2>{t('home.yourMarketsTitle')}</h2>
        <p className="muted">{t('home.yourMarketsLead')}</p>
        <div className="catalog-grid" style={{ paddingBottom: 24 }}>
          {rows.slice(0, 3).map((row) => {
            const m = row.markets;
            if (!m) return null;
            return (
              <article className="catalog-card" key={row.id}>
                <div className="catalog-img">
                  <Img src={IMG.marketFallback} alt={m.market_name} />
                </div>
                <div className="catalog-body">
                  <h3>{m.market_name}</h3>
                  <p>
                    <MapPin size={14} /> {m.address || t('home.addressTbd')}
                  </p>
                  <small>{(m.operating_days || []).join(', ') || t('home.daysTbd')}</small>
                  <button className="btn sm" type="button" onClick={() => navigate('/products')}>
                    {t('home.browseProduce')} <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <button className="btn ghost" type="button" onClick={() => navigate('/favorites')}>
          {t('home.manageFavorites')}
        </button>
      </div>
    </section>
  );
}
