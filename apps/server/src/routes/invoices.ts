import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

export async function invoiceRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, async (_req, reply) => {
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    const parsed = invoices.map((inv) => ({
      ...inv,
      lineItems: typeof inv.lineItems === 'string' ? JSON.parse(inv.lineItems) : inv.lineItems,
    }));
    return reply.send(parsed);
  });

  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return reply.status(404).send({ error: 'Invoice not found' });
    return reply.send({
      ...invoice,
      lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems,
    });
  });
}
