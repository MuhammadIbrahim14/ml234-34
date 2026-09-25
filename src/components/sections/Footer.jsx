import { useState } from "react";
import { Sun, Moon, Send } from "lucide-react";
import Logo from "../../components/Logo";
import { navigate } from "../../router";
import { flashToast } from "../../lib/flashToast";
import { subscribeNewsletter } from "../../lib/api/contact";

export default function Footer({ dark, setTheme }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubscribe(e) {
    if (e) e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await subscribeNewsletter(email);
    setBusy(false);
    if (error) {
      flashToast(error);
      return;
    }
    setEmail("");
    flashToast("Subscribed — thanks for staying in touch!");
  }

  return (
      <footer className="foot">
        <div className="wrap foot-in">
          <div className="fcol brand">
            <Logo />
            <p className="fdesc">Connecting local farmers with their community — one fresh basket at a time.</p>
          </div>
          <div className="fcol"><b>Quick Links</b>{["Home", "Markets", "Farmers", "How It Works", "About Us"].map((l) => <a key={l} onClick={() => navigate(({"Home":"/","Markets":"/markets","Farmers":"/farmers","How It Works":"/#how-it-works","About Us":"/about"}[l] || "/"))}>{l}</a>)}</div>
          <div className="fcol"><b>Customer Support</b>{["Help Center", "Contact Us", "FAQs", "Track Order"].map((l) => <a key={l} onClick={() => navigate(({"Help Center":"/contact","Contact Us":"/contact","FAQs":"/contact","Track Order":"/orders"}[l] || "/contact"))}>{l}</a>)}</div>
          <div className="fcol"><b>For Farmers</b>{["Farmer Registration", "Seller Guidelines", "Resources", "Support"].map((l) => <a key={l} onClick={() => navigate(({"Farmer Registration":"/register","Seller Guidelines":"/about","Resources":"/about","Support":"/contact"}[l] || "/register"))}>{l}</a>)}</div>
          <div className="fcol news">
            <b>Stay Updated</b>
            <small>Get the latest updates, offers and fresh produce news.</small>
            <form className="nl" onSubmit={onSubscribe}>
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Newsletter email"
              />
              <button type="submit" aria-label="Subscribe" disabled={busy}>
                <Send size={15} />
              </button>
            </form>
            <div className="seg">
              <button type="button" className={!dark ? "on" : ""} onClick={() => setTheme(false)}><Sun size={14} /> Light</button>
              <button type="button" className={dark ? "on" : ""} onClick={() => setTheme(true)}><Moon size={14} /> Dark</button>
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
