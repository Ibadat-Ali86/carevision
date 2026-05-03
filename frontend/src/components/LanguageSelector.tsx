import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settings';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
  // Additional languages can be added here
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useSettingsStore();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <select
      value={language}
      onChange={handleLanguageChange}
      className="bg-transparent border border-slate-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-brand"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
