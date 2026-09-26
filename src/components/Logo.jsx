import { Leaf } from 'lucide-react';

/** Animated MarketLink mark — orbiting leaf seal (no tagline). */
export default function Logo() {
  return (
    <div className="logo ml-logo" aria-label="MarketLink">
      <div className="ml-logo-mark" aria-hidden="true">
        <span className="ml-logo-ring" />
        <span className="ml-logo-ring r2" />
        <span className="ml-logo-core">
          <Leaf size={18} strokeWidth={2.4} />
        </span>
        <span className="ml-logo-dot d1" />
        <span className="ml-logo-dot d2" />
        <span className="ml-logo-dot d3" />
      </div>
      <b className="ml-logo-word">
        Market<span>Link</span>
      </b>
    </div>
  );
}
