import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function planRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    return reply.send(plans);
  });
}
