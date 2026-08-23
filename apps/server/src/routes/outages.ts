import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { addClient, broadcastOutageCreated, broadcastOutageUpdated } from '../lib/outage-ws.js';

export async function outageRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const outages = await prisma.outageEvent.findMany({ orderBy: { startedAt: 'desc' } });
    return reply.send(outages);
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const outage = await prisma.outageEvent.findUnique({ where: { id } });
    if (!outage) return reply.status(404).send({ error: 'Outage not found' });
    return reply.send(outage);
  });

  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const title = String(body['title'] ?? '');
    const affectedArea = String(body['affectedArea'] ?? '');
    if (!title || !affectedArea) return reply.status(400).send({ error: 'title and affectedArea are required' });

    const outage = await prisma.outageEvent.create({
      data: {
        title,
        description: body['description'] ? String(body['description']) : null,
        affectedArea,
        affectedCustomerCount: typeof body['affectedCustomerCount'] === 'number' ? body['affectedCustomerCount'] as number : 0,
        startedAt: body['startedAt'] ? new Date(String(body['startedAt'])) : new Date(),
        estimatedResolution: body['estimatedResolution'] ? new Date(String(body['estimatedResolution'])) : null,
      },
    });
    broadcastOutageCreated(outage);
    return reply.status(201).send(outage);
  });

  app.patch('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const existing = await prisma.outageEvent.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Outage not found' });

    const data: Record<string, unknown> = {};
    for (const key of ['status', 'title', 'description', 'affectedArea', 'affectedCustomerCount', 'estimatedResolution', 'resolvedAt']) {
      if (key in body) data[key] = body[key];
    }
    const updated = await prisma.outageEvent.update({ where: { id }, data });
    broadcastOutageUpdated(updated);
    return reply.send(updated);
  });
}
