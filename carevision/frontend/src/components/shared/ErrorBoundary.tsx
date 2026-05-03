/**
 * CareVision — ErrorBoundary (Shared Component)
 * Spec Reference: Section 2.9, Section 3.1 (Global Error Boundary Wrapper)
 *
 * WHY class component: React Error Boundaries can only be implemented as
 * class components (as of React 18). This is a known React constraint,
 * not a design preference.
 *
 * Catches unexpected runtime errors and renders a safe fallback UI.
 */

import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback — if omitted, uses default error UI */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to console in dev; in production, send to error monitoring service
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div
            className="rounded-lg text-center max-w-md w-full"
            style={{
              padding: 'var(--space-8)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <AlertTriangle
              size={48}
              className="mx-auto mb-4"
              aria-hidden
              style={{ color: 'var(--status-warning)' }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Something went wrong
            </h1>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              CareVision encountered an unexpected error. Your offline data is safe.
              Please reload the app.
            </p>
            <button onClick={this.handleReset} className="btn-primary w-full">
              <RefreshCw size={18} aria-hidden />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
