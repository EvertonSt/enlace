import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthenticatedRequest } from '../lib/auth.js';

export async function analyticsRoutes(app: FastifyInstance) {
  // GET /api/analytics/overview — High-level KPIs
  app.get('/overview', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });

    const [totalCustomers, totalTickets, openTickets, totalRevenue, totalOutages, activeOutages] = await Promise.all([
      prisma.customer.count(),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'paid' } }),
      prisma.outageEvent.count(),
      prisma.outageEvent.count({ where: { status: { in: ['reported', 'investigating', 'identified', 'fix_in_progress'] } } }),
    ]);

    return reply.send({
      totalCustomers,
      totalTickets,
      openTickets,
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      totalOutages,
      activeOutages,
      avgRevenuePerCustomer: totalCustomers > 0 ? Math.round((Number(totalRevenue._sum.amount ?? 0) / totalCustomers) * 100) / 100 : 0,
    });
  });

  // GET /api/analytics/tickets/by-status — Ticket counts grouped by status
  app.get('/tickets/by-status', { preHandler: [authenticate] }, async (_req, reply) => {
    const statuses = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
    const counts = await Promise.all(
      statuses.map((status) => prisma.ticket.count({ where: { status } })),
    );
    return reply.send(statuses.map((status, i) => ({ status, count: counts[i] })));
  });

  // GET /api/analytics/tickets/by-category — Ticket counts grouped by category
  app.get('/tickets/by-category', { preHandler: [authenticate] }, async (_req, reply) => {
    const categories = ['outage', 'billing', 'speed', 'installation', 'equipment', 'other'];
    const counts = await Promise.all(
      categories.map((category) => prisma.ticket.count({ where: { category } })),
    );
    return reply.send(categories.map((category, i) => ({ category, count: counts[i] })));
  });

  // GET /api/analytics/tickets/by-day — Ticket creation counts for the last 30 days
  app.get('/tickets/by-day', { preHandler: [authenticate] }, async (_req, reply) => {
    const tickets = await prisma.ticket.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date (last 30 days)
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }

    for (const t of tickets) {
      const key = t.createdAt.toISOString().slice(0, 10);
      if (key in days) days[key] = (days[key] ?? 0) + 1;
    }

    return reply.send(Object.entries(days).map(([date, count]) => ({ date, count })));
  });

  // GET /api/analytics/outages/by-status — Outage counts grouped by status
  app.get('/outages/by-status', { preHandler: [authenticate] }, async (_req, reply) => {
    const statuses = ['reported', 'investigating', 'identified', 'fix_in_progress', 'resolved'];
    const counts = await Promise.all(
      statuses.map((status) => prisma.outageEvent.count({ where: { status } })),
    );
    return reply.send(statuses.map((status, i) => ({ status, count: counts[i] })));
  });

  // GET /api/analytics/outages/affected — Total customers affected by active outages
  app.get('/outages/affected', { preHandler: [authenticate] }, async (_req, reply) => {
    const outages = await prisma.outageEvent.findMany({
      where: { status: { in: ['reported', 'investigating', 'identified', 'fix_in_progress'] } },
      select: { affectedArea: true, affectedCustomerCount: true, status: true, title: true },
      orderBy: { affectedCustomerCount: 'desc' },
    });
    return reply.send(outages);
  });

  // GET /api/analytics/customers/by-plan — Customer counts grouped by plan
  app.get('/customers/by-plan', { preHandler: [authenticate] }, async (_req, reply) => {
    const plans = await prisma.plan.findMany({
      include: { _count: { select: { customers: true } } },
      orderBy: { price: 'asc' },
    });
    return reply.send(plans.map((p) => ({
      plan: p.name,
      count: p._count.customers,
      price: Number(p.price),
      revenue: Math.round(p._count.customers * Number(p.price) * 100) / 100,
    })));
  });

  // GET /api/analytics/revenue/monthly — Revenue by month (last 6 months)
  app.get('/revenue/monthly', { preHandler: [authenticate] }, async (_req, reply) => {
    const invoices = await prisma.invoice.findMany({
      where: { status: 'paid' },
      select: { amount: true, createdAt: true },
    });

    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months[key] = 0;
    }

    for (const inv of invoices) {
      const key = inv.createdAt.toISOString().slice(0, 7);
      if (key in months) months[key] = (months[key] ?? 0) + Number(inv.amount);
    }

    return reply.send(Object.entries(months).map(([month, revenue]) => ({ month, revenue })));
  });

  // GET /api/analytics/technicians/performance — Technician completion stats
  app.get('/technicians/performance', { preHandler: [authenticate] }, async (_req, reply) => {
    const techs = await prisma.technician.findMany({
      select: { name: true, rating: true, completedToday: true, status: true },
      orderBy: { rating: 'desc' },
    });
    return reply.send(techs);
  });
}
