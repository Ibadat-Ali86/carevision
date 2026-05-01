/**
 * CareVision — Patient Log Page
 * Spec Reference: Section 4.5 (Patient Log / Encounter History)
 *
 * FIX: Was calling GET /log/encounters (404).
 * Now calls GET /log/{location_code} per the backend router spec.
 * location_code is read from settingsStore (user-configurable via Settings).
 *
 * Offline-first list of encounter logs fetched from backend.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, RefreshCw, ChevronRight, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { fetchEncounters } from '@/api/endpoints';
import type { EncounterLogRead } from '@/api/endpoints';
import { useSettingsStore } from '@/store/settingsStore';
import { format } from 'date-fns';

// Analysis type → human-readable label
const TYPE_LABEL: Record<string, string> = {
  teststrip:   'TestStrip Analysis',
  medscan:     'MedScan Analysis',
  woundassess: 'Wound Assessment',
  docreader:   'Document Reader',
};

export default function PatientLog() {
  const navigate = useNavigate();
  const { locationCode } = useSettingsStore();
  const [logs, setLogs] = useState<EncounterLogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doFetch = async () => {
    if (!locationCode) {
      setError('No location code set. Please configure it in Settings to view logs.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEncounters(locationCode);
      setLogs(data);
    } catch {
      setError('Unable to load encounter log. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void doFetch(); }, [locationCode]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle="Patient Log" />
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Patient Log</h1>
            {locationCode && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} aria-hidden />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {locationCode}
                </span>
              </div>
            )}
          </div>
          <button onClick={() => void doFetch()} type="button" className="btn-secondary">
            <RefreshCw size={16} aria-hidden /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="card text-center py-8">
            <p className="text-sm mb-4" style={{ color: 'var(--status-danger)' }}>{error}</p>
            {!locationCode ? (
              <button
                onClick={() => navigate('/settings')}
                type="button"
                className="btn-primary"
              >
                Open Settings
              </button>
            ) : (
              <button onClick={() => void doFetch()} type="button" className="btn-secondary">
                Try Again
              </button>
            )}
          </div>
        ) : logs.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardList size={48} className="mx-auto mb-4" aria-hidden style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No encounters yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Save analysis results using the &quot;Save to Log&quot; button to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div
                key={log.id}
                className="card flex items-center justify-between cursor-pointer hover-lift"
                onClick={() => navigate(`/log/${log.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/log/${log.id}`)}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {TYPE_LABEL[log.analysis_type] ?? log.analysis_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {format(new Date(log.created_at), 'MMM d, yyyy — HH:mm')}
                  </p>
                  {log.severity != null && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Severity {log.severity}
                    </p>
                  )}
                </div>
                <ChevronRight size={20} aria-hidden style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </PageContainer>
      <Footer />
    </div>
  );
}
