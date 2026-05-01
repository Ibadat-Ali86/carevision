import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';

// Static bundle of translations.
// Ideal for PWA offline capability, since Vite will bundle these automatically.
const resources = {
  en: { translation: en },
  fr: { translation: fr },
  sw: { translation: sw }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from xss
    }
  });

export default i18n;
