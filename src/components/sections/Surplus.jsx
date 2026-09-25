import { useEffect, useState } from 'react';
import { navigate } from '../../router';
import { MapPin, ArrowRight, Recycle } from 'lucide-react';
import { IMG } from '../../data/data';
import { listLowStockProducts, productFarmerName } from '../../lib/api/products';
import Img from '../../components/Img';
import HeartBtn from '../../components/HeartBtn';
import { EmptyState, LoadingBlock } from '../ui/DataState';

export default function Surplus() {
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
          <Img src={IMG.surplus} alt="Fresh surplus produce" />
          <span className="sign">
            Save Food
            <br />
            Reduce Waste
          </span>
        </div>
        <div className="stxt">
          <span className="pill">Save More</span>
          <h3 className="with-ic">
            <Recycle size={22} className="hic spin-slow" /> Food Waste Rescue
          </h3>
          <b className="sub">Low-stock picks</b>
          <p className="muted">Help move remaining stock before it goes to waste — low-quantity available products from local farmers.</p>
          <button type="button" onClick={() => navigate('/products')} className="btn shine">
            Explore Produce <ArrowRight size={15} />
          </button>
        </div>
        <div className="sgrid">
          {loading ? (
            <LoadingBlock label="Loading…" />
          ) : !rows.length ? (
            <EmptyState title="No low-stock items" message="When stock runs low, those products will appear here." />
          ) : (
            rows.map((s) => (
              <div className="scard" key={s.product_id}>
                <div className="scimg">
                  <Img src={s.image_url || IMG.produceFallback} alt={s.name} />
                  <span className="stag">Low stock</span>
                  <HeartBtn productId={s.product_id} />
                </div>
                <div className="scbody">
                  <b>{s.name}</b>
                  <div>
                    <span className="price">
                      Rs. {s.price}/{s.unit}
                    </span>{' '}
                    <span className="off">{s.stock_quantity} left</span>
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
