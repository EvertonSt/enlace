import type { WebSocket } from 'ws';

/**
 * Manages WebSocket connections for real-time outage broadcasting.
 * Clients connect to /ws/outages and receive outage events as JSON.
 */

const clients = new Set<WebSocket>();

export function addClient(ws: WebSocket): void {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
}

export function broadcast(message: Record<string, unknown>): void {
  const payload = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

export function broadcastOutageCreated(outage: unknown): void {
  broadcast({ type: 'outage:created', outage });
}

export function broadcastOutageUpdated(outage: unknown): void {
  broadcast({ type: 'outage:updated', outage });
}

export function broadcastOutageDeleted(id: string): void {
  broadcast({ type: 'outage:deleted', outageId: id });
}

export function getClientCount(): number {
  return clients.size;
}
