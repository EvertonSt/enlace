import { useState, useEffect, useRef, useCallback } from 'react';
import type { OutageEvent } from '@enlace/core';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

/**
 * Subscribes to real-time outage updates via WebSocket.
 * - Connects to ws://host/ws/outages
 * - Auto-reconnects on disconnect (3s delay)
 * - Merges incoming outage:created/updated events into state
 * - Returns connected status for UI indicator
 */
export function useOutageWs(initialOutages: OutageEvent[] = []) {
  const [outages, setOutages] = useState<OutageEvent[]>(initialOutages);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Update outages when initial data changes (from initial fetch)
  useEffect(() => {
    if (initialOutages.length > 0) {
      setOutages(initialOutages);
    }
  }, [initialOutages]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let mounted = true;

    function connect() {
      if (!mounted) return;

      try {
        const ws = new WebSocket(`${WS_URL}/ws/outages`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as { type: string; outage: OutageEvent };

            if (msg.type === 'outage:created') {
              setOutages((prev) => {
                if (prev.some((o) => o.id === msg.outage.id)) return prev;
                return [msg.outage, ...prev];
              });
            }

            if (msg.type === 'outage:updated') {
              setOutages((prev) =>
                prev.map((o) => (o.id === msg.outage.id ? msg.outage : o)),
              );
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          if (mounted) {
            setConnected(false);
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (mounted) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  return { outages, setOutages, connected };
}
