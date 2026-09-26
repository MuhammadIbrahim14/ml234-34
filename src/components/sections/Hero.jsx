import { useState } from "react";
import { useTranslation } from "react-i18next";
import { navigate } from "../../router";
import { Leaf, MapPin, Truck, Sprout, ArrowRight, ShoppingBasket } from "lucide-react";
import { IMG } from "../../data/data";
import Img from "../../components/Img";

export default function Hero() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");

  function goSearch(e) {
    if (e) e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  const perks = [
    { i: Sprout, title: t("hero.perkFarmers"), sub: t("hero.perkFarmersSub") },
    { i: ShoppingBasket, title: t("hero.perkProduce"), sub: t("hero.perkProduceSub") },
    { i: Truck, title: t("hero.perkPickup"), sub: t("hero.perkPickupSub") },
  ];

  return (
      <section className="hero">
        <div className="hero-bg" data-parallax-speed="0.35">
          <Img
            className="hero-bg-layer hero-bg-day"
            src="/images/LandingBackground.jpg"
            alt={t("hero.altField")}
          />
          <Img
            className="hero-bg-layer hero-bg-night"
            src="/images/NightBackground.png"
            alt={t("hero.altFieldNight")}
          />
        </div>
        {[18, 52, 78].map((l, i) => (
          <Leaf key={i} className="fall" size={16 + (i % 2) * 6} style={{ left: l + "%", animationDelay: i * 3.2 + "s", animationDuration: 14 + i * 3 + "s" }} />
        ))}
        <div className="wrap hero-in">
          <div className="hero-l" data-parallax-speed="0.06">
            <span className="script tag rise" style={{ "--d": "0s" }}>{t("hero.tag")}</span>
            <h1 className="hero-h">
              <span className="rise" style={{ "--d": ".1s" }}>{t("hero.line1")}</span>
              <span className="rise" style={{ "--d": ".22s" }}><em className="brush">{t("hero.line2Farm")}</em> <Leaf className="h1leaf" size={34} /></span>
              <span className="rise" style={{ "--d": ".34s" }}>{t("hero.line3a")} <em className="you">{t("hero.line3You")}</em></span>
            </h1>
            <p className="lead rise" style={{ "--d": ".46s" }}>{t("hero.lead")}</p>
            <form className="bigsearch rise" style={{ "--d": ".58s" }} onSubmit={goSearch}>
              <MapPin size={18} />
              <input
                placeholder={t("hero.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("hero.searchAria")}
              />
              <button type="submit" className="circle shine" aria-label={t("common.search")}><ArrowRight size={18} /></button>
            </form>
            <div className="feats rise" style={{ "--d": ".7s" }}>
              {perks.map((f) => (
                <div className="feat" key={f.title}>
                  <div className="fic"><f.i size={20} /></div>
                  <div><b>{f.title}</b><small>{f.sub}</small></div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-r" data-parallax-speed="-0.1">
            <div className="ring" />
            <div className="photo pop" style={{ "--d": ".2s" }}>
              <Img src={IMG.heroFarmer} alt={t("hero.altFarmer")} />
              <span className="sticker" style={{ whiteSpace: "pre-line" }}>{t("hero.sticker")}</span>
            </div>
            <div className="crate-photo pop" style={{ "--d": ".5s" }}><Img src={IMG.crate} alt={t("hero.altCrate")} /></div>
            <span className="script note" style={{ whiteSpace: "pre-line" }}>{t("hero.note")}</span>
            <div className="fcards">
              <div className="fcard float" style={{ "--d": "0s" }}><div className="fcic"><Leaf size={18} /></div><div><b>{t("hero.cardStock")}</b><small>{t("hero.cardStockSub")}</small></div></div>
              <div className="fcard float" style={{ "--d": "1.2s" }}><div className="fcic"><MapPin size={18} /></div><div><b>{t("hero.cardMarkets")}</b><small>{t("hero.cardMarketsSub")}</small></div></div>
              <div className="fcard float" style={{ "--d": "2.4s" }}><div className="fcic photo-ic"><Img src={IMG.basket} alt={t("hero.altBasket")} /></div><div><b>{t("hero.cardPicks")}</b><strong>{t("hero.cardPicksSub")}</strong></div></div>
            </div>
          </div>
        </div>
      </section>
  );
}
