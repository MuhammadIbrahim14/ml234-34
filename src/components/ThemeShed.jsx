import { useState } from 'react';
import { Leaf, Sun, Moon, Sparkles } from 'lucide-react';

/**
 * Harvest Eclipse — botanical iris bloom + sun/moon morph.
 * Totally different from falling-leaf curtains: a flower opens, sky flips, flower closes.
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

    const pollen = Array.from({ length: 36 }, (_, i) => ({
      id: `${Date.now()}-p${i}`,
      angle: (i / 36) * 360 + Math.random() * 8,
      dist: 28 + Math.random() * 72,
      delay: 0.55 + Math.random() * 0.45,
      size: 4 + Math.random() * 7,
      dur: 0.9 + Math.random() * 0.7,
    }));

    const stars = Array.from({ length: 28 }, (_, i) => ({
      id: `${Date.now()}-s${i}`,
      left: Math.random() * 100,
      top: Math.random() * 55,
      delay: 0.35 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 2.5,
    }));

    setFx({ toDark: next, fromDark: dark, pollen, stars });
    window.setTimeout(() => setDark(next), 780);
    window.setTimeout(() => setFx(null), 2400);
  }

  return { setTheme, fx, shedding: Boolean(fx) };
}

const PETALS = 12;

export default function ThemeShed({ fx }) {
  if (!fx) return null;

  const { toDark, fromDark, pollen, stars } = fx;
  const toward = toDark ? 'to-dark' : 'to-light';
  const from = fromDark ? 'from-dark' : 'from-light';

  return (
    <div className={`theme-shed theme-shed--run theme-shed--${from} theme-shed--${toward}`} aria-hidden="true">
      {/* Soft world dim while bloom opens */}
      <div className="theme-shed-veil" />

      {/* Expanding harvest orb */}
      <div className="theme-shed-orb">
        <div className="theme-shed-orb-core">
          <span className="theme-shed-celestial theme-shed-celestial--sun">
            <Sun size={52} strokeWidth={1.6} />
          </span>
          <span className="theme-shed-celestial theme-shed-celestial--moon">
            <Moon size={48} strokeWidth={1.6} />
          </span>
          <Sparkles className="theme-shed-spark" size={22} />
        </div>

        {/* Botanical iris — petals rotate + bloom outward */}
        <div className="theme-shed-iris">
          {Array.from({ length: PETALS }, (_, i) => (
            <span
              key={i}
              className="theme-shed-petal"
              style={{ '--p': i, '--rot': `${(360 / PETALS) * i}deg` }}
            >
              <Leaf size={34} strokeWidth={2} />
            </span>
          ))}
        </div>

        <div className="theme-shed-ring" />
        <div className="theme-shed-ring theme-shed-ring--2" />
      </div>

      {/* Dawn / night wash that fills the screen */}
      <div className="theme-shed-sky" />

      {/* Night stars (to-dark) / pollen sparkles (to-light) */}
      {toDark &&
        stars.map((s) => (
          <i
            key={s.id}
            className="theme-shed-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

      {pollen.map((p) => (
        <i
          key={p.id}
          className="theme-shed-pollen"
          style={{
            '--ang': `${p.angle}deg`,
            '--dist': `${p.dist}vmax`,
            '--p-delay': `${p.delay}s`,
            '--p-dur': `${p.dur}s`,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}
