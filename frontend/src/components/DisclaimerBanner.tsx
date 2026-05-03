import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settings';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  const { t } = useTranslation();
  const { disclaimerAccepted, setDisclaimerAccepted } = useSettingsStore();

  if (disclaimerAccepted) return null;

  return (
    <div className="bg-amber-100 border-b-4 border-amber-500 text-amber-900 p-4 shadow-md sticky top-0 z-50">
      <div className="container max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-amber-600" />
          <p className="text-sm font-medium leading-relaxed">
            {t('disclaimer_text')}
          </p>
        </div>
        <button
          onClick={() => setDisclaimerAccepted(true)}
          className="whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-colors w-full sm:w-auto"
        >
          {t('accept_disclaimer')}
        </button>
      </div>
    </div>
  );
}
