import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import ha from './locales/ha.json';
import am from './locales/am.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import id from './locales/id.json';
import tl from './locales/tl.json';
import vi from './locales/vi.json';
import my from './locales/my.json';
import km from './locales/km.json';

// Static bundle of translations.
// Ideal for PWA offline capability, since Vite will bundle these automatically.
const resources = {
  en: { translation: en },
  fr: { translation: fr },
  sw: { translation: sw },
  es: { translation: es },
  pt: { translation: pt },
  ha: { translation: ha },
  am: { translation: am },
  ar: { translation: ar },
  hi: { translation: hi },
  bn: { translation: bn },
  id: { translation: id },
  tl: { translation: tl },
  vi: { translation: vi },
  my: { translation: my },
  km: { translation: km }
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
