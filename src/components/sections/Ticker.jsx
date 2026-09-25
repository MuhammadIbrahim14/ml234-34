import { Leaf } from "lucide-react";
import { TICKER } from "../../data/data";

export default function Ticker() {
  return (
      <div className="ticker" aria-hidden="true">
        <div className="track">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i}><Leaf size={13} /> {t}</span>)}
        </div>
      </div>
  );
}
