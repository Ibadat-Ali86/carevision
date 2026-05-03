/**
 * CareVision — Protocol Assistant Page (Enhanced)
 * Phase 3 of UX improvements per carevision-ux-improvements.md
 *
 * PRESERVED: All existing functionality:
 *   - Voice input (SpeechRecognition API)
 *   - Context passing from analysis pages (image_b64, context)
 *   - Suggested prompts grid
 *   - Source notes and per-message disclaimers
 *   - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 *
 * ENHANCED:
 *   - Trust indicator header (gradient avatar + WHO badge)
 *   - Framer Motion entrance animations on messages
 *   - Animated typing dots for loading state
 *   - Suggested question cards with hover border animation
 *   - Message timestamps displayed on assistant replies
 *   - Persistent scrolling to latest message
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send, Stethoscope, Image as ImageIcon, Mic, MicOff,
  Sparkles, Shield, BookOpen, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { MedicalDisclaimer } from '@/components/disclaimer/MedicalDisclaimer';
import { queryProtocol } from '@/api/endpoints';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from 'react-i18next';

// Web Speech API type augmentation — not in standard TS lib
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source_note?: string;
  disclaimer?: string;
  isLoading?: boolean;
  timestamp: Date;
}

// Category icons for suggested prompts
const SUGGESTED_PROMPTS = [
  {
    question: 'What is the WHO protocol for severe malaria treatment?',
    icon: <AlertCircle size={15} aria-hidden />,
  },
  {
    question: 'How do I manage a child with acute malnutrition?',
    icon: <BookOpen size={15} aria-hidden />,
  },
  {
    question: 'What are the signs of obstetric emergency?',
    icon: <Shield size={15} aria-hidden />,
  },
  {
    question: 'When should I refer a patient with respiratory distress?',
    icon: <AlertCircle size={15} aria-hidden />,
  },
];

// ── Animated typing indicator ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 150, 300].map((delay, i) => (
        <span
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--interactive-primary)',
            display: 'inline-block',
            animation: `statusDot 1.4s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          marginLeft: '4px',
        }}
      >
        Consulting protocols...
      </span>
    </div>
  );
}

export default function ProtocolAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { language } = useSettingsStore();
  const { t } = useTranslation();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check SpeechRecognition availability (Chromium-only)
  const speechSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  // Extract optional context passed from AnalysisPage
  const state = location.state as { image_b64?: string; context?: string } | null;
  const image_b64 = state?.image_b64;
  const context = state?.context;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      const loadingMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await queryProtocol({
          query: question,
          language,
          image_b64,
          context,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading
              ? {
                  ...m,
                  content: res.answer,
                  source_note: res.source_note,
                  disclaimer: res.disclaimer,
                  isLoading: false,
                }
              : m
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `Error: ${err.message}`
            : 'Unable to reach the protocol assistant. Please check your connection and try again.';
        setMessages((prev) =>
          prev.map((m) =>
            m.isLoading ? { ...m, content: errorMessage, isLoading: false } : m
          )
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, language, image_b64, context]
  );

  // Voice input — starts/stops SpeechRecognition
  const toggleListening = useCallback(() => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language === 'en' ? 'en-US' : language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [speechSupported, isListening, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Header showBackButton backRoute="/" pageTitle={t('protocol_title')} />

      {/* Full-height chat container */}
      <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
        <PageContainer className="flex-1 flex flex-col">

          {/* ── Trust indicator header ────────────────────────────────────── */}
          <div
            className="mb-4 rounded-xl"
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Gradient avatar */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0A6E5C 0%, #2C5F8D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden
            >
              <Sparkles size={18} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.125rem',
                }}
              >
                Clinical Protocol Assistant
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <Shield
                  size={11}
                  style={{ color: '#2C5F8D' }}
                  aria-hidden
                />
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                  }}
                >
                  Powered by WHO guidelines and regional health protocols
                </span>
              </div>
            </div>
          </div>

          {/* ── Messages area ─────────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto space-y-4"
            style={{ paddingBottom: 'var(--space-4)' }}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 ? (
              /* ── Empty state — suggested prompts ── */
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="py-6"
              >
                {/* Hero icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0A6E5C 0%, #2C5F8D 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-hidden
                  >
                    <Stethoscope size={28} style={{ color: '#FFFFFF' }} />
                  </div>
                </div>

                <h2
                  className="text-2xl font-bold text-center mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Ask About Clinical Protocols
                </h2>
                <p
                  className="text-sm text-center mb-2"
                  style={{ color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto 0.5rem' }}
                >
                  WHO treatment guidelines, emergency protocols, medication dosing, and
                  community health best practices.
                </p>

                {/* Context indicator */}
                {context && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <ImageIcon
                        size={13}
                        style={{ color: 'var(--interactive-primary)' }}
                        aria-hidden
                      />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        Analysis context attached
                      </span>
                    </div>
                  </div>
                )}

                {/* Suggested question cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07, duration: 0.25 }}
                      onClick={() => void sendMessage(prompt.question)}
                      type="button"
                      className="text-left rounded-lg text-sm transition-all"
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        transition: 'border-color 150ms ease, background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#0A6E5C';
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(10,110,92,0.04)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-elevated)';
                      }}
                      aria-label={prompt.question}
                    >
                      <span
                        style={{
                          color: 'var(--interactive-primary)',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                      >
                        {prompt.icon}
                      </span>
                      <span style={{ lineHeight: '1.5' }}>{prompt.question}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Protocol disclaimer */}
                <div className="mt-6">
                  <MedicalDisclaimer context="protocol" variant="compact" />
                </div>
              </motion.div>
            ) : (
              /* ── Message thread ── */
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant avatar */}
                    {msg.role === 'assistant' && (
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0A6E5C 0%, #2C5F8D 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '4px',
                        }}
                        aria-hidden
                      >
                        <Sparkles size={14} style={{ color: '#FFFFFF' }} />
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: 'var(--space-4)',
                        borderRadius:
                          msg.role === 'user'
                            ? '1rem 1rem 0.25rem 1rem'
                            : '1rem 1rem 1rem 0.25rem',
                        backgroundColor:
                          msg.role === 'user'
                            ? 'var(--interactive-primary)'
                            : 'var(--bg-elevated)',
                        color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                        border:
                          msg.role === 'assistant'
                            ? '1px solid var(--border-default)'
                            : 'none',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {msg.isLoading ? (
                        <TypingDots />
                      ) : (
                        <>
                          <p style={{ fontSize: '0.875rem', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </p>

                          {/* Timestamp — only on assistant messages */}
                          {msg.role === 'assistant' && (
                            <p
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--text-tertiary)',
                                marginTop: '0.375rem',
                              }}
                            >
                              {formatTime(msg.timestamp)}
                            </p>
                          )}

                          {/* Source note */}
                          {msg.source_note && (
                            <div
                              style={{
                                marginTop: '0.75rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid var(--border-subtle)',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  color: 'var(--text-tertiary)',
                                  marginBottom: '0.25rem',
                                }}
                              >
                                Source Note
                              </p>
                              <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                                {msg.source_note}
                              </p>
                            </div>
                          )}

                          {/* Per-message disclaimer */}
                          {msg.disclaimer && (
                            <p
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--text-tertiary)',
                                fontStyle: 'italic',
                                marginTop: '0.5rem',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid var(--border-subtle)',
                              }}
                            >
                              {msg.disclaimer}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </PageContainer>

        {/* ── Input area — fixed at bottom ─────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-elevated)',
            padding: 'var(--space-4)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 items-end mx-auto"
            style={{ maxWidth: '800px' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening ? 'Listening… speak now' : 'Ask a clinical protocol question…'
              }
              className="flex-1 resize-none rounded-lg text-sm"
              rows={1}
              maxLength={1000}
              aria-label="Message input"
              style={{
                padding: '10px 14px',
                border: `1px solid ${
                  isListening ? 'rgba(239,68,68,0.6)' : 'var(--border-default)'
                }`,
                backgroundColor: isListening
                  ? 'rgba(239,68,68,0.04)'
                  : 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                minHeight: '44px',
                maxHeight: '120px',
                overflowY: 'auto',
                transition: 'border-color 200ms ease, background-color 200ms ease',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />

            {/* Voice input button — only when SpeechRecognition is available */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className="flex-shrink-0"
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                title={isListening ? 'Stop listening' : 'Speak your question'}
                style={{
                  width: '44px',
                  height: '44px',
                  padding: 0,
                  borderRadius: '0.5rem',
                  border: `1px solid ${
                    isListening ? 'rgba(239,68,68,0.4)' : 'var(--border-default)'
                  }`,
                  backgroundColor: isListening
                    ? 'rgba(239,68,68,0.08)'
                    : 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                }}
              >
                {isListening ? (
                  <MicOff
                    size={18}
                    aria-hidden
                    style={{ color: '#EF4444' }}
                    className="animate-pulse-slow"
                  />
                ) : (
                  <Mic
                    size={18}
                    aria-hidden
                    style={{ color: 'var(--text-secondary)' }}
                  />
                )}
              </button>
            )}

            <button
              type="submit"
              className="btn-primary flex-shrink-0"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              style={{ width: '44px', height: '44px', padding: 0 }}
            >
              <Send size={18} aria-hidden />
            </button>
          </form>

          <p
            className="text-xs text-center mt-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {speechSupported
              ? 'Press Enter to send · Shift+Enter for new line · Mic button for voice input'
              : 'Press Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
