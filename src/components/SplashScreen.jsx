import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Sprout } from 'lucide-react';

const SPLASH_KEY = 'ml-splash-seen';
const DURATION_MS = 2600;

/**
 * Farm-dawn splash — once per browser session, then fades out.
 * Visual-only; does not change app routing or auth.
 */
export default function SplashScreen() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const leaveTimer = setTimeout(() => setLeaving(true), DURATION_MS - 500);
    const hideTimer = setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_KEY, '1');
      } catch {
        /* ignore */
      }
      setVisible(false);
    }, DURATION_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={'ml-splash' + (leaving ? ' leave' : '')}
      role="status"
      aria-live="polite"
      aria-label={t('splash.aria')}
    >
      <div className="ml-splash-bg" aria-hidden="true">
        <span className="ml-splash-sun" />
        <span className="ml-splash-horizon" />
        <span className="ml-splash-seed s1" />
        <span className="ml-splash-seed s2" />
        <span className="ml-splash-seed s3" />
        <span className="ml-splash-seed s4" />
        <span className="ml-splash-seed s5" />
      </div>
      <div className="ml-splash-mark">
        <div className="ml-splash-orbit">
          <span className="ml-splash-ring" />
          <span className="ml-splash-ring r2" />
          <div className="ml-splash-icon">
            <Leaf size={30} />
          </div>
        </div>
        <b>{t('splash.brand', { defaultValue: 'MarketLink' })}</b>
        <small>{t('splash.tagline')}</small>
        <div className="ml-splash-bar" aria-hidden="true">
          <i />
        </div>
        <div className="ml-splash-grow">
          <Sprout size={15} /> {t('splash.growing')}
        </div>
      </div>
    </div>
  );
}
