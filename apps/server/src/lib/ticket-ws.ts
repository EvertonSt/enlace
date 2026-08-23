import type { WebSocket } from 'ws';

/**
 * Manages WebSocket connections for real-time ticket broadcasting.
 * Clients connect to /ws/tickets and receive ticket events as JSON.
 */

const clients = new Set<WebSocket>();

export function addTicketClient(ws: WebSocket): void {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
}

export function broadcastTicket(message: Record<string, unknown>): void {
  const payload = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

export function broadcastTicketCreated(ticket: unknown): void {
  broadcastTicket({ type: 'ticket:created', ticket });
}

export function broadcastTicketUpdated(ticket: unknown): void {
  broadcastTicket({ type: 'ticket:updated', ticket });
}

export function getTicketClientCount(): number {
  return clients.size;
}
