import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDbUrl() {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  if (raw.startsWith('file:') && !raw.startsWith('file:///')) {
    const rel = raw.slice('file:'.length);
    const abs = path.resolve(__dirname, '..', rel);
    return `file:${abs.replace(/\\\\/g, '/')}`;
  }
  return raw;
}

async function createClient() {
  const url = resolveDbUrl();
  console.log(`  📂 Database: ${url}`);

  const isPostgres = url.startsWith('postgresql://') || url.startsWith('postgres://');
  if (isPostgres) {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  }

  const { PrismaLibSql } = await import('@prisma/adapter-libsql');
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

// Helper to create a triage JSON string
function triage(opts: { urgency: number; category: string; provider?: string; response: string; confidence?: number }) {
  return JSON.stringify({
    urgency: opts.urgency,
    category: opts.category,
    suggestedResponse: opts.response,
    provider: opts.provider ?? 'claude',
    triagedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    confidence: opts.confidence ?? 0.9,
  });
}

// Helper to create a date N days ago
function daysAgo(n: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding Enlace database…');
  const prisma = await createClient();

  // =====================================================================
  // Plans (5 tiers)
  // =====================================================================
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { id: 'plan-basico' },
      update: {},
      create: { id: 'plan-basico', name: 'Fibra Básico 100 Mbps', speedMbps: 100, dataCapGb: 500, price: 59.9, currency: 'BRL' },
    }),
    prisma.plan.upsert({
      where: { id: 'plan-standard' },
      update: {},
      create: { id: 'plan-standard', name: 'Fibra Standard 200 Mbps', speedMbps: 200, dataCapGb: null, price: 89.9, currency: 'BRL' },
    }),
    prisma.plan.upsert({
      where: { id: 'plan-premium' },
      update: {},
      create: { id: 'plan-premium', name: 'Fibra Premium 300 Mbps', speedMbps: 300, dataCapGb: null, price: 119.9, currency: 'BRL' },
    }),
    prisma.plan.upsert({
      where: { id: 'plan-ultra' },
      update: {},
      create: { id: 'plan-ultra', name: 'Fibra Ultra 500 Mbps', speedMbps: 500, dataCapGb: null, price: 169.9, currency: 'BRL' },
    }),
    prisma.plan.upsert({
      where: { id: 'plan-business' },
      update: {},
      create: { id: 'plan-business', name: 'Business 1 Gbps', speedMbps: 1000, dataCapGb: null, price: 399.9, currency: 'BRL' },
    }),
  ]);
  const [basico, standard, premium, ultra, business] = plans;

  console.log('  ✅ Plans created (5)');

  // =====================================================================
  // Staff user
  // =====================================================================
  const password = await bcrypt.hash('password123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@enlace.com' },
    update: {},
    create: { id: 'user-staff', email: 'admin@enlace.com', password, name: 'NOC Admin', role: 'staff' },
  });

  // =====================================================================
  // Customers (12) — realistic Paripiranga (BA) residents
  // =====================================================================
  const customerData = [
    { id: 'user-001', custId: 'cust-001', email: 'everton@andrade.com.br', name: 'Everton S. Andrade', phone: '+55 73 99999-0000', address: 'Rua da Paz 123, Centro, Paripiranga — BA', planId: premium.id },
    { id: 'user-002', custId: 'cust-002', email: 'maria.silva@email.com', name: 'Maria da Silva', phone: '+55 73 98888-1111', address: 'Rua São Paulo 456, Lagoa Preta, Paripiranga — BA', planId: basico.id },
    { id: 'user-003', custId: 'cust-003', email: 'carlos.oliveira@email.com', name: 'Carlos Eduardo Oliveira', phone: '+55 73 97777-2222', address: 'Av. Brasil 789, Centro, Paripiranga — BA', planId: premium.id },
    { id: 'user-004', custId: 'cust-004', email: 'fernanda.costa@email.com', name: 'Fernanda Costa', phone: '+55 73 96666-3333', address: 'Rua das Flores 321, Jardim América, Paripiranga — BA', planId: standard.id },
    { id: 'user-005', custId: 'cust-005', email: 'pedro.santos@email.com', name: 'Pedro Augusto Santos', phone: '+55 73 95555-4444', address: 'Rua da Lagoa 654, Lagoa Preta, Paripiranga — BA', planId: ultra.id },
    { id: 'user-006', custId: 'cust-006', email: 'ana.rodrigues@email.com', name: 'Ana Beatriz Rodrigues', phone: '+55 73 94444-5555', address: 'Rua Cardeal Arcoverde 987, Centro, Paripiranga — BA', planId: basico.id },
    { id: 'user-007', custId: 'cust-007', email: 'lucas.ferreira@email.com', name: 'Lucas Nascimento', phone: '+55 73 93333-6666', address: 'Alameda dos Anjos 147, Vila Nova, Paripiranga — BA', planId: premium.id },
    { id: 'user-008', custId: 'cust-008', email: 'juliana.lima@email.com', name: 'Juliana Lima', phone: '+55 73 92222-7777', address: 'Rua Haddock Lobo 258, Centro, Paripiranga — BA', planId: standard.id },
    { id: 'user-009', custId: 'cust-009', email: 'marcos.souza@email.com', name: 'Marcos Souza', phone: '+55 73 91111-8888', address: 'Rua Augusta 369, Lagoa Preta, Paripiranga — BA', planId: business.id },
    { id: 'user-010', custId: 'cust-010', email: 'camila.pereira@email.com', name: 'Camila Pereira', phone: '+55 73 90000-9999', address: 'Rua das Acácias 741, Jardim América, Paripiranga — BA', planId: basico.id },
    { id: 'user-011', custId: 'cust-011', email: 'rafael.martins@email.com', name: 'Rafael Martins', phone: '+55 73 98877-1234', address: 'Av. Paulista 852, Centro, Paripiranga — BA', planId: premium.id },
    { id: 'user-012', custId: 'cust-012', email: 'beatriz.almeida@email.com', name: 'Beatriz Almeida', phone: '+55 73 97766-5678', address: 'Rua da Consolação 963, Vila Nova, Paripiranga — BA', planId: standard.id },
  ];

  const customers = [];
  for (const c of customerData) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { id: c.id, email: c.email, password, name: c.name, role: 'customer' },
    });
    const cust = await prisma.customer.upsert({
      where: { id: c.custId },
      update: {},
      create: { id: c.custId, userId: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, planId: c.planId },
    });
    customers.push(cust);
  }

  console.log('  ✅ Customers created (12)');

  // =====================================================================
  // Tickets (25) — realistic ISP support tickets
  // =====================================================================
  const ticketData = [
    // Speed issues (5)
    { id: 'tkt-001', custIdx: 0, subject: 'Slow speeds during peak hours', body: 'Since last week, my connection drops below 50 Mbps after 7 PM. I pay for 300 Mbps and expect better performance.', status: 'in_progress', priority: 'medium', category: 'speed', urgency: 3 },
    { id: 'tkt-002', custIdx: 2, subject: 'Speed test shows only 20 Mbps', body: 'Running speed tests on multiple devices and servers, consistently getting 20-25 Mbps. My plan is 300 Mbps Premium.', status: 'open', priority: 'high', category: 'speed', urgency: 4 },
    { id: 'tkt-003', custIdx: 4, subject: 'Upload speed extremely slow', body: 'Download is fine but upload is stuck at 2 Mbps. I need faster upload for video calls and cloud backups.', status: 'open', priority: 'medium', category: 'speed', urgency: 3 },
    { id: 'tkt-004', custIdx: 7, subject: 'Intermittent speed drops throughout the day', body: 'Connection speed fluctuates between 50 Mbps and 200 Mbps randomly. Very inconsistent experience.', status: 'in_progress', priority: 'medium', category: 'speed', urgency: 2 },
    { id: 'tkt-005', custIdx: 10, subject: 'New installation speed not matching plan', body: 'Just installed yesterday, supposed to get 300 Mbps but speed tests show 80 Mbps max.', status: 'open', priority: 'medium', category: 'speed', urgency: 3 },

    // Outage reports (4)
    { id: 'tkt-006', custIdx: 1, subject: 'Complete outage in Lagoa Preta', body: 'No internet since 6 AM. Multiple neighbors also affected. This is critical for my home office.', status: 'open', priority: 'critical', category: 'outage', urgency: 5 },
    { id: 'tkt-007', custIdx: 5, subject: 'Internet down for 3 hours', body: 'Connection dropped at 2 PM and still not恢复. Need this for school classes.', status: 'in_progress', priority: 'high', category: 'outage', urgency: 4 },
    { id: 'tkt-008', custIdx: 8, subject: 'Business line completely dead', body: 'Our office internet is completely down. We have 15 employees unable to work. This is costing us money every minute.', status: 'in_progress', priority: 'critical', category: 'outage', urgency: 5 },
    { id: 'tkt-009', custIdx: 3, subject: 'Frequent disconnections every few minutes', body: 'Connection keeps dropping every 5-10 minutes for the past 2 days. Can barely load a webpage.', status: 'open', priority: 'high', category: 'outage', urgency: 4 },

    // Billing (4)
    { id: 'tkt-010', custIdx: 0, subject: 'Billing discrepancy on August invoice', body: 'Invoice shows R$ 169.90 but my plan is R$ 119.90. There is an extra charge I do not recognize.', status: 'resolved', priority: 'low', category: 'billing', urgency: 2 },
    { id: 'tkt-011', custIdx: 3, subject: 'Overcharged for equipment fee', body: 'Charged R$ 49.90 for equipment I already returned last month. Please remove this charge.', status: 'in_progress', priority: 'low', category: 'billing', urgency: 1 },
    { id: 'tkt-012', custIdx: 6, subject: 'Request for itemized invoice', body: 'I need a detailed invoice with tax ID for my accounting. The current invoice does not have enough detail.', status: 'open', priority: 'low', category: 'billing', urgency: 1 },
    { id: 'tkt-013', custIdx: 9, subject: 'Double billing this month', body: 'I was charged twice on August 1st — R$ 59.90 x 2. Please refund the duplicate charge.', status: 'open', priority: 'medium', category: 'billing', urgency: 3 },

    // Equipment (4)
    { id: 'tkt-014', custIdx: 1, subject: 'Router keeps restarting itself', body: 'The router reboots every 2-3 hours. All lights go off then come back on. Already tried factory reset.', status: 'open', priority: 'high', category: 'equipment', urgency: 3 },
    { id: 'tkt-015', custIdx: 4, subject: 'Wi-Fi 6 router weak signal in bedroom', body: 'Signal is great in the living room but drops to 1 bar in the bedroom, which is only 8 meters away.', status: 'in_progress', priority: 'low', category: 'equipment', urgency: 2 },
    { id: 'tkt-016', custIdx: 7, subject: 'ONT indicator showing red light', body: 'The ONT optical indicator is solid red. No internet. The power and LAN lights are green.', status: 'open', priority: 'high', category: 'equipment', urgency: 4 },
    { id: 'tkt-017', custIdx: 11, subject: 'Need router replacement — Wi-Fi broken', body: 'Wi-Fi stopped working entirely. Only ethernet works. The router is 2 years old.', status: 'open', priority: 'medium', category: 'equipment', urgency: 2 },

    // Installation (3)
    { id: 'tkt-018', custIdx: 5, subject: 'Request for new installation at new address', body: 'Moving to Rua da Paz 456 next week. Need fiber installation at the new place. Current address is Rua Cardeal Arcoverde 987.', status: 'open', priority: 'medium', category: 'installation', urgency: 2 },
    { id: 'tkt-019', custIdx: 10, subject: 'Installation scheduled but no one showed up', body: 'Installation was scheduled for yesterday between 9 AM and 12 PM. No technician came. I took the day off work for nothing.', status: 'in_progress', priority: 'high', category: 'installation', urgency: 4 },
    { id: 'tkt-020', custIdx: 9, subject: 'Request to relocate fiber drop point', body: 'The fiber entry point is in a bad location. Want to move it to the office room instead of the living room.', status: 'open', priority: 'low', category: 'installation', urgency: 1 },

    // Other (5)
    { id: 'tkt-021', custIdx: 2, subject: 'Plan upgrade from Standard to Premium', body: 'I want to upgrade from Fibra Standard 200 Mbps to Fibra Premium 300 Mbps. What is the process?', status: 'resolved', priority: 'low', category: 'other', urgency: 1 },
    { id: 'tkt-022', custIdx: 6, subject: 'DNS resolution delays', body: 'Pages take 5-10 seconds to start loading. After the initial DNS resolution, speed is fine. Seems like a DNS issue.', status: 'open', priority: 'medium', category: 'other', urgency: 3 },
    { id: 'tkt-023', custIdx: 8, subject: 'Static IP request for business account', body: 'We need a static IP for our VPN server. How do I add this to my Business plan?', status: 'in_progress', priority: 'low', category: 'other', urgency: 2 },
    { id: 'tkt-024', custIdx: 11, subject: 'Port forwarding not working', body: 'Trying to set up port forwarding for my home security camera but the ports are blocked. Can you help?', status: 'open', priority: 'low', category: 'other', urgency: 1 },
    { id: 'tkt-025', custIdx: 3, subject: 'Service cancellation request', body: 'I am moving abroad next month and need to cancel my service. What are the steps?', status: 'open', priority: 'medium', category: 'other', urgency: 2 },
  ];

  for (const tk of ticketData) {
    const t = triage({
      urgency: tk.urgency,
      category: tk.category,
      response: tk.category === 'outage'
        ? 'We are aware of the service disruption. Our field team has been dispatched. Estimated restoration within 2 hours.'
        : tk.category === 'speed'
        ? 'We apologize for the speed issues. Our network team is investigating. Please try restarting your router.'
        : tk.category === 'billing'
        ? 'Our finance team is reviewing your account. You will receive an update within 3 business days.'
        : tk.category === 'equipment'
        ? 'A technician will be dispatched to inspect your equipment within 24 hours.'
        : tk.category === 'installation'
        ? 'We will schedule a technician visit. Please ensure someone is available at the address.'
        : 'Thank you for contacting us. Our team will review your request and respond within 24 hours.',
    });

    await prisma.ticket.upsert({
      where: { id: tk.id },
      update: {},
      create: {
        id: tk.id,
        customerId: customers[tk.custIdx].id,
        subject: tk.subject,
        body: tk.body,
        status: tk.status,
        priority: tk.priority,
        category: tk.category,
        aiTriage: t,
      },
    });
  }

  console.log('  ✅ Tickets created (25)');

  // =====================================================================
  // Outage events (6) — realistic ISP outage scenarios
  // =====================================================================
  const outageData = [
    { id: 'out-001', title: 'Corte de fibra — Centro', description: 'Equipe de construção cortou trunk principal de fibra que atende o bairro Centro.', status: 'fix_in_progress', area: 'Centro, Paripiranga (BA)', count: 1247, started: daysAgo(1, 8, 30), eta: daysAgo(0, 16, 0) },
    { id: 'out-002', title: 'Queda de energia — Lagoa Preta substation', description: 'Falha na subestação local afetando equipamentos de rede.', status: 'investigating', area: 'Lagoa Preta, Paripiranga (BA)', count: 432, started: daysAgo(1, 6, 15), eta: null },
    { id: 'out-003', title: 'DNS resolution delays — Paripiranga', description: 'Relatórios intermitentes de timeout de DNS em toda a rede.', status: 'identified', area: 'Paripiranga (BA)', count: 89, started: daysAgo(0, 11, 45), eta: null },
    { id: 'out-004', title: 'Manutenção programada — OLT Lagoa Preta', description: 'Upgrade de firmware planejado no OLT-07. Downtime estimado de 3 horas.', status: 'reported', area: 'Lagoa Preta, Paripiranga (BA)', count: 312, started: daysAgo(-1, 2, 0), eta: daysAgo(-1, 5, 0) },
    { id: 'out-005', title: 'BNG router crash — Centro POP', description: 'Router BNG reiniciou após memory leak. Serviço restaurado automaticamente.', status: 'resolved', area: 'Centro, Paripiranga (BA)', count: 567, started: daysAgo(2, 22, 0), eta: daysAgo(1, 0, 0), resolved: daysAgo(1, 0, 15) },
    { id: 'out-006', title: 'Corte de fibra — Av. Brasil', description: 'Obra na Av. Brasil cortou 24 fibras do backbone. Equipe no local.', status: 'fix_in_progress', area: 'Centro / Vila Nova, Paripiranga (BA)', count: 834, started: daysAgo(0, 8, 0), eta: daysAgo(0, 18, 0) },
  ];

  for (const o of outageData) {
    await prisma.outageEvent.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        title: o.title,
        description: o.description,
        status: o.status,
        affectedArea: o.area,
        affectedCustomerCount: o.count,
        startedAt: o.started,
        estimatedResolution: o.eta,
        resolvedAt: o.resolved ?? null,
      },
    });
  }

  console.log('  ✅ Outage events created (6)');

  // =====================================================================
  // Invoices (12) — one per customer, realistic amounts
  // =====================================================================
  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    const plan = plans.find((p) => p.id === (customerData[i]?.planId ?? 'plan-premium'));
    const amount = plan?.price ?? 89.9;

    // Current month (pending)
    await prisma.invoice.upsert({
      where: { id: `inv-${String(i + 1).padStart(3, '0')}-current` },
      update: {},
      create: {
        id: `inv-${String(i + 1).padStart(3, '0')}-current`,
        customerId: cust.id,
        amount,
        currency: 'BRL',
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5, 23, 59, 59),
        status: 'pending',
        lineItems: JSON.stringify([{ description: `${plan?.name ?? 'Fibra'} — ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, amount: Number(amount) }]),
      },
    });

    // Last month (paid)
    await prisma.invoice.upsert({
      where: { id: `inv-${String(i + 1).padStart(3, '0')}-prev` },
      update: {},
      create: {
        id: `inv-${String(i + 1).padStart(3, '0')}-prev`,
        customerId: cust.id,
        amount,
        currency: 'BRL',
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5, 23, 59, 59),
        status: 'paid',
        lineItems: JSON.stringify([{ description: `${plan?.name ?? 'Fibra'} — ${new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, amount: Number(amount) }]),
      },
    });
  }

  console.log('  ✅ Invoices created (24)');

  // =====================================================================
  // Technicians (4)
  // =====================================================================
  const tech1 = await prisma.technician.upsert({
    where: { id: 'tech-001' }, update: {},
    create: { id: 'tech-001', name: 'Lucas Ferreira', phone: '+55 73 91111-1111', email: 'lucas@enlace.com', area: 'Centro', status: 'available', rating: 4.8, completedToday: 3 },
  });
  const tech2 = await prisma.technician.upsert({
    where: { id: 'tech-002' }, update: {},
    create: { id: 'tech-002', name: 'Diego Souza', phone: '+55 73 92222-2222', email: 'diego@enlace.com', area: 'Centro', status: 'on_job', rating: 4.6, completedToday: 2 },
  });
  const tech3 = await prisma.technician.upsert({
    where: { id: 'tech-003' }, update: {},
    create: { id: 'tech-003', name: 'Camila Rodrigues', phone: '+55 73 93333-3333', email: 'camila@enlace.com', area: 'Centro', status: 'on_job', rating: 4.9, completedToday: 4 },
  });
  const tech4 = await prisma.technician.upsert({
    where: { id: 'tech-004' }, update: {},
    create: { id: 'tech-004', name: 'Thiago Mendes', phone: '+55 73 94444-4444', email: 'thiago@enlace.com', area: 'Lagoa Preta', status: 'off_duty', rating: 4.5, completedToday: 0 },
  });

  console.log('  ✅ Technicians created (4)');

  // =====================================================================
  // Technician Jobs (6) — assign some tickets to technicians
  // =====================================================================
  const jobData = [
    { ticketId: 'tkt-001', techId: tech3.id, location: 'Rua da Paz 123, Centro' },
    { ticketId: 'tkt-006', techId: tech2.id, location: 'Rua São Paulo 456, Lagoa Preta' },
    { ticketId: 'tkt-007', techId: tech3.id, location: 'Rua Cardeal Arcoverde 987, Centro' },
    { ticketId: 'tkt-008', techId: tech1.id, location: 'Rua Augusta 369, Lagoa Preta (Escritorio)' },
    { ticketId: 'tkt-004', techId: tech1.id, location: 'Rua Haddock Lobo 258, Centro' },
    { ticketId: 'tkt-019', techId: tech4.id, location: 'Rua da Consolação 963, Vila Nova' },
  ];

  for (const j of jobData) {
    await prisma.technicianJob.upsert({
      where: { ticketId: j.ticketId },
      update: {},
      create: {
        ticketId: j.ticketId,
        technicianId: j.techId,
        status: 'in_progress',
        scheduledAt: daysAgo(0, 9, 0),
        location: j.location,
      },
    });
    // Mark tickets as in_progress
    await prisma.ticket.update({
      where: { id: j.ticketId },
      data: { status: 'in_progress', assignedTo: j.techId },
    });
  }

  console.log('  ✅ Technician jobs created (6)');
  console.log('\n🎉 Seed complete!');
  console.log('   Test login: everton@andrade.com.br / password123');
  console.log('   Staff login: admin@enlace.com / password123');
  console.log('   All customer passwords: password123');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
