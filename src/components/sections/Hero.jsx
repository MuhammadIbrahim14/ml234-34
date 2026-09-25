import { navigate } from "../../router";
import { Leaf, Search, MapPin, Truck, Sprout, ArrowRight, ShoppingBasket } from "lucide-react";
import { IMG, PRODUCTS } from "../../data/data";
import Img from "../../components/Img";

export default function Hero() {
  return (
      <section className="hero">
        <div className="hero-bg"><Img src={IMG.heroField} alt="Farm field" /></div>
        {[8, 22, 47, 68, 88].map((l, i) => (
          <Leaf key={i} className="fall" size={18 + (i % 3) * 6} style={{ left: l + "%", animationDelay: i * 2.2 + "s", animationDuration: 11 + i * 2 + "s" }} />
        ))}
        <div className="wrap hero-in">
          <div className="hero-l">
            <span className="script tag rise" style={{ "--d": "0s" }}>Support Local ♡</span>
            <h1 className="hero-h">
              <span className="rise" style={{ "--d": ".1s" }}>Fresh From</span>
              <span className="rise" style={{ "--d": ".22s" }}><em className="brush">The Farm</em> <Leaf className="h1leaf" size={34} /></span>
              <span className="rise" style={{ "--d": ".34s" }}>Closer To <em className="you">You!</em></span>
            </h1>
            <p className="lead rise" style={{ "--d": ".46s" }}>Discover local farmers, explore nearby markets, and pre-order fresh produce — all in one place.</p>
            <div className="bigsearch rise" style={{ "--d": ".58s" }}>
              <MapPin size={18} />
              <input placeholder="Search for markets, products, or farmers..." />
              <button onClick={() => navigate("/products")} className="circle shine" aria-label="Search"><ArrowRight size={18} /></button>
            </div>
            <div className="feats rise" style={{ "--d": ".7s" }}>
              {[
                { i: Sprout, t: "Local Farmers", s: "Direct from source" },
                { i: ShoppingBasket, t: "Fresh Produce", s: "Seasonal & natural" },
                { i: Truck, t: "Easy Pickup", s: "At your convenience" },
              ].map((f) => (
                <div className="feat" key={f.t}>
                  <div className="fic"><f.i size={20} /></div>
                  <div><b>{f.t}</b><small>{f.s}</small></div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-r">
            <div className="ring" />
            <div className="photo pop" style={{ "--d": ".2s" }}>
              <Img src={IMG.heroFarmer} alt="Farmer with fresh vegetables" />
              <span className="sticker">Real Farmers<br />Real Food ♡</span>
            </div>
            <div className="crate-photo pop" style={{ "--d": ".5s" }}><Img src={IMG.crate} alt="Crate of vegetables" /></div>
            <span className="script note">Good Food<br />Happy People ♡</span>
            <div className="fcards">
              <div className="fcard float" style={{ "--d": "0s" }}><div className="fcic"><Leaf size={18} /></div><div><b>Fresh Stock Available</b><small>Organic • Seasonal • Local</small></div></div>
              <div className="fcard float" style={{ "--d": "1.2s" }}><div className="fcic"><MapPin size={18} /></div><div><b>12 Markets Near You</b><small>Find your nearest market</small></div></div>
              <div className="fcard float" style={{ "--d": "2.4s" }}><div className="fcic photo-ic"><Img src={PRODUCTS[0].img} alt="Tomatoes" /></div><div><b>Tomatoes</b><strong>Rs. 120/kg</strong></div></div>
            </div>
          </div>
        </div>
      </section>
  );
}
