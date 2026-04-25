/**
 * CareVision — App Root
 * Spec Reference: Section 2.8 (Routing), Section 8.1 (App Entry)
 *
 * Provider hierarchy (outermost first):
 *   ErrorBoundary → QueryClientProvider → BrowserRouter
 *
 * Global elements:
 *   - OfflineIndicator (fixed, below header)
 *   - Suspense fallback for lazy-loaded pages
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';

// Lazy-load all pages for PWA code-splitting (reduces initial bundle)
const Home              = lazy(() => import('@/pages/Home'));
const Onboarding        = lazy(() => import('@/pages/Onboarding'));
const TestStrip         = lazy(() => import('@/pages/TestStrip'));
const MedScan           = lazy(() => import('@/pages/MedScan'));
const WoundAssess       = lazy(() => import('@/pages/WoundAssess'));
const DocReader         = lazy(() => import('@/pages/DocReader'));
const ProtocolAssistant = lazy(() => import('@/pages/ProtocolAssistant'));
const Settings          = lazy(() => import('@/pages/Settings'));
const PatientLog        = lazy(() => import('@/pages/PatientLog'));
const ReferralCard      = lazy(() => import('@/pages/ReferralCard'));

// WHY 30s staleTime: Analysis results are immutable once created.
// Setting staleTime prevents redundant refetches on window focus.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function PageFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 rounded-full animate-pulse-slow"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--interactive-primary)',
            opacity: 0.3,
          }}
        />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* Global offline status — fixed position, below 64px header */}
          <OfflineIndicator />

          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/onboarding"  element={<Onboarding />} />
              <Route path="/teststrip"   element={<TestStrip />} />
              <Route path="/medscan"     element={<MedScan />} />
              <Route path="/woundassess" element={<WoundAssess />} />
              <Route path="/docreader"   element={<DocReader />} />
              <Route path="/protocol"    element={<ProtocolAssistant />} />
              <Route path="/settings"    element={<Settings />} />
              <Route path="/log"         element={<PatientLog />} />
              <Route path="/referral"    element={<ReferralCard />} />

              {/* 404 fallback */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>404</h1>
                    <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>Page not found</p>
                    <a href="/" className="btn-primary inline-flex">Go Home</a>
                  </div>
                </div>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
