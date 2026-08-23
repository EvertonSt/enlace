import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthenticatedRequest } from '../lib/auth.js';

export async function customerRoutes(app: FastifyInstance) {
  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer' && user.customerId !== id) {
      return reply.status(403).send({ error: 'Access denied' });
    }
    const customer = await prisma.customer.findUnique({ where: { id }, include: { plan: true } });
    if (!customer) return reply.status(404).send({ error: 'Customer not found' });
    return reply.send(customer);
  });

  app.get('/:id/tickets', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer' && user.customerId !== id) {
      return reply.status(403).send({ error: 'Access denied' });
    }
    const tickets = await prisma.ticket.findMany({ where: { customerId: id }, orderBy: { createdAt: 'desc' } });
    return reply.send(tickets);
  });

  app.get('/:id/invoices', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer' && user.customerId !== id) {
      return reply.status(403).send({ error: 'Access denied' });
    }
    const invoices = await prisma.invoice.findMany({ where: { customerId: id }, orderBy: { createdAt: 'desc' } });
    return reply.send(invoices);
  });

  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });
    const customers = await prisma.customer.findMany({ include: { plan: true }, orderBy: { createdAt: 'desc' } });
    return reply.send(customers);
  });
}
