# Adding a language (Pakistan)

1. Create `src/i18n/locales/<code>.json` (copy `en.json`, translate values).
2. Import it in `src/i18n/index.js` and add to `resources`.
3. In `src/i18n/languages.js`, set that language’s `enabled: true` (and `dir: 'rtl'` or `'ltr'`).

Until a locale JSON is filled, i18next falls back to English. Switcher only shows `enabled: true` languages.
