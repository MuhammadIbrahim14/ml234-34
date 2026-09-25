import { navigate } from "../../router";
import { useRef } from "react";
import { MapPin, ArrowRight, Users, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { FARMERS } from "../../data/data";
import Img from "../../components/Img";
import HeartBtn from "../../components/HeartBtn";

export default function Farmers() {
  const carRef = useRef(null);
  const scroll = (d) => carRef.current?.scrollBy({ left: d * 250, behavior: "smooth" });

  return (
      <section className="farm-sec">
        <div className="wrap farm-in">
          <div className="farm-l reveal">
            <span className="eyebrow">Meet The Farmers</span>
            <h2 className="with-ic"><Users size={24} className="hic" /> Real People. Real Produce.</h2>
            <p className="muted">Get to know the hardworking farmers behind your food. Support local. Build a stronger community.</p>
            <button onClick={() => navigate("/farmers")} className="btn ghost">View All Farmers <ArrowRight size={15} /></button>
          </div>
          <div className="car-wrap reveal">
            <button className="arrow l" onClick={() => scroll(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
            <div className="carousel" ref={carRef}>
              {FARMERS.map((f) => (
                <div className="fmcard" key={f.name}>
                  <div className="fmimg">
                    <Img src={f.img} alt={f.name} />
                    <HeartBtn />
                    <span className="vbadge">{f.badge}</span>
                  </div>
                  <div className="fmbody">
                    <b>{f.name} <BadgeCheck size={15} className="vcheck" /></b>
                    <small className="role">{f.role}</small>
                    <small><MapPin size={12} /> Lahore • {f.km} km</small>
                    <div className="tags">{f.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="arrow r" onClick={() => scroll(1)} aria-label="Next"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>
  );
}
