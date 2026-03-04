/**
 * React Hook for BrowserID Integration
 * Provides automatic user identification and cat personality persistence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserID, getBrowserIDFull } from './browserid';
import type { BrowserIDUser, CatPersonalityProfile } from '@/types/browserid';

interface UseBrowserIDResult {
  browserID: string | null;
  user: BrowserIDUser | null;
  loading: boolean;
  error: Error | null;

  // Methods
  identify: () => Promise<void>;
  updatePersonality: (updates: Partial<CatPersonalityProfile>) => Promise<void>;
  linkOAuth: (provider: string, userId: string, email?: string, name?: string) => Promise<void>;

  // Helpers
  isReturningUser: boolean;
  sessionCount: number;
}

export function useBrowserID(): UseBrowserIDResult {
  const [browserID, setBrowserID] = useState<string | null>(null);
  const [user, setUser] = useState<BrowserIDUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Identify user by BrowserID (PERFORMANCE OPTIMIZED)
   */
  const identify = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate BrowserID in background (non-blocking)
      const id = await getBrowserID();
      setBrowserID(id);

      // Check if user is known (run in background)
      const response = await fetch('/api/browserid/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ browserID: id })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.error || 'Failed to identify user');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('BrowserID identification error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update cat personality
   */
  const updatePersonality = useCallback(async (updates: Partial<CatPersonalityProfile>) => {
    if (!browserID) {
      throw new Error('BrowserID not initialized');
    }

    try {
      const response = await fetch('/api/browserid/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browserID,
          personality: updates
        })
      });

      const data = await response.json();

      if (data.success && user) {
        setUser({
          ...user,
          catPersonality: data.personality
        });
      } else {
        throw new Error(data.error || 'Failed to update personality');
      }
    } catch (err) {
      console.error('Personality update error:', err);
      throw err;
    }
  }, [browserID, user]);

  /**
   * Link OAuth account for cross-device sync
   */
  const linkOAuth = useCallback(async (
    provider: string,
    userId: string,
    email?: string,
    name?: string
  ) => {
    if (!browserID) {
      throw new Error('BrowserID not initialized');
    }

    try {
      const response = await fetch('/api/browserid/link-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browserID,
          oauthProvider: provider,
          oauthUserId: userId,
          email,
          name
        })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        return data;
      } else {
        throw new Error(data.error || 'Failed to link OAuth');
      }
    } catch (err) {
      console.error('OAuth link error:', err);
      throw err;
    }
  }, [browserID]);

  // Auto-identify on mount (DELAYED for performance)
  useEffect(() => {
    // Delay identification to not block initial render
    const timer = setTimeout(() => {
      identify();
    }, 1000); // Wait 1 second after page load

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only once on mount

  return {
    browserID,
    user,
    loading,
    error,
    identify,
    updatePersonality,
    linkOAuth,
    isReturningUser: user ? user.sessionCount > 1 : false,
    sessionCount: user?.sessionCount || 0
  };
}

/**
 * Hook for cat personality only
 */
export function useCatPersonality() {
  const { user, updatePersonality, loading } = useBrowserID();

  const updateMeowFrequency = useCallback((frequency: 'rare' | 'moderate' | 'chatty') => {
    return updatePersonality({ meowFrequency: frequency });
  }, [updatePersonality]);

  const updatePersonalityMode = useCallback((mode: 'playful' | 'professional' | 'balanced') => {
    return updatePersonality({ personalityMode: mode });
  }, [updatePersonality]);

  const recordBugSolved = useCallback(() => {
    if (user) {
      return updatePersonality({
        bugsSolvedTogether: user.catPersonality.bugsSolvedTogether + 1
      });
    }
  }, [user, updatePersonality]);

  const increaseAffinity = useCallback((amount: number = 5) => {
    if (user) {
      const newAffinity = Math.min(100, user.catPersonality.affinity + amount);
      return updatePersonality({ affinity: newAffinity });
    }
  }, [user, updatePersonality]);

  return {
    personality: user?.catPersonality || null,
    loading,
    updateMeowFrequency,
    updatePersonalityMode,
    recordBugSolved,
    increaseAffinity,
    updatePersonality
  };
}
