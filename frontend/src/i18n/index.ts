import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Minimal inline translations for the scaffolding.
// In a full production app, these would be separate JSON files.
const resources = {
  en: {
    translation: {
      "app_title": "CareVision",
      "test_strip_title": "RDT Analysis",
      "med_scan_title": "MedScan",
      "wound_assess_title": "Wound Assess",
      "doc_reader_title": "Document Reader",
      "protocol_title": "Protocol Assistant",
      "referral_title": "Referrals",
      "disclaimer_text": "CareVision provides AI-assisted analysis for informational purposes only. It is NOT a substitute for professional medical judgment. Always follow local clinical protocols.",
      "accept_disclaimer": "I understand and agree",
      "offline_mode": "Working Offline. Requests will sync when connected."
    }
  },
  fr: {
    translation: {
      "app_title": "CareVision",
      "test_strip_title": "Analyse TDR",
      "med_scan_title": "MedScan",
      "wound_assess_title": "Évaluation des plaies",
      "doc_reader_title": "Lecteur de documents",
      "protocol_title": "Assistant Protocole",
      "referral_title": "Références",
      "disclaimer_text": "CareVision fournit une analyse assistée par IA à des fins d'information uniquement. Il ne remplace PAS le jugement médical professionnel.",
      "accept_disclaimer": "Je comprends et j'accepte",
      "offline_mode": "Mode hors ligne. Les requêtes seront synchronisées une fois connecté."
    }
  },
  sw: {
    translation: {
      "app_title": "CareVision",
      "test_strip_title": "Uchambuzi wa RDT",
      "med_scan_title": "MedScan",
      "wound_assess_title": "Tathmini ya Kidonda",
      "doc_reader_title": "Msomaji wa Hati",
      "protocol_title": "Msaidizi wa Itifaki",
      "referral_title": "Rufaa",
      "disclaimer_text": "CareVision hutoa uchambuzi unaosaidiwa na AI kwa madhumuni ya habari tu. SIYO mbadala wa uamuzi wa kitaalamu wa matibabu.",
      "accept_disclaimer": "Ninaelewa na nakubali",
      "offline_mode": "Inafanya kazi Nje ya Mtandao."
    }
  }
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
