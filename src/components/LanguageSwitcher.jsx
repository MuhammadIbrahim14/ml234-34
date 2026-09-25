import { useTranslation } from 'react-i18next';
import { enabledLanguages } from '../i18n/languages';

/** Compact language switcher — only lists languages with enabled: true in the registry. */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();
  const langs = enabledLanguages();
  if (langs.length < 2) return null;

  return (
    <label className={`lang-switch ${className}`.trim()} title={t('lang.switch')}>
      <span className="sr-only">{t('lang.label')}</span>
      <select
        aria-label={t('lang.switch')}
        value={i18n.resolvedLanguage || i18n.language}
        onChange={(e) => {
          void i18n.changeLanguage(e.target.value);
        }}
      >
        {langs.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
