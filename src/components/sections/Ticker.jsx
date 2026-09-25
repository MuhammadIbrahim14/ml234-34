import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { TICKER_FALLBACK } from '../../data/data';
import { listProducts } from '../../lib/api/products';
import { listMarkets } from '../../lib/api/markets';

export default function Ticker() {
  const [items, setItems] = useState(TICKER_FALLBACK);

  useEffect(() => {
    (async () => {
      const [p, m] = await Promise.all([
        listProducts({ availableOnly: true, limit: 8 }),
        listMarkets({ activeOnly: true }),
      ]);
      const lines = [];
      (p.data || []).forEach((prod) => {
        lines.push(`${prod.name} Rs. ${prod.price}/${prod.unit || 'kg'}`);
      });
      const marketCount = (m.data || []).length;
      if (marketCount) lines.push(`${marketCount} market${marketCount === 1 ? '' : 's'} open`);
      if (lines.length) setItems(lines);
      else setItems(TICKER_FALLBACK);
    })();
  }, []);

  return (
    <div className="ticker" aria-hidden="true">
      <div className="track">
        {[...items, ...items].map((t, i) => (
          <span key={i}>
            <Leaf size={13} /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}
