import { useTranslation } from "react-i18next";
import { navigate } from "../../router";
import { Heart, MapPin, ArrowRight, ShoppingBasket } from "lucide-react";
import { IMG } from "../../data/data";
import Img from "../../components/Img";

export default function CallToAction() {
  const { t } = useTranslation();

  return (
      <section className="wrap sec">
        <div className="cta reveal">
          <div className="cta-bg"><Img src={IMG.cta} alt={t("hero.altField")} /></div>
          <div className="cta-l">
            <h2 className="script-h">{t("home.ctaHeadline")}</h2>
            <div className="cta-chips">
              <span><MapPin size={13} /> {t("home.chipLocal")}</span>
              <span><Heart size={13} /> {t("home.chipFair")}</span>
              <span><ShoppingBasket size={13} /> {t("home.chipFresh")}</span>
            </div>
          </div>
          <div className="cta-r">
            <button onClick={() => navigate("/markets")} className="btn shine">{t("home.ctaExplore")} <ArrowRight size={15} /></button>
            <button onClick={() => navigate("/register")} className="btn ghost">{t("home.ctaJoinFarmer")} <ArrowRight size={15} /></button>
          </div>
          <div className="board"><span style={{ whiteSpace: "pre-line" }}>{t("home.ctaBoard")}</span></div>
        </div>
      </section>
  );
}
