/**
 * CareVision — Protocol Assistant Page
 * Spec Reference: Section 4.4
 *
 * Full-height chat interface:
 * - Right-aligned user bubbles (teal)
 * - Left-aligned AI response bubbles (white)
 * - Suggested prompts in empty state
 * - Disclaimer appended to every AI response
 * - Scrolls to bottom on new message
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Stethoscope, Image as ImageIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { queryProtocol } from '@/api/endpoints';
import { useSettingsStore } from '@/store/settingsStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source_note?: string;
  disclaimer?: string;
  isLoading?: boolean;
}

const SUGGESTED_PROMPTS = [
  'What is the WHO protocol for severe malaria treatment?',
  'How do I manage a child with acute malnutrition?',
  'What are the signs of obstetric emergency?',
  'When should I refer a patient with respiratory distress?',
];

export default function ProtocolAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useSettingsStore();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question };
    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await queryProtocol({ 
        query: question, 
        language,
        // Always pass context if available for this session
        image_b64,
        context
      });
      setMessages(prev =>
        prev.map(m =>
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
      const errorMessage = err instanceof Error 
        ? `Error: ${err.message}` 
        : 'Unable to reach the protocol assistant. Please check your connection and try again.';
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? {
                ...m,
                content: errorMessage,
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, language]);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle="Protocol Assistant" />

      {/* Full-height chat container */}
      <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
        <PageContainer className="flex-1 flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto space-y-4"
            style={{ paddingBottom: 'var(--space-4)' }}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 ? (
              /* Empty state — suggested prompts */
              <div className="py-8">
                <div className="flex items-center justify-center mb-6 gap-3">
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'var(--bg-subtle)',
                    }}
                  >
                    <Stethoscope
                      size={32}
                      aria-hidden
                      style={{ color: 'var(--interactive-primary)' }}
                    />
                  </div>
                </div>
                <h2
                  className="text-2xl font-bold text-center mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Protocol Assistant
                </h2>
                <p
                  className="text-sm text-center mb-8"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Ask any clinical protocol or WHO guideline question.
                </p>

                {/* Context Indicator */}
                {context && (
                  <div 
                    className="flex items-center justify-center gap-2 mb-8 mx-auto rounded-full text-xs font-medium"
                    style={{
                      maxWidth: 'fit-content',
                      padding: '6px 12px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <ImageIcon size={14} style={{ color: 'var(--interactive-primary)' }} />
                    <span>Analysis context attached</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => void sendMessage(prompt)}
                      type="button"
                      className="text-left rounded-lg text-sm transition-colors"
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-prose text-sm leading-relaxed"
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor:
                        msg.role === 'user'
                          ? 'var(--interactive-primary)'
                          : 'var(--bg-elevated)',
                      color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                      border:
                        msg.role === 'assistant'
                          ? '1px solid var(--border-default)'
                          : 'none',
                    }}
                  >
                    {msg.isLoading ? (
                      <div className="flex gap-1 items-center py-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="rounded-full animate-pulse-slow"
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'var(--text-tertiary)',
                              animationDelay: `${i * 200}ms`,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <p>{msg.content}</p>
                        {msg.source_note && (
                          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                              Source Note
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {msg.source_note}
                            </p>
                          </div>
                        )}
                        {msg.disclaimer && (
                          <p
                            className="text-xs mt-2 pt-2 italic"
                            style={{
                              borderTop: '1px solid var(--border-subtle)',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            {msg.disclaimer}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </PageContainer>

        {/* Input area — fixed at bottom */}
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-elevated)',
            padding: 'var(--space-4)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 items-end mx-auto"
            style={{ maxWidth: '800px' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a clinical protocol question..."
              className="flex-1 resize-none rounded-lg text-sm"
              rows={1}
              maxLength={1000}
              aria-label="Message input"
              style={{
                padding: '10px 14px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                minHeight: '44px',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            />
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
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Press Enter to send &middot; Shift+Enter for new line
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
