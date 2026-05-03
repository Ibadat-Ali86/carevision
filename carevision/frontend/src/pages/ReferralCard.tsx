/**
 * CareVision — Referral Card Page
 * Spec Reference: Section 4.5
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Smartphone, Copy, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { generateReferral } from '@/api/endpoints';
import { LoadingState } from '@/components/shared/LoadingState';
import { useSettingsStore } from '@/store/settingsStore';
import type { SeverityLevel } from '@/types/analysis';

interface ReferralState {
  severity: SeverityLevel;
  woundType: string;
  severityRationale: string;
  recommendedAction: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={() => void handleCopy()} type="button" className="btn-secondary"
      style={{ padding: '6px 12px', minHeight: 'auto', fontSize: '0.75rem' }}>
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function ReferralCard() {
  const location = useLocation();
  const state = location.state as ReferralState | null;
  const { language } = useSettingsStore();
  const [referralText, setReferralText] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [smsMsg, setSmsMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    setLoading(true);
    generateReferral({
      severity: state.severity,
      wound_type: state.woundType,
      severity_rationale: state.severityRationale,
      recommended_action: state.recommendedAction,
      language,
    }).then(res => {
      setReferralText(res.referral_text);
      setWhatsappMsg(res.whatsapp_message);
      setSmsMsg(res.sms_message);
    }).catch(() => setError('Failed to generate referral. Please try again.'))
      .finally(() => setLoading(false));
  }, [state, language]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle="Referral Card" />
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Referral Card</h1>
        {!state ? (
          <div className="card text-center py-10">
            <p style={{ color: 'var(--text-secondary)' }}>No referral data. Complete a WoundAssess analysis first.</p>
          </div>
        ) : loading ? (
          <LoadingState message="Generating referral card..." />
        ) : error ? (
          <div className="card"><p style={{ color: 'var(--status-danger)' }}>{error}</p></div>
        ) : (
          <div className="space-y-4">
            <div className="card">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>CLINICAL REFERRAL</p>
              <pre className="text-sm whitespace-pre-wrap leading-relaxed font-mono" style={{ color: 'var(--text-primary)' }}>{referralText}</pre>
              <div className="mt-4 flex justify-end"><CopyButton text={referralText} /></div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={20} aria-hidden style={{ color: '#25D366' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp Message</p>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{whatsappMsg}</p>
              <div className="flex gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`} target="_blank" rel="noopener noreferrer"
                  className="btn-primary" style={{ backgroundColor: '#25D366' }}>
                  <MessageCircle size={16} aria-hidden /> Share via WhatsApp
                </a>
                <CopyButton text={whatsappMsg} />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone size={20} aria-hidden style={{ color: 'var(--interactive-secondary)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>SMS Message</p>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{smsMsg}</p>
              <div className="flex gap-3">
                <a href={`sms:?body=${encodeURIComponent(smsMsg)}`} className="btn-primary">
                  <Smartphone size={16} aria-hidden /> Open SMS
                </a>
                <CopyButton text={smsMsg} />
              </div>
            </div>
          </div>
        )}
      </PageContainer>
      <Footer />
    </div>
  );
}
