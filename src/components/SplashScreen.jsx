import { useEffect, useState } from 'react';
import { Leaf, Sprout } from 'lucide-react';

const SPLASH_KEY = 'ml-splash-seen';
const DURATION_MS = 2200;

/**
 * Agriculture-themed splash — shows once per browser session, then fades out.
 * Does not alter marketing UI layout after dismiss.
 */
export default function SplashScreen() {
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
    const leaveTimer = setTimeout(() => setLeaving(true), DURATION_MS - 450);
    const hideTimer = setTimeout(() => {
      try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch { /* ignore */ }
      setVisible(false);
    }, DURATION_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={'ml-splash' + (leaving ? ' leave' : '')} role="status" aria-live="polite" aria-label="MarketLink loading">
      <div className="ml-splash-bg" aria-hidden="true">
        <span className="ml-splash-field f1" />
        <span className="ml-splash-field f2" />
        <span className="ml-splash-field f3" />
      </div>
      <div className="ml-splash-mark">
        <div className="ml-splash-icon">
          <Leaf size={34} />
        </div>
        <b>MarketLink</b>
        <small>Farm fresh, just a click away</small>
        <div className="ml-splash-grow">
          <Sprout size={16} /> Growing local connections…
        </div>
      </div>
    </div>
  );
}
