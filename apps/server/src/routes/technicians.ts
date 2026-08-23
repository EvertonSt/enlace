import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthenticatedRequest } from '../lib/auth.js';

export async function technicianRoutes(app: FastifyInstance) {
  // GET / — List all technicians
  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });

    const technicians = await prisma.technician.findMany({
      orderBy: { name: 'asc' },
      include: {
        jobs: {
          where: { status: { in: ['assigned', 'in_progress'] } },
          include: { ticket: { include: { customer: { select: { id: true, name: true, address: true } } } } },
        },
      },
    });

    // Flatten for the frontend
    const result = technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      phone: tech.phone,
      email: tech.email,
      area: tech.area,
      status: tech.status,
      rating: tech.rating,
      completedToday: tech.completedToday,
      currentJob: tech.jobs[0]
        ? {
            ticketId: tech.jobs[0].ticketId,
            address: tech.jobs[0].location ?? tech.jobs[0].ticket.customer?.address ?? 'Unknown',
            customer: tech.jobs[0].ticket.customer?.name ?? 'Unknown',
            eta: tech.jobs[0].scheduledAt ? new Date(tech.jobs[0].scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null,
          }
        : null,
    }));

    return reply.send(result);
  });

  // GET /:id — Get single technician
  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const technician = await prisma.technician.findUnique({
      where: { id },
      include: { jobs: true },
    });
    if (!technician) return reply.status(404).send({ error: 'Technician not found' });
    return reply.send(technician);
  });

  // POST / — Create technician
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });

    const body = req.body as Record<string, unknown>;
    const name = String(body['name'] ?? '');
    const area = String(body['area'] ?? '');
    if (!name || !area) return reply.status(400).send({ error: 'name and area are required' });

    const technician = await prisma.technician.create({
      data: {
        name,
        phone: body['phone'] ? String(body['phone']) : null,
        email: body['email'] ? String(body['email']) : null,
        area,
        status: body['status'] ? String(body['status']) : 'available',
        rating: typeof body['rating'] === 'number' ? body['rating'] as number : 4.0,
      },
    });

    return reply.status(201).send(technician);
  });

  // PATCH /:id — Update technician
  app.patch('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });

    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const existing = await prisma.technician.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Technician not found' });

    const data: Record<string, unknown> = {};
    for (const key of ['name', 'phone', 'email', 'area', 'status', 'rating', 'completedToday']) {
      if (key in body) data[key] = body[key];
    }

    const updated = await prisma.technician.update({ where: { id }, data });
    return reply.send(updated);
  });

  // POST /:id/assign — Assign a ticket to a technician
  app.post('/:id/assign', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });

    const { id: technicianId } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const ticketId = String(body['ticketId'] ?? '');

    if (!ticketId) return reply.status(400).send({ error: 'ticketId is required' });

    const technician = await prisma.technician.findUnique({ where: { id: technicianId } });
    if (!technician) return reply.status(404).send({ error: 'Technician not found' });

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });

    // Check if ticket already has a job
    const existingJob = await prisma.technicianJob.findUnique({ where: { ticketId } });
    if (existingJob) return reply.status(409).send({ error: 'Ticket already has an assigned job' });

    const job = await prisma.$transaction([
      prisma.technicianJob.create({
        data: {
          ticketId,
          technicianId,
          status: 'assigned',
          scheduledAt: new Date(),
          location: body['location'] ? String(body['location']) : null,
        },
      }),
      prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'in_progress', assignedTo: technicianId },
      }),
    ]);

    return reply.status(201).send(job[0]);
  });

  // DELETE /technicianJob/:id — Complete a job
  app.patch('/jobs/:id/complete', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === 'customer') return reply.status(403).send({ error: 'Staff access required' });

    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;

    const job = await prisma.technicianJob.findUnique({ where: { id } });
    if (!job) return reply.status(404).send({ error: 'Job not found' });

    const updated = await prisma.technicianJob.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes: body['notes'] ? String(body['notes']) : null,
      },
    });

    // Update ticket status to resolved
    await prisma.ticket.update({
      where: { id: job.ticketId },
      data: { status: 'resolved' },
    });

    // Increment technician's completed today count
    await prisma.technician.update({
      where: { id: job.technicianId },
      data: { completedToday: { increment: 1 } },
    });

    return reply.send(updated);
  });
}
