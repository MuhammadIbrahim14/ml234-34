import { Sun, Moon, Instagram, Facebook, Twitter, Youtube, Linkedin, Music2, Send } from "lucide-react";
import Logo from "../../components/Logo";
import { navigate } from "../../router";

export default function Footer({ dark, setTheme }) {
  return (
      <footer className="foot">
        <div className="wrap foot-in">
          <div className="fcol brand">
            <Logo />
            <p className="fdesc">Connecting local farmers with their community — one fresh basket at a time.</p>
            <div className="socials">
              {[Instagram, Facebook, Twitter, Youtube, Music2, Linkedin].map((I, i) => <a key={i} aria-label="social"><I size={16} /></a>)}
            </div>
          </div>
          <div className="fcol"><b>Quick Links</b>{["Home", "Markets", "Farmers", "How It Works", "About Us"].map((l) => <a key={l} onClick={() => navigate(({"Home":"/","Markets":"/markets","Farmers":"/farmers","How It Works":"/#how-it-works","About Us":"/about"}[l] || "/"))}>{l}</a>)}</div>
          <div className="fcol"><b>Customer Support</b>{["Help Center", "Contact Us", "FAQs", "Track Order"].map((l) => <a key={l} onClick={() => navigate(({"Help Center":"/contact","Contact Us":"/contact","FAQs":"/contact","Track Order":"/orders"}[l] || "/contact"))}>{l}</a>)}</div>
          <div className="fcol"><b>For Farmers</b>{["Farmer Registration", "Seller Guidelines", "Resources", "Support"].map((l) => <a key={l} onClick={() => navigate(({"Farmer Registration":"/register","Seller Guidelines":"/about","Resources":"/about","Support":"/contact"}[l] || "/register"))}>{l}</a>)}</div>
          <div className="fcol news">
            <b>Stay Updated</b>
            <small>Get the latest updates, offers and fresh produce news.</small>
            <div className="nl"><input placeholder="Your email address" /><button aria-label="Subscribe" onClick={() => alert("Subscribed in frontend demo.")}><Send size={15} /></button></div>
            <div className="seg">
              <button className={!dark ? "on" : ""} onClick={() => setTheme(false)}><Sun size={14} /> Light</button>
              <button className={dark ? "on" : ""} onClick={() => setTheme(true)}><Moon size={14} /> Dark</button>
            </div>
            <span className="script choose">Choose your vibe ♡</span>
          </div>
        </div>
        <div className="wrap foot-bot">
          <span>© 2026 MarketLink. All rights reserved.</span>
          <span className="fb-links"><a onClick={() => navigate("/about")}>Privacy Policy</a> | <a onClick={() => navigate("/about")}>Terms & Conditions</a></span>
        </div>
      </footer>
  );
}
