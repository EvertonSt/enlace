import type { FastifyInstance } from 'fastify';
import { register, login, authenticate, type AuthenticatedRequest } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register — strict rate limit: 5 per minute per IP
  app.post('/register', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;

    const email = String(body['email'] ?? '');
    const password = String(body['password'] ?? '');
    const name = String(body['name'] ?? '');

    if (!email || !password || !name) {
      return reply.status(400).send({ error: 'email, password, and name are required' });
    }

    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    const plan = await prisma.plan.findFirst();
    if (!plan) {
      return reply.status(500).send({ error: 'No plans configured' });
    }

    try {
      const result = await register({
        email,
        password,
        name,
        phone: body['phone'] ? String(body['phone']) : undefined,
        address: body['address'] ? String(body['address']) : undefined,
        planId: plan.id,
      });
      return reply.status(201).send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      const status = (err as { status?: number }).status ?? 500;
      return reply.status(status).send({ error: message });
    }
  });

  // POST /api/auth/login — strict rate limit: 10 per minute per IP
  app.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const email = String(body['email'] ?? '');
    const password = String(body['password'] ?? '');

    if (!email || !password) {
      return reply.status(400).send({ error: 'email and password are required' });
    }

    try {
      const result = await login({ email, password });
      return reply.send(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      const status = (err as { status?: number }).status ?? 500;
      return reply.status(status).send({ error: message });
    }
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    const { sub } = (req as AuthenticatedRequest).user;

    const user = await prisma.user.findUnique({
      where: { id: sub },
      include: { customer: { include: { plan: true } } },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customer: user.customer
        ? {
            id: user.customer.id,
            name: user.customer.name,
            email: user.customer.email,
            phone: user.customer.phone,
            address: user.customer.address,
            status: user.customer.status,
            plan: user.customer.plan,
          }
        : null,
    });
  });
}
