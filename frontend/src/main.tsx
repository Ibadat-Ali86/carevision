/**
 * CareVision — Application Entry Point
 * Spec Reference: Section 8.1
 *
 * Initialises:
 *   1. i18next (internationalisation)
 *   2. React DOM root
 *   3. Service Worker registration (PWA)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import App from './App';
import './index.css';

// ---------------------------------------------------------------------------
// i18next initialisation — minimal setup, translations loaded lazily
// For production: add namespaced JSON files in public/locales/
// ---------------------------------------------------------------------------
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          app_title: 'CareVision',
        },
      },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// ---------------------------------------------------------------------------
// React 18 concurrent root
// ---------------------------------------------------------------------------
const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ---------------------------------------------------------------------------
// PWA Service Worker — vite-plugin-pwa provides the virtual module
// Only active in production to avoid stale cache during development
// ---------------------------------------------------------------------------
if (import.meta.env.PROD) {
  // Dynamic import prevents TypeScript errors if the virtual module
  // hasn't been generated yet (i.e., during development)
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: false });
  });
}
