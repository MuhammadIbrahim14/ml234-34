import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isProductFavorited, isFarmerFavorited, toggleProductFavorite, toggleFarmerFavorite } from '../lib/api/favorites';
import { navigate } from '../router';

export default function HeartBtn({ productId = null, farmerId = null }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isConfigured } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConfigured || !isAuthenticated || !user?.id) return;
      if (productId) {
        const fav = await isProductFavorited(user.id, productId);
        if (!cancelled) setOn(fav);
      } else if (farmerId) {
        const fav = await isFarmerFavorited(user.id, farmerId);
        if (!cancelled) setOn(fav);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, farmerId, user?.id, isAuthenticated, isConfigured]);

  async function onClick(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isConfigured) return;
    setBusy(true);
    if (productId) {
      const { favorited, error } = await toggleProductFavorite(user.id, productId);
      if (!error) setOn(favorited);
    } else if (farmerId) {
      const { favorited, error } = await toggleFarmerFavorite(user.id, farmerId);
      if (!error) setOn(favorited);
    } else {
      setOn((v) => !v);
    }
    setBusy(false);
  }

  return (
    <button
      className={'heart' + (on ? ' on' : '')}
      type="button"
      disabled={busy}
      onClick={onClick}
      aria-label={t('a11y.saveFavourite')}
    >
      <Heart size={15} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}
