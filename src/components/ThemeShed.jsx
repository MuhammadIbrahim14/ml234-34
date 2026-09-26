import { useState } from 'react';
import { Leaf } from 'lucide-react';

/**
 * Fresh Press Seal — MarketLink harvest wax-stamp.
 * Orbiting produce motes collapse → seal stamps → ink ripples → theme flips.
 * Short (~0.95s), premium, farm-market branded.
 */
export function useThemeShed(setDark, dark) {
  const [fx, setFx] = useState(null);

  function setTheme(v) {
    const next = typeof v === 'boolean' ? v : !dark;
    if (next === dark) return;
    if (fx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setDark(next);
      return;
    }

    const stamp = Date.now();
    const motes = Array.from({ length: 8 }, (_, i) => ({
      id: `${stamp}-m${i}`,
      angle: (i / 8) * 360,
      hue: i % 4,
      delay: i * 0.02,
    }));

    setFx({ toDark: next, fromDark: dark, motes });
    window.setTimeout(() => setDark(next), 300);
    window.setTimeout(() => setFx(null), 950);
  }

  return { setTheme, fx, shedding: Boolean(fx) };
}

export default function ThemeShed({ fx }) {
  if (!fx) return null;

  const { toDark, fromDark, motes } = fx;
  const toward = toDark ? 'to-dark' : 'to-light';
  const from = fromDark ? 'from-dark' : 'from-light';

  return (
    <div
      className={`theme-shed theme-shed--run theme-shed--${from} theme-shed--${toward}`}
      aria-hidden="true"
    >
      <div className="theme-shed-veil" />
      <div className="theme-shed-flash" />

      <div className="theme-shed-ripples">
        <span className="theme-shed-ripple r1" />
        <span className="theme-shed-ripple r2" />
        <span className="theme-shed-ripple r3" />
      </div>

      <div className="theme-shed-motes">
        {motes.map((m) => (
          <i
            key={m.id}
            className={`theme-shed-mote hue-${m.hue}`}
            style={{
              ['--ma']: `${m.angle}deg`,
              animationDelay: `${m.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="theme-shed-seal">
        <span className="theme-shed-seal-wax" />
        <span className="theme-shed-seal-ring outer" />
        <span className="theme-shed-seal-ring inner" />
        <span className="theme-shed-seal-mark">
          <Leaf size={34} strokeWidth={2.25} />
        </span>
        <span className="theme-shed-seal-band" />
      </div>

      <div className="theme-shed-bloom" />
    </div>
  );
}
