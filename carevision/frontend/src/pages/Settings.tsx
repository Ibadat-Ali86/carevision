/**
 * CareVision — Settings Page
 * Spec Reference: Section 4.5
 *
 * 3 sections:
 *   1. Language Preferences — language dropdown
 *   2. Offline Data Management — queue status, clear, retry
 *   3. About — version, license, links
 */

import React, { useState } from 'react';
import { Globe, Database, Info, Trash2, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useSettingsStore } from '@/store/settingsStore';
import { validateLocationCode } from '@/utils/validators';
import { format } from 'date-fns';

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg mb-6"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center gap-3"
        style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <Icon size={20} aria-hidden style={{ color: 'var(--interactive-primary)' }} />
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: 'var(--space-6)' }}>{children}</div>
    </section>
  );
}

export default function Settings() {
  const { items, pendingCount, isLoading, refresh, retryItem, discardItem, clearAll } =
    useOfflineQueue();
  const { locationCode, setLocationCode } = useSettingsStore();
  const [locationInput, setLocationInput] = useState(locationCode);
  const [locationError, setLocationError] = useState('');

  const handleLocationSave = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !validateLocationCode(trimmed)) {
      setLocationError('Use only letters, numbers, hyphens, or underscores (max 50 chars)');
      return;
    }
    setLocationError('');
    setLocationCode(trimmed);
  };

  const pendingItems = items.filter(i => i.status === 'pending' || i.status === 'retrying');
  const failedItems  = items.filter(i => i.status === 'failed');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle="Settings" />

      <PageContainer>
        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: 'var(--text-primary)' }}
        >
          Settings
        </h1>

        {/* 1. Language Preferences */}
        <SectionCard icon={Globe} title="Language Preferences">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Response Language
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                AI analysis results and protocol answers will be in this language.
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <LanguageSelector />
            </div>
          </div>
        </SectionCard>

        {/* 1b. Location Code */}
        <SectionCard icon={MapPin} title="Location Code">
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Your CHW location identifier. Used to load your encounter history from the Patient Log.
            Ask your supervisor if unsure (e.g. &quot;DISTRICT_01&quot;, &quot;KIGALI_CHW_05&quot;).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={e => { setLocationInput(e.target.value); setLocationError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLocationSave()}
              placeholder="e.g. DISTRICT_01"
              maxLength={50}
              aria-label="Location code"
              aria-describedby={locationError ? 'location-error' : undefined}
              className="flex-1 text-sm rounded-lg"
              style={{
                padding: '9px 12px',
                border: `1px solid ${locationError ? 'rgba(239,68,68,0.6)' : 'var(--border-default)'}`,
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleLocationSave}
              className="btn-primary"
              style={{ minHeight: 'auto', padding: '9px 16px', fontSize: '0.8125rem' }}
            >
              Save
            </button>
          </div>
          {locationError && (
            <p id="location-error" className="text-xs mt-1" style={{ color: '#B91C1C' }}>
              {locationError}
            </p>
          )}
          {locationCode && !locationError && (
            <p className="text-xs mt-1" style={{ color: '#0A6E5C' }}>
              Active: <span className="font-mono font-semibold">{locationCode}</span>
            </p>
          )}
        </SectionCard>

        {/* 2. Offline Data Management */}
        <SectionCard icon={Database} title="Offline Data Management">
          <div className="space-y-4">
            {/* Queue summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Pending Sync Items
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {isLoading
                    ? 'Loading...'
                    : pendingCount === 0
                      ? 'All items synced'
                      : `${pendingCount} item${pendingCount > 1 ? 's' : ''} waiting to sync`}
                </p>
              </div>
              <button
                onClick={() => void refresh()}
                className="btn-secondary"
                type="button"
                aria-label="Refresh queue"
              >
                <RefreshCw size={16} aria-hidden />
                Refresh
              </button>
            </div>

            {/* Failed items — actionable */}
            {failedItems.length > 0 && (
              <div
                className="rounded-md"
                style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <AlertCircle size={16} aria-hidden style={{ color: '#B91C1C' }} />
                  <p className="text-sm font-medium" style={{ color: '#B91C1C' }}>
                    Failed Items ({failedItems.length})
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {failedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                          {item.analysisType}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {format(item.timestamp, 'MMM d, HH:mm')} &middot; {item.retryCount} retries
                        </p>
                        {item.errorMessage && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#B91C1C' }}>
                            {item.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => item.id !== undefined && void retryItem(item.id)}
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '6px 10px', minHeight: 'auto', fontSize: '0.75rem' }}
                        >
                          <RefreshCw size={14} aria-hidden />
                          Retry
                        </button>
                        <button
                          onClick={() => item.id !== undefined && void discardItem(item.id)}
                          type="button"
                          className="btn-danger"
                          style={{ padding: '6px 10px', minHeight: 'auto', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending items */}
            {pendingItems.length > 0 && (
              <div
                className="rounded-md text-sm divide-y"
                style={{
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                {pendingItems.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <p className="capitalize font-medium">{item.analysisType}</p>
                    <span
                      className="text-xs rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#2C5F8D',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Clear all */}
            {items.length > 0 && (
              <button
                onClick={() => void clearAll()}
                type="button"
                className="btn-danger w-full"
              >
                <Trash2 size={16} aria-hidden />
                Clear All Offline Data
              </button>
            )}
          </div>
        </SectionCard>

        {/* 3. About */}
        <SectionCard icon={Info} title="About CareVision">
          <div className="space-y-3">
            {[
              ['Version', '1.0.0'],
              ['License', 'Apache 2.0'],
              ['AI Model', 'Gemma 4 (Google)'],
              ['Backend', 'FastAPI + Neon PostgreSQL'],
              ['Storage', 'Cloudflare R2'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
          <p
            className="text-xs mt-6 leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            CareVision is intended to support, not replace, the clinical judgment
            of qualified healthcare workers. All AI-generated guidance should be
            validated against local health protocols and professional supervision.
          </p>
        </SectionCard>
      </PageContainer>

      <Footer />
    </div>
  );
}
