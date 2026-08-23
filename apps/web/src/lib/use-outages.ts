import { useState, useEffect, useCallback, useRef } from 'react';
import type { OutageEvent } from '@enlace/core';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/**
 * Hook that fetches outages from the API and subscribes to WebSocket
 * for live updates. Falls back to mock data when the server is unavailable.
 */

// Paripiranga (BA) center coordinates
const DEFAULT_OUTAGES: OutageEvent[] = [
  {
    id: 'out-001',
    title: 'Corte de fibra — Centro',
    description:
      'Equipe de construção cortou um trunk principal de fibra que atende o bairro Centro de Paripiranga.',
    status: 'fix_in_progress',
    affectedArea: 'Centro, Paripiranga (BA)',
    affectedCustomerCount: 1247,
    startedAt: '2025-08-22T03:15:00Z',
    estimatedResolution: '2025-08-22T12:00:00Z',
    resolvedAt: null,
    createdAt: '2025-08-22T03:20:00Z',
  },
  {
    id: 'out-002',
    title: 'Queda de energia — Lagoa Preta',
    description: 'Falha na subestação local afetando equipamentos de rede em Lagoa Preta.',
    status: 'investigating',
    affectedArea: 'Lagoa Preta, Paripiranga (BA)',
    affectedCustomerCount: 432,
    startedAt: '2025-08-22T06:00:00Z',
    estimatedResolution: null,
    resolvedAt: null,
    createdAt: '2025-08-22T06:05:00Z',
  },
];

export function useOutages() {
  const [outages, setOutages] = useState<OutageEvent[]>(DEFAULT_OUTAGES);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial data from API
  useEffect(() => {
    let cancelled = false;

    async function fetchOutages() {
      try {
        const res = await fetch(`${API_URL}/api/outages`);
        if (res.ok) {
          const data = (await res.json()) as OutageEvent[];
          if (!cancelled && data.length > 0) {
            setOutages(data);
          }
        }
      } catch {
        // Server not available — keep using default mock data
      }
    }

    void fetchOutages();
    return () => { cancelled = true; };
  }, []);

  // Subscribe to WebSocket for live updates
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        const ws = new WebSocket(`${WS_URL}/ws/outages`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as {
              type: string;
              outage: OutageEvent;
            };

            if (msg.type === 'outage:created' || msg.type === 'outage:updated') {
              setOutages((prev) => {
                const idx = prev.findIndex((o) => o.id === msg.outage.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = msg.outage;
                  return next;
                }
                return [msg.outage, ...prev];
              });
            }

            if (msg.type === 'outage:resolved') {
              setOutages((prev) =>
                prev.map((o) => (o.id === msg.outage.id ? msg.outage : o)),
              );
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          setConnected(false);
          // Reconnect after 3s
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // WebSocket not available — retry
        reconnectTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  const activeOutages = outages.filter((o) => o.status !== 'resolved');
  const resolvedOutages = outages.filter((o) => o.status === 'resolved');

  return {
    outages,
    activeOutages,
    resolvedOutages,
    connected,
  };
}
