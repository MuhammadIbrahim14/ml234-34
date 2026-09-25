import { navigate } from "../../router";
import { Heart, MapPin, ArrowRight, ShoppingBasket } from "lucide-react";
import { IMG } from "../../data/data";
import Img from "../../components/Img";

export default function CallToAction() {
  return (
      <section className="wrap sec">
        <div className="cta reveal">
          <div className="cta-bg"><Img src={IMG.cta} alt="Farm landscape" /></div>
          <div className="cta-l">
            <h2 className="script-h">Your Next Fresh Find<br />Is Closer Than You Think.</h2>
            <div className="cta-chips">
              <span><MapPin size={13} /> Discover local markets</span>
              <span><Heart size={13} /> Support farmers</span>
              <span><ShoppingBasket size={13} /> Shop fresh</span>
            </div>
          </div>
          <div className="cta-r">
            <button onClick={() => navigate("/markets")} className="btn shine">Explore Markets <ArrowRight size={15} /></button>
            <button onClick={() => navigate("/register")} className="btn ghost">Join as a Farmer <ArrowRight size={15} /></button>
          </div>
          <div className="board"><span>Local<br />Fresh<br />Organic</span></div>
        </div>
      </section>
  );
}
