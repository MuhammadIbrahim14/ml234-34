/**
 * Pakistani languages registry — add a locale file + enable here to ship a new language.
 * UI switcher only lists `enabled: true`. Disabled codes still work if forced via localStorage
 * once their JSON exists (fallbackLng: en).
 */
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', enabled: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', enabled: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'پنجابی', dir: 'rtl', enabled: true },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', dir: 'rtl', enabled: false },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', dir: 'rtl', enabled: false },
  { code: 'bal', name: 'Balochi', nativeName: 'بلوچی', dir: 'rtl', enabled: false },
  { code: 'skr', name: 'Saraiki', nativeName: 'سرائیکی', dir: 'rtl', enabled: false },
];

export const DEFAULT_LANG = 'en';
export const LANG_STORAGE_KEY = 'ml-lang';

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

export function enabledLanguages() {
  return LANGUAGES.filter((l) => l.enabled);
}

export function applyDocumentLanguage(code) {
  const lang = getLanguage(code);
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
  document.documentElement.dataset.lang = lang.code;
}
