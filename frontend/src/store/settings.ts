import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  language: string;
  setLanguage: (lang: string) => void;
  disclaimerAccepted: boolean;
  setDisclaimerAccepted: (accepted: boolean) => void;
  locationCode: string;
  setLocationCode: (code: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      disclaimerAccepted: false,
      setDisclaimerAccepted: (disclaimerAccepted) => set({ disclaimerAccepted }),
      locationCode: 'DEFAULT_CLINIC_1',
      setLocationCode: (locationCode) => set({ locationCode }),
    }),
    {
      name: 'carevision-settings',
    }
  )
);
