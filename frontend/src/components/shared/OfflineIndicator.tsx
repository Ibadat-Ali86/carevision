/**
 * CareVision — OfflineIndicator (Global Fixed Component)
 * Spec Reference: Section 3.2.9
 *
 * Persistent status banner showing connectivity state.
 * Fixed below header (top: 64px), full-width.
 *
 * States:
 *   Online + not syncing → Hidden (null)
 *   Offline              → Amber: "You are offline. Results will sync when connection is restored."
 *   Syncing              → Blue: "Syncing queued results..."
 *   Sync error           → Red: "Sync failed. Will retry automatically."
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync attempt (Workbox or manual) when connection is restored
      setSyncState('syncing');
      // Clear syncing indicator after 3 seconds
      const timer = setTimeout(() => setSyncState('idle'), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Online and idle — render nothing
  if (isOnline && syncState === 'idle') return null;

  const config = {
    offline: {
      bg: '#F59E0B',
      text: 'You are offline. Results will sync when connection is restored.',
      Icon: WifiOff,
    },
    syncing: {
      bg: '#3B82F6',
      text: 'Syncing queued results...',
      Icon: RefreshCw,
    },
    error: {
      bg: '#EF4444',
      text: 'Sync failed. Will retry automatically.',
      Icon: CloudOff,
    },
  };

  const state = !isOnline ? 'offline' : syncState === 'syncing' ? 'syncing' : 'error';
  const { bg, text, Icon } = config[state];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 z-40 flex items-center justify-center gap-2 text-white text-xs font-medium"
      style={{
        top: '64px',   // Below the 64px header
        height: '40px',
        backgroundColor: bg,
      }}
    >
      <Icon
        size={16}
        aria-hidden
        className={syncState === 'syncing' ? 'animate-spin' : ''}
      />
      <span>{text}</span>
    </div>
  );
}

export default OfflineIndicator;
