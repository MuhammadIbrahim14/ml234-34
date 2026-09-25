import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Landing only: Lenis smooth scroll + lerped hero parallax (one RAF loop).
 * Keeps motion smooth without getBoundingClientRect thrash.
 */
export default function LandingMotion({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;

    const layers = Array.from(root.querySelectorAll('[data-parallax-speed]'));
    const speeds = layers.map((el) => Number(el.getAttribute('data-parallax-speed')) || 0);
    const current = speeds.map(() => 0);
    const target = speeds.map(() => 0);

    let heroBottom = window.innerHeight * 1.5;
    function measure() {
      const hero = root.querySelector('.hero');
      heroBottom = hero ? hero.offsetTop + hero.offsetHeight + 80 : window.innerHeight * 1.5;
    }
    measure();

    const lenis = new Lenis({
      duration: 0.95,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.25,
      wheelMultiplier: 0.88,
      autoRaf: false,
    });

    document.documentElement.classList.add('ml-lenis');

    const LERP = 0.14;

    function setTargets(y) {
      if (y > heroBottom) {
        root.classList.add('is-past-hero');
        for (let i = 0; i < target.length; i += 1) target[i] = 0;
        return;
      }
      root.classList.remove('is-past-hero');
      for (let i = 0; i < target.length; i += 1) {
        target[i] = y * speeds[i];
      }
    }

    function tick(time) {
      lenis.raf(time);

      for (let i = 0; i < layers.length; i += 1) {
        const next = current[i] + (target[i] - current[i]) * LERP;
        current[i] = Math.abs(next) < 0.04 ? (target[i] === 0 ? 0 : next) : next;
        if (Math.abs(current[i]) < 0.04 && target[i] === 0) current[i] = 0;
        layers[i].style.transform = current[i]
          ? `translate3d(0, ${current[i].toFixed(2)}px, 0)`
          : '';
      }

      rafId = requestAnimationFrame(tick);
    }

    let rafId = requestAnimationFrame(tick);

    const onScroll = (e) => {
      const y = typeof e?.scroll === 'number' ? e.scroll : window.scrollY || 0;
      setTargets(y);
    };
    lenis.on('scroll', onScroll);
    setTargets(window.scrollY || 0);

    const onResize = () => {
      measure();
      setTargets(window.scrollY || 0);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      lenis.destroy();
      document.documentElement.classList.remove('ml-lenis');
      layers.forEach((el) => {
        el.style.transform = '';
      });
      root.classList.remove('is-past-hero');
    };
  }, []);

  return (
    <div className="landing-motion" ref={rootRef}>
      {children}
    </div>
  );
}
