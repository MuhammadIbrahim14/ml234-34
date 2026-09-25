import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../router';
import { Leaf, ShoppingCart, MapPin, ArrowRight, Users } from 'lucide-react';
import { listProducts, productFarmerName } from '../../lib/api/products';
import { IMG } from '../../data/data';
import Img from '../../components/Img';
import HeartBtn from '../../components/HeartBtn';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, LoadingBlock, DemoModeNotice } from '../ui/DataState';

export default function FreshPicks({ onToast }) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await listProducts({ availableOnly: true, limit: 8 });
      setRows(data || []);
      setError(err);
      setLoading(false);
    })();
  }, []);

  function add(p) {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addItem({
      product_id: p.product_id,
      farmer_id: p.farmer_id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      image_url: p.image_url,
      farmer_name: productFarmerName(p),
    });
    onToast?.(p.name + ' — ' + t('pages.addedCart'));
  }

  return (
    <section className="wrap sec">
      <div className="shead reveal">
        <div>
          <span className="eyebrow">{t('home.freshEyebrow')}</span>
          <h2 className="with-ic">
            <Leaf size={24} className="hic" /> {t('home.freshTitle')}
          </h2>
          <p className="muted">{t('home.freshLead')}</p>
        </div>
        <a className="viewall" onClick={() => navigate('/products')}>
          {t('home.viewAll')} <ArrowRight size={16} />
        </a>
      </div>
      <DemoModeNotice />
      {loading ? (
        <LoadingBlock label={t('common.loading')} />
      ) : error || !rows.length ? (
        <EmptyState title={t('home.freshEmpty')} message={error || t('common.emptyMessage')} />
      ) : (
        <div className="pgrid">
          {rows.map((p, i) => (
            <div className="pcard reveal" key={p.product_id} style={{ '--d': i * 0.08 + 's' }}>
              <div className="pimg">
                <Img src={p.image_url || IMG.produceFallback} alt={p.name} />
                {p.product_categories?.name && <span className="pbadge">{p.product_categories.name}</span>}
                <HeartBtn productId={p.product_id} />
              </div>
              <div className="pbody">
                <b className="pname">{p.name}</b>
                <div className="price">
                  {t('common.rs')} {p.price}
                  <span>/{p.unit}</span>
                </div>
                <small>
                  <Users size={12} /> {productFarmerName(p)}
                </small>
                <small>
                  <MapPin size={12} /> {p.markets?.market_name || t('home.localMarket')}
                </small>
                <button className="btn full shine" type="button" onClick={() => add(p)}>
                  {t('pages.addToCart')} <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
