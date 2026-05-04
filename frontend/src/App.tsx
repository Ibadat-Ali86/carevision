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

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

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
const Login             = lazy(() => import('@/pages/Login'));
const Register          = lazy(() => import('@/pages/Register'));
const Landing           = lazy(() => import('@/pages/Landing'));

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthChecking } = useAuthStore();
  const location = useLocation();

  if (isAuthChecking) {
    return <PageFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthChecking } = useAuthStore();

  if (isAuthChecking) {
    return <PageFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { language } = useSettingsStore();
  const { i18n } = useTranslation();
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useInactivityTimeout();

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Restore session from IndexedDB on app mount (non-blocking)
  useEffect(() => {
    void checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* Global offline status — fixed position, below 64px header */}
          <OfflineIndicator />

          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"            element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/onboarding"  element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/teststrip"   element={<ProtectedRoute><TestStrip /></ProtectedRoute>} />
              <Route path="/medscan"     element={<ProtectedRoute><MedScan /></ProtectedRoute>} />
              <Route path="/woundassess" element={<ProtectedRoute><WoundAssess /></ProtectedRoute>} />
              <Route path="/docreader"   element={<ProtectedRoute><DocReader /></ProtectedRoute>} />
              <Route path="/protocol"    element={<ProtectedRoute><ProtocolAssistant /></ProtectedRoute>} />
              <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/log"         element={<ProtectedRoute><PatientLog /></ProtectedRoute>} />
              <Route path="/referral"    element={<ProtectedRoute><ReferralCard /></ProtectedRoute>} />
              <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/landing"     element={<PublicRoute><Landing /></PublicRoute>} />

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
