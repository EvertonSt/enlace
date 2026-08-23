import { useState, useEffect, useRef } from 'react';
import type { Ticket } from '@enlace/core';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

interface TicketWithCustomer extends Ticket {
  customer?: { id: string; name: string; email: string };
}

/**
 * Subscribes to real-time ticket updates via WebSocket.
 * - Connects to ws://host/ws/tickets
 * - Auto-reconnects on disconnect (3s delay)
 * - Merges incoming ticket:created/updated events into state
 */
export function useTicketWs(initialTickets: TicketWithCustomer[] = []) {
  const [tickets, setTickets] = useState<TicketWithCustomer[]>(initialTickets);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (initialTickets.length > 0) {
      setTickets(initialTickets);
    }
  }, [initialTickets]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let mounted = true;

    function connect() {
      if (!mounted) return;

      try {
        const ws = new WebSocket(`${WS_URL}/ws/tickets`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as { type: string; ticket: TicketWithCustomer };

            if (msg.type === 'ticket:created') {
              setTickets((prev) => {
                if (prev.some((t) => t.id === msg.ticket.id)) return prev;
                return [msg.ticket, ...prev];
              });
            }

            if (msg.type === 'ticket:updated') {
              setTickets((prev) =>
                prev.map((t) => (t.id === msg.ticket.id ? { ...t, ...msg.ticket } : t)),
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

  return { tickets, setTickets, connected };
}
