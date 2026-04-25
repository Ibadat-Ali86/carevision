/**
 * CareVision — Language Constants
 * Spec Reference: Section 1.2, Section 8 (15 language codes)
 */

import type { LanguageOption } from '@/types/app';

// WHY: All 15 language codes are defined here as a constant to ensure
// the LanguageSelector, i18n config, and API requests share the same set.
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English',    nameEn: 'English' },
  { code: 'fr', name: 'Français',   nameEn: 'French' },
  { code: 'es', name: 'Español',    nameEn: 'Spanish' },
  { code: 'pt', name: 'Português',  nameEn: 'Portuguese' },
  { code: 'sw', name: 'Kiswahili',  nameEn: 'Swahili' },
  { code: 'ha', name: 'Hausa',      nameEn: 'Hausa' },
  { code: 'am', name: 'አማርኛ',      nameEn: 'Amharic' },
  { code: 'ar', name: 'العربية',    nameEn: 'Arabic' },
  { code: 'hi', name: 'हिन्दी',    nameEn: 'Hindi' },
  { code: 'bn', name: 'বাংলা',     nameEn: 'Bengali' },
  { code: 'id', name: 'Indonesia',  nameEn: 'Indonesian' },
  { code: 'tl', name: 'Filipino',   nameEn: 'Filipino' },
  { code: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese' },
  { code: 'my', name: 'မြန်မာ',    nameEn: 'Burmese' },
  { code: 'km', name: 'ខ្មែរ',     nameEn: 'Khmer' },
];

export const DEFAULT_LANGUAGE = 'en';

/** Build a lookup map for O(1) access by code */
export const LANGUAGE_MAP: Record<string, LanguageOption> = Object.fromEntries(
  LANGUAGES.map(l => [l.code, l])
);
