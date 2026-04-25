/**
 * CareVision — FeatureCard (Features Component)
 * Spec Reference: Section 3.2.2
 *
 * Navigation card for the Home page feature grid.
 * Content structure:
 *   1. Icon container (colored bg, 48px icon)
 *   2. Feature Name (H3, semibold)
 *   3. Description (2 lines max, text-secondary)
 *   4. Arrow (bottom-right, animates on hover)
 *
 * Hover: translateY(-3px) + shadow-lg + teal border accent
 * Focus: 3px teal ring
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Pill, Heart, FileText, Stethoscope, ClipboardList, Share2 } from 'lucide-react';
import type { Feature } from '@/types/app';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardCheck,
  Pill,
  Heart,
  FileText,
  Stethoscope,
  ClipboardList,
  Share2,
};

interface FeatureCardProps {
  feature: Feature;
  animationDelay?: number;
}

export function FeatureCard({ feature, animationDelay = 0 }: FeatureCardProps) {
  const IconComponent = ICON_MAP[feature.iconName] ?? FileText;

  return (
    <Link
      to={feature.route}
      className="group"
      aria-label={`${feature.name} — ${feature.description}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)',
        minHeight: '160px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 200ms ease-in-out, transform 200ms ease-in-out, border-color 200ms ease-in-out',
        animation: `cardEntrance 400ms ease-out ${animationDelay}ms both`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.boxShadow = '0 12px 28px -5px rgb(0 0 0 / 0.12), 0 6px 10px -5px rgb(0 0 0 / 0.07)';
        el.style.transform = 'translateY(-3px)';
        el.style.borderColor = feature.color;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.boxShadow = '0 1px 3px rgb(0 0 0 / 0.06)';
        el.style.transform = 'translateY(0)';
        el.style.borderColor = '#E2E8F0';
      }}
    >
      {/* Subtle color wash on hover (background accent) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          borderRadius: '0 0.75rem 0 80px',
          backgroundColor: feature.bgColor,
          opacity: 0.5,
          transition: 'opacity 200ms ease-in-out',
        }}
      />

      {/* Icon container */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: feature.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.875rem',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <IconComponent
          size={26}
          aria-hidden
          strokeWidth={1.75}
          style={{ color: feature.color }}
        />
      </div>

      {/* Feature Name */}
      <h3
        className="font-semibold mb-1.5"
        style={{
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          lineHeight: '1.3',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {feature.name}
      </h3>

      {/* Description */}
      <p
        className="line-clamp-2 flex-grow"
        style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.55',
          fontSize: '0.8125rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {feature.description}
      </p>

      {/* Arrow */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '0.75rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: feature.bgColor,
            transition: 'transform 200ms ease-in-out, background-color 200ms ease-in-out',
          }}
          className="group-hover:scale-110"
        >
          <ArrowRight
            size={14}
            aria-hidden
            style={{ color: feature.color }}
          />
        </div>
      </div>
    </Link>
  );
}

export default FeatureCard;
