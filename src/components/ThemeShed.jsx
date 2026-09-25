import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Prism Tide — diagonal aurora waves + refracting sun/moon prism.
 * Distinct from leaf/iris bloom: liquid bands sweep, prism flips day↔night.
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

    const streaks = Array.from({ length: 14 }, (_, i) => ({
      id: `${Date.now()}-k${i}`,
      top: 8 + Math.random() * 84,
      delay: 0.25 + Math.random() * 0.55,
      len: 40 + Math.random() * 120,
      thick: 1.5 + Math.random() * 2.5,
      skew: -18 - Math.random() * 12,
    }));

    setFx({ toDark: next, fromDark: dark, streaks });
    window.setTimeout(() => setDark(next), 720);
    window.setTimeout(() => setFx(null), 2200);
  }

  return { setTheme, fx, shedding: Boolean(fx) };
}

export default function ThemeShed({ fx }) {
  if (!fx) return null;

  const { toDark, fromDark, streaks } = fx;
  const toward = toDark ? 'to-dark' : 'to-light';
  const from = fromDark ? 'from-dark' : 'from-light';

  return (
    <div className={`theme-shed theme-shed--run theme-shed--${from} theme-shed--${toward}`} aria-hidden="true">
      <div className="theme-shed-veil" />

      {/* Liquid aurora bands */}
      <div className="theme-shed-waves">
        <span className="theme-shed-wave w1" />
        <span className="theme-shed-wave w2" />
        <span className="theme-shed-wave w3" />
        <span className="theme-shed-wave w4" />
      </div>

      {/* Refracting prism with sun/moon morph */}
      <div className="theme-shed-prism">
        <div className="theme-shed-prism-face">
          <span className="theme-shed-celestial theme-shed-celestial--sun">
            <Sun size={44} strokeWidth={1.75} />
          </span>
          <span className="theme-shed-celestial theme-shed-celestial--moon">
            <Moon size={40} strokeWidth={1.75} />
          </span>
        </div>
        <i className="theme-shed-prism-glow" />
      </div>

      {/* Speed streaks / light shards */}
      {streaks.map((s) => (
        <i
          key={s.id}
          className="theme-shed-streak"
          style={{
            top: `${s.top}%`,
            width: s.len,
            height: s.thick,
            animationDelay: `${s.delay}s`,
            ['--skew']: `${s.skew}deg`,
          }}
        />
      ))}
    </div>
  );
}
