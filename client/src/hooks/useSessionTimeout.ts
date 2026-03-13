/**
 * Session Inactivity Timeout Hook
 *
 * Tracks user activity (mouse, keyboard, touch, scroll) and triggers a
 * warning dialog before logging the user out after a configurable idle period.
 *
 * Usage:
 *   const { showWarning, remainingSeconds, dismissWarning }
 *     = useSessionTimeout();
 *
 * The timeout duration is read from localStorage ('nexxus-session-timeout')
 * and defaults to 30 minutes. The warning dialog appears 2 minutes before
 * the timeout fires.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '@/lib/tokenStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'nexxus_session_timeout_minutes';
const WARNING_LEAD_SECONDS = 120; // show warning 2 minutes before logout
const DEFAULT_TIMEOUT_MINUTES = 30;

/** Supported timeout options in minutes. */
export const TIMEOUT_OPTIONS = [15, 30, 60, 120];

// User activity events to listen for
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the configured timeout from localStorage (in minutes). */
export function getStoredTimeoutMinutes(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_TIMEOUT_MINUTES;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MINUTES;
  return parsed;
}

/** Persist the chosen timeout to localStorage (in minutes). */
export function setStoredTimeoutMinutes(minutes: number): void {
  localStorage.setItem(STORAGE_KEY, String(minutes));
}

/** Check if a token exists (user is authenticated). */
function hasAccessToken(): boolean {
  return !!getAccessToken();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface SessionTimeoutState {
  /** Whether the warning dialog should be shown. */
  showWarning: boolean;
  /** Seconds remaining until automatic logout (only meaningful when showWarning is true). */
  remainingSeconds: number;
  /** Call this to dismiss the warning and reset the idle timer. */
  dismissWarning: () => void;
}

export function useSessionTimeout(): SessionTimeoutState {
  const [timeoutMinutes] = useState(getStoredTimeoutMinutes);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(WARNING_LEAD_SECONDS);

  // Refs to manage timers without re-render churn
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningStartRef = useRef<number>(0);

  // -------------------------------------------------------------------------
  // Clear all timers
  // -------------------------------------------------------------------------
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Start (or restart) the idle timer
  // -------------------------------------------------------------------------
  const resetTimer = useCallback(() => {
    // Don't run if not authenticated
    if (!hasAccessToken()) return;

    clearAllTimers();
    setShowWarning(false);
    setRemainingSeconds(WARNING_LEAD_SECONDS);

    const totalMs = timeoutMinutes * 60 * 1000;
    const warningMs = totalMs - WARNING_LEAD_SECONDS * 1000;

    // Timer 1: show warning dialog
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      warningStartRef.current = Date.now();

      // Countdown interval for the warning dialog
      countdownRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - warningStartRef.current) / 1000);
        const remaining = Math.max(0, WARNING_LEAD_SECONDS - elapsed);
        setRemainingSeconds(remaining);
        if (remaining <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }, 1000);

      // Timer 2: actual logout (caller handles the actual logout action)
      logoutTimerRef.current = setTimeout(() => {
        // When countdown reaches zero, keep showWarning true
        // The SessionTimeoutDialog component will handle the actual logout
      }, WARNING_LEAD_SECONDS * 1000);
    }, warningMs);
  }, [timeoutMinutes, clearAllTimers]);

  // -------------------------------------------------------------------------
  // "Stay Logged In" action — dismiss warning and reset timer
  // -------------------------------------------------------------------------
  const dismissWarning = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // -------------------------------------------------------------------------
  // Activity listeners — reset timer on any user activity
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Don't attach if no token (not logged in)
    if (!hasAccessToken()) return;

    const handleActivity = () => {
      // Only reset if warning is NOT currently showing
      // (during warning, user must click "Stay Logged In")
      if (!warningTimerRef.current && !logoutTimerRef.current) {
        // Timers already cleared — restart
        resetTimer();
      } else if (warningTimerRef.current && !logoutTimerRef.current) {
        // Pre-warning phase — reset the idle timer
        resetTimer();
      }
      // If logoutTimerRef is active (warning showing), do NOT reset
    };

    // Throttle activity events to avoid excessive timer resets
    let lastActivity = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastActivity < 5000) return; // throttle to once per 5 seconds
      lastActivity = now;
      handleActivity();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, throttledHandler, { passive: true });
    }

    // Initial timer start
    resetTimer();

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, throttledHandler);
      }
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMinutes]);

  return {
    showWarning,
    remainingSeconds,
    dismissWarning,
  };
}
