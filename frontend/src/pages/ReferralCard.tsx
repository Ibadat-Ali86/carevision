/**
 * CareVision — Referral Card Page
 * Spec Reference: Section 4.5
 *
 * Entry paths:
 *   A) Via WoundAssess → navigate('/referral', { state: ReferralState })
 *      → auto-generates card on mount using state data.
 *   B) Direct navigation (e.g. from Home feature grid)
 *      → renders a manual entry form so the CHW can still generate a card.
 *
 * API contract: POST /referral/ expects ReferralRequest (see types/analysis.ts).
 * The backend returns a ReferralCard with pre-built wa.me deep link (already
 * URL-encoded) — do NOT re-encode the whatsapp_message field.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Smartphone, Copy, Check, Send, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { generateReferral } from '@/api/endpoints';
import { LoadingState } from '@/components/shared/LoadingState';
import { useSettingsStore } from '@/store/settingsStore';
import type { SeverityLevel, ReferralResponse } from '@/types/analysis';

// ---------------------------------------------------------------------------
// State shape injected by WoundAssess navigate() call
// Keys match WoundAssess.tsx handleGenerateReferral exactly.
// ---------------------------------------------------------------------------
interface ReferralState {
  urgency: SeverityLevel;
  patientSummary: string;
  clinicalReason: string;
  facilityTypeNeeded: string;
}

// ---------------------------------------------------------------------------
// Utility: Copy-to-clipboard button
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={() => void handleCopy()}
      type="button"
      className="btn-secondary"
      style={{ padding: '6px 12px', minHeight: 'auto', fontSize: '0.75rem' }}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Utility: Urgency badge
// ---------------------------------------------------------------------------
function UrgencyBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        backgroundColor: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Standalone manual entry form — shown when user arrives without WoundAssess state
// ---------------------------------------------------------------------------
interface ManualFormProps {
  onSubmit: (values: ReferralState) => void;
  loading: boolean;
}

function ManualReferralForm({ onSubmit, loading }: ManualFormProps) {
  const [urgency, setUrgency] = useState<SeverityLevel>(2);
  const [patientSummary, setPatientSummary] = useState('');
  const [clinicalReason, setClinicalReason] = useState('');
  const [facilityTypeNeeded, setFacilityTypeNeeded] = useState('');

  const URGENCY_OPTIONS: { value: SeverityLevel; label: string; color: string }[] = [
    { value: 1, label: '1 — Routine',      color: '#27A769' },
    { value: 2, label: '2 — Non-urgent',   color: '#F4A819' },
    { value: 3, label: '3 — Semi-urgent',  color: '#E07B00' },
    { value: 4, label: '4 — Urgent',       color: '#D64045' },
    { value: 5, label: '5 — EMERGENCY',    color: '#9B1B30' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientSummary.trim() || !clinicalReason.trim() || !facilityTypeNeeded.trim()) return;
    onSubmit({ urgency, patientSummary, clinicalReason, facilityTypeNeeded });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={18} style={{ color: 'var(--interactive-primary)' }} aria-hidden />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Manual Referral Entry
        </p>
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
        Complete a WoundAssess analysis to auto-fill this form, or enter details manually below.
      </p>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Urgency */}
        <div>
          <label htmlFor="urgency-select" style={labelStyle}>Urgency Level</label>
          <select
            id="urgency-select"
            value={urgency}
            onChange={e => setUrgency(Number(e.target.value) as SeverityLevel)}
            style={inputStyle}
          >
            {URGENCY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Patient Summary */}
        <div>
          <label htmlFor="patient-summary" style={labelStyle}>Patient Summary</label>
          <input
            id="patient-summary"
            type="text"
            value={patientSummary}
            onChange={e => setPatientSummary(e.target.value)}
            placeholder="e.g. Wound: Laceration on left forearm"
            required
            style={inputStyle}
          />
        </div>

        {/* Clinical Reason */}
        <div>
          <label htmlFor="clinical-reason" style={labelStyle}>Clinical Reason for Referral</label>
          <textarea
            id="clinical-reason"
            value={clinicalReason}
            onChange={e => setClinicalReason(e.target.value)}
            placeholder="Describe the clinical rationale for this referral..."
            required
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Facility Type Needed */}
        <div>
          <label htmlFor="facility-type" style={labelStyle}>Facility / Action Needed</label>
          <input
            id="facility-type"
            type="text"
            value={facilityTypeNeeded}
            onChange={e => setFacilityTypeNeeded(e.target.value)}
            placeholder="e.g. Refer to district hospital for suturing"
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !patientSummary.trim() || !clinicalReason.trim() || !facilityTypeNeeded.trim()}
          style={{ marginTop: '0.5rem' }}
        >
          <Send size={16} aria-hidden />
          {loading ? 'Generating…' : 'Generate Referral Card'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generated referral card display
// ---------------------------------------------------------------------------
function ReferralCardDisplay({ card }: { card: ReferralResponse }) {
  return (
    <div className="space-y-4">
      {/* Header with urgency badge */}
      <div className="card" style={{ borderLeft: `4px solid ${card.urgency_color}` }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
            CLINICAL REFERRAL
          </p>
          <UrgencyBadge label={card.urgency_label} color={card.urgency_color} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>PATIENT</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{card.patient_summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>CLINICAL REASON</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{card.clinical_reason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>FACILITY NEEDED</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{card.facility_type_needed}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>REFERRED BY</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{card.referring_chw}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          {/* Copy full card text for clipboard sharing */}
          <CopyButton
            text={[
              `REFERRAL CARD [${card.urgency_label}]`,
              `Patient: ${card.patient_summary}`,
              `Reason: ${card.clinical_reason}`,
              `Facility: ${card.facility_type_needed}`,
              `CHW: ${card.referring_chw}`,
              '',
              card.disclaimer,
            ].join('\n')}
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={20} aria-hidden style={{ color: '#25D366' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp Message</p>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          {/* Display human-readable SMS text as preview — the whatsapp_message field is the deep link */}
          {card.sms_message}
        </p>
        <div className="flex gap-3">
          {/* whatsapp_message is already a full wa.me URL — do NOT re-encode */}
          <a
            href={card.whatsapp_message}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={16} aria-hidden /> Share via WhatsApp
          </a>
          <CopyButton text={card.sms_message} />
        </div>
      </div>

      {/* SMS */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={20} aria-hidden style={{ color: 'var(--interactive-secondary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>SMS Message</p>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          {card.sms_message}
        </p>
        <div className="flex gap-3">
          <a href={`sms:?body=${encodeURIComponent(card.sms_message)}`} className="btn-primary">
            <Smartphone size={16} aria-hidden /> Open SMS
          </a>
          <CopyButton text={card.sms_message} />
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)', padding: '0 1rem' }}>
        {card.disclaimer}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------
export default function ReferralCard() {
  const location = useLocation();
  const state = location.state as ReferralState | null;
  const { language: _language } = useSettingsStore(); // reserved for future i18n pass-through
  const [card, setCard] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate when navigated from WoundAssess with pre-filled state
  useEffect(() => {
    if (!state) return;
    void generateCard(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateCard = async (values: ReferralState) => {
    setLoading(true);
    setError(null);
    setCard(null);
    try {
      const result = await generateReferral({
        patient_summary: values.patientSummary,
        urgency: values.urgency,
        clinical_reason: values.clinicalReason,
        facility_type_needed: values.facilityTypeNeeded,
      });
      setCard(result);
    } catch (err) {
      // Surface actionable message — do not leak backend detail
      setError('Failed to generate referral card. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle="Referral Card" />
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Referral Card Generator
        </h1>

        {/* Error state */}
        {error && (
          <div className="card mb-4" style={{ borderLeft: '4px solid var(--status-danger)' }}>
            <p style={{ color: 'var(--status-danger)', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingState message="Generating referral card…" />}

        {/* Result */}
        {!loading && card && <ReferralCardDisplay card={card} />}

        {/* Manual form: shown when no auto-state OR after result (allow re-generation) */}
        {!loading && !card && (
          <ManualReferralForm onSubmit={generateCard} loading={loading} />
        )}
      </PageContainer>
      <Footer />
    </div>
  );
}
