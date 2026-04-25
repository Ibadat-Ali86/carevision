/**
 * CareVision — PageContainer (Layout Component)
 * Spec Reference: Section 2.4 (Layout Constraints), Section 3.1 (Component Hierarchy)
 *
 * Responsive max-width wrapper with correct horizontal padding per breakpoint.
 * All page content should be wrapped in this component.
 */

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  /** Additional class names for special pages */
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main
      id="main-content"
      role="main"
      className={`mx-auto w-full ${className}`}
      style={{
        maxWidth: '1280px',
        // Horizontal padding: 16px mobile → 24px tablet
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-4)',
        // Vertical padding: 24px mobile, 32px desktop
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-10)',
      }}
    >
      <div
        style={{
          // Content max-width for readability on large screens
          maxWidth: '680px',
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </main>
  );
}

export default PageContainer;
