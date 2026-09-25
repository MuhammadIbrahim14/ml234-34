import { navigate } from "../../router";
import { ArrowRight } from "lucide-react";
import { IMG, STEPS } from "../../data/data";
import Img from "../../components/Img";

export default function HowItWorks() {
  return (
      <section className="wrap sec">
        <div id="how-it-works" className="how reveal">
          <div className="how-l">
            <h2>How MarketLink Works</h2>
            <span className="script mid">Simple Steps. Big Impact.</span>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.t} style={{ "--d": i * 0.12 + "s" }}>
                <div className="sic"><s.icon size={22} /></div>
                <b>{i + 1}. {s.t}</b>
                <small>{s.d}</small>
                {i < STEPS.length - 1 && <span className="sline" />}
              </div>
            ))}
          </div>
          <div className="happy">
            <Img src={IMG.basket} alt="Basket of vegetables" className="happy-img" />
            <div className="happy-ov">
              <span className="script mid">Good Food<br />Happy People</span>
              <button onClick={() => navigate("/register")} className="circle shine" aria-label="Get started"><ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>
  );
}
