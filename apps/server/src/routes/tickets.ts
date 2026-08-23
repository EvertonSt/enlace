import type { FastifyInstance } from 'fastify';
import { CreateTicketRequestSchema } from '@enlace/core';
import { prisma } from '../lib/prisma.js';
import { triageTicket } from '../lib/ai-triage.js';
import { authenticate, type AuthenticatedRequest } from '../lib/auth.js';
import { broadcastTicketCreated, broadcastTicketUpdated } from '../lib/ticket-ws.js';

export async function ticketRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    const where = user.role === 'customer' && user.customerId
      ? { customerId: user.customerId } : {};

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, email: true } } },
    });

    const parsed = tickets.map((t) => ({
      ...t,
      aiTriage: t.aiTriage ? JSON.parse(String(t.aiTriage)) : null,
    }));

    return reply.send(parsed);
  });

  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: { customer: true } });
    if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });

    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer' && ticket.customerId !== user.customerId) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    return reply.send({
      ...ticket,
      aiTriage: ticket.aiTriage ? JSON.parse(String(ticket.aiTriage)) : null,
    });
  });

  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const parsed = CreateTicketRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }

    const { customerId, subject, body: ticketBody } = parsed.data;
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return reply.status(404).send({ error: 'Customer not found' });

    let aiTriage: Record<string, unknown> | null = null;
    try {
      const triageResult = await triageTicket({ subject, body: ticketBody }, app.log);
      aiTriage = triageResult as unknown as Record<string, unknown>;
    } catch (err) {
      app.log.error({ err }, 'Triage failed');
    }

    const urgencyToPriority: Record<number, string> = { 1: 'low', 2: 'low', 3: 'medium', 4: 'high', 5: 'critical' };

    const ticket = await prisma.ticket.create({
      data: {
        customerId,
        subject,
        body: ticketBody,
        priority: aiTriage && typeof aiTriage['urgency'] === 'number'
          ? (urgencyToPriority[aiTriage['urgency'] as number] ?? 'medium') : 'medium',
        category: aiTriage && typeof aiTriage['category'] === 'string'
          ? (aiTriage['category'] as string) : 'other',
        aiTriage: aiTriage ? JSON.stringify(aiTriage) : null,
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    broadcastTicketCreated(ticket);
    return reply.status(201).send(ticket);
  });

  app.patch('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Ticket not found' });

    const data: Record<string, unknown> = {};
    for (const key of ['status', 'priority', 'category', 'assignedTo']) {
      if (key in body) data[key] = body[key];
    }

    const updated = await prisma.ticket.update({ where: { id }, data, include: { customer: { select: { id: true, name: true } } } });
    broadcastTicketUpdated(updated);
    return reply.send(updated);
  });

  app.get('/:id/triage', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, aiTriage: true } });
    if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });
    return reply.send({ ticketId: ticket.id, triage: ticket.aiTriage ? JSON.parse(String(ticket.aiTriage)) : null });
  });
}
