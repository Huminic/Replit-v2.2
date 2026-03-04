/**
 * useFirstLogin - Hook for managing first login welcome modal
 *
 * Determines if the welcome modal should be shown based on:
 * 1. localStorage preference (showWelcomeModal !== false)
 * 2. Session tracking (not already shown this session)
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'nexxus_welcome_shown';
const PREFERENCE_KEY = 'nexxus_hide_welcome';

export function useFirstLogin() {
  const { user, isAuthenticated } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once per component mount
    if (hasChecked.current) return;
    if (!isAuthenticated || !user) return;

    // Check if already shown this session
    const shownThisSession = sessionStorage.getItem(SESSION_KEY) === 'true';
    if (shownThisSession) {
      hasChecked.current = true;
      return;
    }

    // Check localStorage preference - show if not explicitly hidden
    const hideWelcome = localStorage.getItem(PREFERENCE_KEY) === 'true';

    if (!hideWelcome) {
      // Mark as shown this session
      sessionStorage.setItem(SESSION_KEY, 'true');
      setShowWelcome(true);
    }

    hasChecked.current = true;
  }, [isAuthenticated, user]);

  const dismissWelcome = (dontShowAgain: boolean) => {
    setShowWelcome(false);

    // If user checked "don't show again", persist to localStorage
    if (dontShowAgain) {
      localStorage.setItem(PREFERENCE_KEY, 'true');
    }
  };

  const resetWelcome = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PREFERENCE_KEY);
    hasChecked.current = false;
  };

  return {
    showWelcome,
    dismissWelcome,
    resetWelcome,
    setShowWelcome,
  };
}

export default useFirstLogin;
