import { useEffect, useState } from 'react';
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
    onToast?.(p.name + ' added to cart');
  }

  return (
    <section className="wrap sec">
      <div className="shead reveal">
        <div>
          <span className="eyebrow">Fresh Picks</span>
          <h2 className="with-ic">
            <Leaf size={24} className="hic" /> Fresh Produce, Just For You
          </h2>
          <p className="muted">Handpicked by local farmers. Fresh, seasonal and full of goodness.</p>
        </div>
        <a className="viewall" onClick={() => navigate('/products')}>
          View All <ArrowRight size={16} />
        </a>
      </div>
      <DemoModeNotice />
      {loading ? (
        <LoadingBlock label="Loading fresh picks…" />
      ) : error || !rows.length ? (
        <EmptyState title="No products yet" message={error || 'Farmers have not listed available stock yet.'} />
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
                  Rs. {p.price}
                  <span>/{p.unit}</span>
                </div>
                <small>
                  <Users size={12} /> {productFarmerName(p)}
                </small>
                <small>
                  <MapPin size={12} /> {p.markets?.market_name || 'Local market'}
                </small>
                <button className="btn full shine" type="button" onClick={() => add(p)}>
                  Add to Cart <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
