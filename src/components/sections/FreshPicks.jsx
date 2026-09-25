import { navigate } from "../../router";
import { Leaf, ShoppingCart, MapPin, ArrowRight, Users } from "lucide-react";
import { PRODUCTS } from "../../data/data";
import Img from "../../components/Img";
import HeartBtn from "../../components/HeartBtn";

export default function FreshPicks({ addToCart }) {
  return (
      <section className="wrap sec">
        <div className="shead reveal">
          <div>
            <span className="eyebrow">Fresh Picks</span>
            <h2 className="with-ic"><Leaf size={24} className="hic" /> Fresh Produce, Just For You</h2>
            <p className="muted">Handpicked by local farmers. Fresh, seasonal and full of goodness.</p>
          </div>
          <a className="viewall" onClick={() => navigate("/products")}>View All <ArrowRight size={16} /></a>
        </div>
        <div className="pgrid">
          {PRODUCTS.map((p, i) => (
            <div className="pcard reveal" key={p.name} style={{ "--d": i * 0.08 + "s" }}>
              <div className="pimg">
                <Img src={p.img} alt={p.name} />
                <span className="pbadge">{p.badge}</span>
                <HeartBtn />
              </div>
              <div className="pbody">
                <b className="pname">{p.name}</b>
                <div className="price">Rs. {p.price}<span>/{p.unit}</span></div>
                <small><Users size={12} /> {p.farmer} (Farmer)</small>
                <small><MapPin size={12} /> Lahore • {p.km} km</small>
                <button className="btn full shine" onClick={() => addToCart(p.name)}>Add to Cart <ShoppingCart size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
  );
}
