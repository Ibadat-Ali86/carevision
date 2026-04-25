/**
 * CareVision — Onboarding Page
 * Spec Reference: Section 5.1 (First-Time User Onboarding)
 *
 * 3-screen carousel:
 *   Screen 1 — Welcome
 *   Screen 2 — How It Works
 *   Screen 3 — Privacy & Safety
 *
 * Completion: Sets onboardingCompleted in Zustand store → redirects to Home.
 * Skip button available on all screens except last.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Stethoscope, Camera, Shield } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

const SCREENS = [
  {
    id: 0,
    icon: Stethoscope,
    iconColor: '#0A6E5C',
    iconBg: 'linear-gradient(135deg, #E6F7F4 0%, #B3E8DE 100%)',
    gradientRing: 'rgba(10, 110, 92, 0.2)',
    title: 'Welcome to CareVision',
    body: 'AI-powered clinical decision support designed for community health workers in low-resource settings.',
    subPoints: [] as string[],
    cta: 'Get Started',
  },
  {
    id: 1,
    icon: Camera,
    iconColor: '#2C5F8D',
    iconBg: 'linear-gradient(135deg, #E8F1F8 0%, #C1DAEB 100%)',
    gradientRing: 'rgba(44, 95, 141, 0.2)',
    title: 'How It Works',
    body: '',
    subPoints: [
      'Choose an analysis type from the home screen',
      'Photograph a clinical artifact using your camera',
      'Receive instant AI-powered guidance',
      'Export results or generate a referral card',
    ],
    cta: 'Next',
  },
  {
    id: 2,
    icon: Shield,
    iconColor: '#0A6E5C',
    iconBg: 'linear-gradient(135deg, #E6F7F4 0%, #B3E8DE 100%)',
    gradientRing: 'rgba(10, 110, 92, 0.2)',
    title: 'Your Privacy Matters',
    body: '',
    subPoints: [
      'Images are analyzed, never permanently stored',
      'No patient-identifiable data is saved',
      'Works fully offline — syncs when connection is restored',
      'Always consult supervisors for final clinical decisions',
    ],
    cta: 'Begin Using CareVision',
  },
] as const;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { setOnboardingCompleted } = useSettingsStore();
  const navigate = useNavigate();

  const handleComplete = () => {
    setOnboardingCompleted();
    navigate('/', { replace: true });
  };

  const handleNext = () => {
    if (currentStep < SCREENS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const screen = SCREENS[currentStep];
  const IconComponent = screen.icon;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #E6F7F4 0%, #F8FAFB 45%, #E8F1F8 100%)',
        padding: 'var(--space-6)',
      }}
    >
      {/* Card */}
      <div
        className="w-full"
        style={{
          maxWidth: '440px',
          animation: 'slideUpFadeIn 350ms cubic-bezier(0.4, 0, 0.2, 1) both',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '1.25rem',
            boxShadow: '0 20px 50px -10px rgba(10, 110, 92, 0.15), 0 8px 20px -5px rgba(0,0,0,0.1)',
            padding: '2.5rem 2rem',
            border: '1px solid rgba(10, 110, 92, 0.1)',
          }}
        >
          {/* Icon with decorative ring */}
          <div
            className="mx-auto mb-6"
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '24px',
              background: screen.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: `0 0 0 8px ${screen.gradientRing}, 0 4px 16px rgba(10,110,92,0.15)`,
            }}
          >
            <IconComponent
              size={40}
              aria-hidden
              style={{ color: screen.iconColor }}
              strokeWidth={1.5}
            />
          </div>

          {/* Step indicator */}
          <p
            className="text-center text-xs font-semibold mb-4"
            style={{
              color: 'var(--text-tertiary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Step {currentStep + 1} of {SCREENS.length}
          </p>

          {/* Title */}
          <h1
            className="text-center font-bold mb-4"
            style={{
              color: 'var(--text-primary)',
              fontSize: '1.5rem',
              lineHeight: '1.25',
              letterSpacing: '-0.01em',
            }}
          >
            {screen.title}
          </h1>

          {/* Body */}
          {screen.body && (
            <p
              className="text-center mb-6"
              style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.65',
                fontSize: '0.9375rem',
              }}
            >
              {screen.body}
            </p>
          )}

          {/* Sub-points */}
          {screen.subPoints.length > 0 && (
            <ul className="space-y-3 mb-6">
              {screen.subPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {/* Step number bubble */}
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(10, 110, 92, 0.1)',
                      border: '1px solid rgba(10, 110, 92, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#0A6E5C',
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.875rem', lineHeight: '1.55' }}>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA Button */}
          <button
            onClick={handleNext}
            type="button"
            className="btn-primary w-full"
            style={{
              width: '100%',
              justifyContent: 'center',
              height: '48px',
              fontSize: '0.9375rem',
              borderRadius: '0.75rem',
              marginBottom: 'var(--space-3)',
              background: 'linear-gradient(135deg, #0A6E5C 0%, #0F9D7E 100%)',
              boxShadow: '0 4px 14px rgba(10,110,92,0.35)',
            }}
          >
            {screen.cta}
            {currentStep < SCREENS.length - 1 && (
              <ChevronRight size={18} aria-hidden />
            )}
          </button>

          {/* Skip button */}
          {currentStep < SCREENS.length - 1 && (
            <button
              onClick={handleComplete}
              type="button"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 150ms ease-in-out',
                textAlign: 'center',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; }}
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div
          className="flex items-center justify-center gap-2 mt-6"
          aria-label="Onboarding progress"
        >
          {SCREENS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Step ${idx + 1} of ${SCREENS.length}`}
              aria-current={idx === currentStep ? 'step' : undefined}
              style={{
                width: idx === currentStep ? '28px' : '8px',
                height: '8px',
                borderRadius: '999px',
                backgroundColor: idx === currentStep
                  ? '#0A6E5C'
                  : idx < currentStep
                    ? 'rgba(10, 110, 92, 0.4)'
                    : '#CBD5E1',
                border: 'none',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: idx === currentStep ? '0 2px 6px rgba(10,110,92,0.4)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
