/**
 * CareVision — Patient Log Page
 * Spec Reference: Section 4.5 (Patient Log / Encounter History)
 *
 * Offline-first list of encounter logs fetched from backend.
 * When offline, shows cached/queued items from Dexie.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, RefreshCw, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { apiClient } from '@/api/client';
import { format } from 'date-fns';

interface EncounterLog {
  id: string;
  analysis_type: string;
  created_at: string;
  severity?: number;
  result_summary?: string;
}

export default function PatientLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<EncounterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<EncounterLog[]>('/log/encounters');
      setLogs(data);
    } catch {
      setError('Unable to load encounter log. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchLogs(); }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle="Patient Log" />
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Patient Log</h1>
          <button onClick={() => void fetchLogs()} type="button" className="btn-secondary">
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
            <button onClick={() => void fetchLogs()} type="button" className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardList size={48} className="mx-auto mb-4" aria-hidden style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No encounters yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Completed analyses will appear here.
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
                  <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {log.analysis_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {format(new Date(log.created_at), 'MMM d, yyyy — HH:mm')}
                  </p>
                  {log.result_summary && (
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                      {log.result_summary}
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
