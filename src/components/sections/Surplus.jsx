import { navigate } from "../../router";
import { MapPin, ArrowRight, Recycle } from "lucide-react";
import { IMG, SURPLUS } from "../../data/data";
import Img from "../../components/Img";
import HeartBtn from "../../components/HeartBtn";

export default function Surplus() {
  return (
      <section className="wrap sec">
        <div className="surplus reveal">
          <div className="simg">
            <Img src={IMG.surplus} alt="Fresh surplus produce" />
            <span className="sign">Save Food<br />Reduce Waste</span>
          </div>
          <div className="stxt">
            <span className="pill">Save More</span>
            <h3 className="with-ic"><Recycle size={22} className="hic spin-slow" /> Food Waste Rescue</h3>
            <b className="sub">Surplus Produce</b>
            <p className="muted">Good food shouldn't go to waste! Get discounted prices on fresh produce from farmers' surplus stock.</p>
            <button onClick={() => navigate("/products")} className="btn shine">Explore Surplus <ArrowRight size={15} /></button>
          </div>
          <div className="sgrid">
            {SURPLUS.map((s) => (
              <div className="scard" key={s.name}>
                <div className="scimg"><Img src={s.img} alt={s.name} /><span className="stag">Surplus</span><HeartBtn /></div>
                <div className="scbody">
                  <b>{s.name}</b>
                  <div><span className="price">Rs. {s.price}/kg</span> <span className="off">{s.off}% OFF</span></div>
                  <small><MapPin size={12} /> Lahore • {s.km} km</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
}
