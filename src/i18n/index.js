import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  applyDocumentLanguage,
  getLanguage,
} from './languages';
import en from './locales/en.json';
import ur from './locales/ur.json';

/** Future PK languages: add JSON under locales/ and register here + enable in languages.js */
const resources = {
  en: { translation: en },
  ur: { translation: ur },
  pa: { translation: {} },
  sd: { translation: {} },
  ps: { translation: {} },
  bal: { translation: {} },
  skr: { translation: {} },
};

function readStoredLang() {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    if (raw && getLanguage(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

const initial = readStoredLang();

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: Object.keys(resources),
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
});

applyDocumentLanguage(i18n.language || initial);

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  applyDocumentLanguage(lng);
});

export default i18n;
