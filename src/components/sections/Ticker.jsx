import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';
import { listProducts } from '../../lib/api/products';
import { listMarkets } from '../../lib/api/markets';

export default function Ticker() {
  const { t } = useTranslation();
  const fallback = [t('home.ticker1'), t('home.ticker2'), t('home.ticker3'), t('home.ticker4')];
  const [items, setItems] = useState(fallback);

  useEffect(() => {
    const nextFallback = [t('home.ticker1'), t('home.ticker2'), t('home.ticker3'), t('home.ticker4')];
    (async () => {
      const [p, m] = await Promise.all([
        listProducts({ availableOnly: true, limit: 8 }),
        listMarkets({ activeOnly: true }),
      ]);
      const lines = [];
      (p.data || []).forEach((prod) => {
        lines.push(`${prod.name} ${t('common.rs')} ${prod.price}/${prod.unit || 'kg'}`);
      });
      const marketCount = (m.data || []).length;
      if (marketCount) lines.push(t('home.tickerMarketsOpen', { count: marketCount }));
      if (lines.length) setItems(lines);
      else setItems(nextFallback);
    })();
  }, [t]);

  return (
    <div className="ticker" aria-hidden="true">
      <div className="track">
        {[...items, ...items].map((line, i) => (
          <span key={i}>
            <Leaf size={13} /> {line}
          </span>
        ))}
      </div>
    </div>
  );
}
