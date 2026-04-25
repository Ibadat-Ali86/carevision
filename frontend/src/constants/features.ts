/**
 * CareVision — Feature Metadata Constants
 * Spec Reference: Section 4.1 (Feature Grid), Section 3.2.2 (FeatureCard)
 *
 * Display order and content exactly as specified in the UX documentation.
 */

import type { Feature } from '@/types/app';

// WHY: Feature metadata is defined as a constant (not computed) so that
// the Home page, onboarding screens, and any future feature index pages
// all consume the same single source of truth.
export const FEATURES: Feature[] = [
  {
    id: 'teststrip',
    name: 'TestStrip Reader',
    description: 'Interpret rapid diagnostic test results instantly.',
    iconName: 'ClipboardCheck',
    route: '/teststrip',
    // Medical Teal — primary color (Spec 3.2.2)
    color: '#0A6E5C',
    bgColor: '#E6F7F4',
  },
  {
    id: 'medscan',
    name: 'MedScan',
    description: 'Identify medications from packaging and labels.',
    iconName: 'Pill',
    route: '/medscan',
    // Clinical Blue — secondary color (Spec 3.2.2)
    color: '#2C5F8D',
    bgColor: '#E8F1F8',
  },
  {
    id: 'woundassess',
    name: 'WoundAssess',
    description: 'Assess wound severity and get care guidance.',
    iconName: 'Heart',
    route: '/woundassess',
    // Amber — urgency signal (Spec 3.2.2)
    color: '#B45309',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'docreader',
    name: 'DocReader',
    description: 'Extract data from clinical documents and records.',
    iconName: 'FileText',
    route: '/docreader',
    // Neutral — documentation (Spec 3.2.2)
    color: '#334155',
    bgColor: '#F1F5F9',
  },
];

/** Full feature set including protocol, log, referral */
export const ALL_FEATURES: (Feature & { category: 'analysis' | 'workflow' })[] = [
  ...FEATURES.map(f => ({ ...f, category: 'analysis' as const })),
  {
    id: 'protocol',
    name: 'Protocol Assistant',
    description: 'WHO guideline Q&A powered by Gemma AI.',
    iconName: 'Stethoscope',
    route: '/protocol',
    color: '#2C5F8D',
    bgColor: '#E8F1F8',
    category: 'workflow' as const,
  },
  {
    id: 'log',
    name: 'Patient Log',
    description: 'Offline-first encounter documentation.',
    iconName: 'ClipboardList',
    route: '/log',
    color: '#334155',
    bgColor: '#F1F5F9',
    category: 'workflow' as const,
  },
  {
    id: 'referral',
    name: 'Referral Card',
    description: 'Generate WhatsApp and SMS referral messages.',
    iconName: 'Share2',
    route: '/referral',
    color: '#0A6E5C',
    bgColor: '#E6F7F4',
    category: 'workflow' as const,
  },
];
