import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { OutageEvent } from '@enlace/core';
import { checkAndNotify } from '../lib/notifications';

interface PollingResult {
  outages: OutageEvent[];
  loading: boolean;
  lastUpdated: Date | null;
  isPolling: boolean;
  hasNewChanges: boolean;
  clearChanges: () => void;
}

/**
 * Polls /api/outages at a configurable interval.
 * - Pauses when the app goes to background
 * - Detects new outages and status changes
 * - Returns a `hasNewChanges` flag so the UI can show a "New data" indicator
 */
export function useOutagePolling(
  apiFetch: <T>(endpoint: string) => Promise<T>,
  intervalMs = 30_000,
): PollingResult {
  const [outages, setOutages] = useState<OutageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [hasNewChanges, setHasNewChanges] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const prevStatusesRef = useRef<Map<string, string>>(new Map());
  const appState = useRef(AppState.currentState);

  const isFirstFetch = useRef(true);

  const fetchOutages = useCallback(async () => {
    try {
      const data = await apiFetch<OutageEvent[]>('/api/outages');

      // Detect new outages
      const newIds = new Set(data.map((o) => o.id));
      const hadNew = data.some((o) => !prevIdsRef.current.has(o.id));

      // Detect status changes
      let hadStatusChange = false;
      for (const o of data) {
        const prevStatus = prevStatusesRef.current.get(o.id);
        if (prevStatus && prevStatus !== o.status) {
          hadStatusChange = true;
        }
      }

      if (prevIdsRef.current.size > 0 && (hadNew || hadStatusChange)) {
        setHasNewChanges(true);
        // Send push notification for new/changed outages (fire and forget)
        void checkAndNotify(data);
      }

      // On first fetch, mark all current outages as "seen" so they don't
      // trigger retroactive notifications on app launch
      if (isFirstFetch.current) {
        isFirstFetch.current = false;
        void checkAndNotify(data);
      }

      prevIdsRef.current = newIds;
      for (const o of data) {
        prevStatusesRef.current.set(o.id, o.status);
      }

      setOutages(data);
      setLastUpdated(new Date());
    } catch {
      // Silent fail — keep previous data
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // Initial fetch
  useEffect(() => {
    void fetchOutages();
  }, [fetchOutages]);

  // Polling interval
  useEffect(() => {
    if (!isPolling) return;
    const timer = setInterval(() => {
      void fetchOutages();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPolling, intervalMs, fetchOutages]);

  // Pause/resume on app state change
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/active/) && next.match(/inactive|background/)) {
        // Going to background — pause polling
        setIsPolling(false);
      } else if (appState.current.match(/inactive|background/) && next === 'active') {
        // Coming back to foreground — resume + immediate refresh
        setIsPolling(true);
        void fetchOutages();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [fetchOutages]);

  const clearChanges = useCallback(() => setHasNewChanges(false), []);

  return { outages, loading, lastUpdated, isPolling, hasNewChanges, clearChanges };
}
