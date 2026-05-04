import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useInactivityTimeout(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const { isAuthenticated, logout } = useAuthStore();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      return;
    }

    const handleActivity = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = window.setTimeout(async () => {
        // Session expired due to inactivity
        window.alert("Session expired due to inactivity. Please log in again.");
        await logout();
      }, timeoutMs);
    };

    // Initialize the timer
    handleActivity();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, logout, timeoutMs]);
}
