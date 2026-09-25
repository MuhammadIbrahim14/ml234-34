import { useTranslation } from "react-i18next";
import { navigate } from "../../router";
import { ArrowRight } from "lucide-react";
import { IMG, STEPS } from "../../data/data";
import Img from "../../components/Img";

const STEP_KEYS = [
  { title: "home.stepDiscover", desc: "home.stepDiscoverDesc" },
  { title: "home.stepSelect", desc: "home.stepSelectDesc" },
  { title: "home.stepPreorder", desc: "home.stepPreorderDesc" },
  { title: "home.stepPickup", desc: "home.stepPickupDesc" },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
      <section className="wrap sec">
        <div id="how-it-works" className="how reveal">
          <div className="how-l">
            <h2>{t("home.howTitle")}</h2>
            <span className="script mid">{t("home.howScript")}</span>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={STEP_KEYS[i].title} style={{ "--d": i * 0.12 + "s" }}>
                <div className="sic"><s.icon size={22} /></div>
                <b>{i + 1}. {t(STEP_KEYS[i].title)}</b>
                <small>{t(STEP_KEYS[i].desc)}</small>
                {i < STEPS.length - 1 && <span className="sline" />}
              </div>
            ))}
          </div>
          <div className="happy">
            <Img src={IMG.basket} alt={t("hero.altBasket")} className="happy-img" />
            <div className="happy-ov">
              <span className="script mid">{t("home.howHappy")}</span>
              <button onClick={() => navigate("/register")} className="circle shine" aria-label={t("home.getStarted")}><ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>
  );
}
