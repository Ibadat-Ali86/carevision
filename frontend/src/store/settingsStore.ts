/**
 * CareVision — Zustand Settings Store
 * Spec Reference: Section 4.5 (Settings Page), Section 5.1 (Onboarding)
 *
 * Persists: language preference, consent default, onboarding state.
 * Storage: localStorage (survives app restarts; cleared by user in Settings).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LanguageCode } from '@/types/app';
import { DEFAULT_LANGUAGE } from '@/constants/languages';

interface SettingsStore {
  /** Current UI language — auto-detected from browser on first load */
  language: LanguageCode;
  /** Whether onboarding has been completed (localStorage flag per Spec 5.1) */
  onboardingCompleted: boolean;
  /** Remembered consent state (user preference, not per-session) */
  defaultConsent: boolean;

  // Actions
  setLanguage: (lang: LanguageCode) => void;
  setOnboardingCompleted: () => void;
  setDefaultConsent: (value: boolean) => void;
  resetSettings: () => void;
}

const getInitialLanguage = (): LanguageCode => {
  // Auto-detect from browser language (Spec Section 4.1 Language Selector)
  const browserLang = navigator.language.split('-')[0] as LanguageCode;
  const supported: LanguageCode[] = [
    'en','fr','es','pt','sw','ha','am','ar','hi','bn','id','tl','vi','my','km'
  ];
  return supported.includes(browserLang) ? browserLang : DEFAULT_LANGUAGE;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      language: getInitialLanguage(),
      onboardingCompleted: false,
      defaultConsent: false,

      setLanguage: (lang) => set({ language: lang }),
      setOnboardingCompleted: () => set({ onboardingCompleted: true }),
      setDefaultConsent: (value) => set({ defaultConsent: value }),
      resetSettings: () =>
        set({
          language: getInitialLanguage(),
          onboardingCompleted: false,
          defaultConsent: false,
        }),
    }),
    {
      name: 'carevision-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
