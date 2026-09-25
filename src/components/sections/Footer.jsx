import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Moon, Send } from "lucide-react";
import Logo from "../../components/Logo";
import { navigate } from "../../router";
import { flashToast } from "../../lib/flashToast";
import { subscribeNewsletter } from "../../lib/api/contact";

export default function Footer({ dark, setTheme }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const quickLinks = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.markets"), path: "/markets" },
    { label: t("nav.farmers"), path: "/farmers" },
    { label: t("home.howTitle"), path: "/#how-it-works" },
    { label: t("nav.about"), path: "/about" },
  ];
  const supportLinks = [
    { label: t("footer.help"), path: "/contact" },
    { label: t("footer.contact"), path: "/contact" },
    { label: t("footer.faqs"), path: "/contact" },
    { label: t("footer.trackOrder"), path: "/orders" },
  ];
  const farmerLinks = [
    { label: t("footer.registerFarmer"), path: "/register" },
    { label: t("footer.sellerGuidelines"), path: "/about" },
    { label: t("footer.resources"), path: "/about" },
    { label: t("footer.support"), path: "/contact" },
  ];

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
    flashToast(t("footer.newsletterToast"));
  }

  return (
      <footer className="foot">
        <div className="wrap foot-in">
          <div className="fcol brand">
            <Logo />
            <p className="fdesc">{t("footer.desc")}</p>
          </div>
          <div className="fcol">
            <b>{t("footer.quickLinks")}</b>
            {quickLinks.map((l) => (
              <a key={l.path + l.label} onClick={() => navigate(l.path)}>{l.label}</a>
            ))}
          </div>
          <div className="fcol">
            <b>{t("footer.support")}</b>
            {supportLinks.map((l) => (
              <a key={l.path + l.label} onClick={() => navigate(l.path)}>{l.label}</a>
            ))}
          </div>
          <div className="fcol">
            <b>{t("footer.forFarmers")}</b>
            {farmerLinks.map((l) => (
              <a key={l.path + l.label} onClick={() => navigate(l.path)}>{l.label}</a>
            ))}
          </div>
          <div className="fcol news">
            <b>{t("footer.newsletter")}</b>
            <small>{t("footer.newsletterHint")}</small>
            <form className="nl" onSubmit={onSubscribe}>
              <input
                type="email"
                required
                placeholder={t("footer.newsletterPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={t("footer.newsletterAria")}
              />
              <button type="submit" aria-label={t("footer.subscribeAria")} disabled={busy}>
                <Send size={15} />
              </button>
            </form>
            <div className="seg">
              <button type="button" className={!dark ? "on" : ""} onClick={() => setTheme(false)}><Sun size={14} /> {t("footer.themeLight")}</button>
              <button type="button" className={dark ? "on" : ""} onClick={() => setTheme(true)}><Moon size={14} /> {t("footer.themeDark")}</button>
            </div>
            <span className="script choose">{t("footer.vibe")}</span>
          </div>
        </div>
        <div className="wrap foot-bot">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span className="fb-links"><a onClick={() => navigate("/about")}>{t("footer.privacy")}</a> | <a onClick={() => navigate("/about")}>{t("footer.terms")}</a></span>
        </div>
      </footer>
  );
}
