import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../router';
import { MapPin, ArrowRight, Recycle } from 'lucide-react';
import { IMG } from '../../data/data';
import { listLowStockProducts, productFarmerName } from '../../lib/api/products';
import Img from '../../components/Img';
import HeartBtn from '../../components/HeartBtn';
import { EmptyState, LoadingBlock } from '../ui/DataState';

export default function Surplus() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await listLowStockProducts({ threshold: 10, limit: 6 });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="wrap sec">
      <div className="surplus reveal">
        <div className="simg">
          <Img src={IMG.surplus} alt={t('hero.altBasket')} />
          <span className="sign" style={{ whiteSpace: 'pre-line' }}>
            {`${t('home.surplusSave')}\n${t('home.surplusReduce')}`}
          </span>
        </div>
        <div className="stxt">
          <span className="pill">{t('home.surplusPill')}</span>
          <h3 className="with-ic">
            <Recycle size={22} className="hic spin-slow" /> {t('home.surplusTitle')}
          </h3>
          <b className="sub">{t('home.surplusSub')}</b>
          <p className="muted">{t('home.surplusBody')}</p>
          <button type="button" onClick={() => navigate('/products')} className="btn shine">
            {t('home.surplusCta')} <ArrowRight size={15} />
          </button>
        </div>
        <div className="sgrid">
          {loading ? (
            <LoadingBlock label={t('common.loading')} />
          ) : !rows.length ? (
            <EmptyState title={t('home.surplusEmpty')} message={t('common.emptyMessage')} />
          ) : (
            rows.map((s) => (
              <div className="scard" key={s.product_id}>
                <div className="scimg">
                  <Img src={s.image_url || IMG.produceFallback} alt={s.name} />
                  <span className="stag">{t('home.surplusLowStock')}</span>
                  <HeartBtn productId={s.product_id} />
                </div>
                <div className="scbody">
                  <b>{s.name}</b>
                  <div>
                    <span className="price">
                      {t('common.rs')} {s.price}/{s.unit}
                    </span>{' '}
                    <span className="off">{t('home.surplusLeft', { count: s.stock_quantity })}</span>
                  </div>
                  <small>
                    <MapPin size={12} /> {productFarmerName(s)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
