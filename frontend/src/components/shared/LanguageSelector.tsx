/**
 * CareVision — LanguageSelector (Shared Component)
 * Spec Reference: Section 4.1 (Language Selector), Section 2.8 (Radix Select)
 *
 * Dropdown showing 15 supported languages.
 * Persists selection to Zustand settings store.
 * Updates i18n locale immediately on change.
 */

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Globe } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { LANGUAGES } from '@/constants/languages';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '@/types/app';

export function LanguageSelector() {
  const { language, setLanguage } = useSettingsStore();
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    const lang = value as LanguageCode;
    setLanguage(lang);
    void i18n.changeLanguage(lang);
  };

  const current = LANGUAGES.find(l => l.code === language);

  return (
    <SelectPrimitive.Root value={language} onValueChange={handleChange}>
      <SelectPrimitive.Trigger
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors"
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          minHeight: '40px',
          cursor: 'pointer',
        }}
        aria-label="Select language"
      >
        <Globe size={16} aria-hidden style={{ color: 'var(--interactive-primary)' }} />
        <SelectPrimitive.Value>
          {current?.name || 'English'}
        </SelectPrimitive.Value>
        <ChevronDown size={16} aria-hidden style={{ color: 'var(--text-tertiary)' }} />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="rounded-lg shadow-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            maxHeight: '320px',
          }}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1" />
          <SelectPrimitive.Viewport style={{ padding: '4px' }}>
            {LANGUAGES.map(lang => (
              <SelectPrimitive.Item
                key={lang.code}
                value={lang.code}
                className="flex items-center gap-3 rounded-md text-sm cursor-pointer outline-none"
                style={{
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                }}
              >
                <SelectPrimitive.ItemText>
                  {lang.name}
                  <span
                    className="ml-2 text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {lang.nameEn}
                  </span>
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1" />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export default LanguageSelector;
