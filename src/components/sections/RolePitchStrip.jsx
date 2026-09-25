import { useTranslation } from 'react-i18next';
import { ShoppingBag, Sprout, ShieldCheck, ArrowRight } from 'lucide-react';
import { navigate } from '../../router';

const ROLES = [
  { id: 'customer', icon: ShoppingBag, href: '/login', ctaKey: 'home.rolePitch.customerCta' },
  { id: 'farmer', icon: Sprout, href: '/register', ctaKey: 'home.rolePitch.farmerCta' },
  { id: 'admin', icon: ShieldCheck, href: '/login', ctaKey: 'home.rolePitch.adminCta' },
];

/** Pitch strip for Customer / Farmer / Admin — links only; no role mutation. */
export default function RolePitchStrip() {
  const { t } = useTranslation();

  return (
    <section className="wrap sec role-pitch" id="role-pitch" aria-labelledby="role-pitch-title">
      <div className="role-pitch-head reveal">
        <span className="eyebrow">{t('home.rolePitch.eyebrow')}</span>
        <h2 id="role-pitch-title">{t('home.rolePitch.title')}</h2>
        <p className="muted">{t('home.rolePitch.lead')}</p>
        <p className="role-pitch-tip">{t('home.rolePitch.multiTabTip')}</p>
      </div>
      <div className="role-pitch-grid reveal">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <article key={role.id} className="role-pitch-card">
              <span className="role-pitch-icon" aria-hidden>
                <Icon size={22} />
              </span>
              <h3>{t(`home.rolePitch.${role.id}Title`)}</h3>
              <p>{t(`home.rolePitch.${role.id}Body`)}</p>
              <button type="button" className="btn sm" onClick={() => navigate(role.href)}>
                {t(role.ctaKey)} <ArrowRight size={14} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
