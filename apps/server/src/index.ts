import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.js';
import { ticketRoutes } from './routes/tickets.js';
import { outageRoutes } from './routes/outages.js';
import { customerRoutes } from './routes/customers.js';
import { invoiceRoutes } from './routes/invoices.js';
import { planRoutes } from './routes/plans.js';
import { technicianRoutes } from './routes/technicians.js';
import { analyticsRoutes } from './routes/analytics.js';
import { initTriageProvider } from './lib/ai-triage.js';
import './lib/prisma.js';
import { addClient } from './lib/outage-ws.js';
import { startDailyResetSchedule } from './lib/daily-reset.js';
import { addTicketClient } from './lib/ticket-ws.js';
import { verifyToken } from './lib/auth.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = Fastify({ logger: true });

// Plugins
await app.register(cors, { origin: true });
await app.register(websocket);
await app.register(rateLimit, {
  max: 100,            // 100 requests per window per IP
  timeWindow: '1 minute',
  errorResponseBuilder: (_req, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded, retry in ${context.after}`,
  }),
});

// Initialize AI triage provider
initTriageProvider(app.log);

// Schedule daily reset of technician completedToday counters
startDailyResetSchedule();

// Health check
app.get('/api/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  triageProvider: process.env.TRIAGE_PROVIDER ?? 'rule-based',
}));

// Routes
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(planRoutes, { prefix: '/api/plans' });
await app.register(ticketRoutes, { prefix: '/api/tickets' });
await app.register(outageRoutes, { prefix: '/api/outages' });

// WebSocket: real-time outage stream
app.get('/ws/outages', { websocket: true }, (socket, req) => {
  // Authenticate via token query parameter
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const token = url.searchParams.get('token');
  if (token) {
    try {
      verifyToken(token);
    } catch {
      socket.close(4001, 'Invalid token');
      return;
    }
  }
  // Allow unauthenticated for demo/development
  addClient(socket);
  app.log.info('WebSocket client connected to /ws/outages');
});

app.get('/ws/tickets', { websocket: true }, (socket, req) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const token = url.searchParams.get('token');
  if (token) {
    try {
      verifyToken(token);
    } catch {
      socket.close(4001, 'Invalid token');
      return;
    }
  }
  addTicketClient(socket);
  app.log.info('WebSocket client connected to /ws/tickets');
});
await app.register(customerRoutes, { prefix: '/api/customers' });
await app.register(invoiceRoutes, { prefix: '/api/invoices' });
await app.register(technicianRoutes, { prefix: '/api/technicians' });
await app.register(analyticsRoutes, { prefix: '/api/analytics' });

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Enlace API running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
