import type { Customer, Plan, Invoice, Ticket, OutageEvent } from '@enlace/core';

export const MOCK_PLAN: Plan = {
  id: 'plan-001',
  name: 'Fibra Premium',
  speedMbps: 300,
  dataCapGb: null,
  price: 119.9,
  currency: 'BRL',
};

export const MOCK_CUSTOMER: Customer = {
  id: 'cust-001',
  name: 'Everton S. Andrade',
  email: 'everton@andrade.com.br',
  phone: '+55 75 99999-0000',
  address: 'Centro, Paripiranga — BA',
  planId: 'plan-001',
  status: 'active',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2025-08-01T14:30:00Z',
};

export const MOCK_USAGE = {
  usedGb: 847,
  cycleStart: '2025-08-01T00:00:00Z',
  cycleEnd: '2025-08-31T23:59:59Z',
};

export const MOCK_INVOICE: Invoice = {
  id: 'inv-001',
  customerId: 'cust-001',
  amount: 119.9,
  currency: 'BRL',
  dueDate: '2025-09-05T23:59:59Z',
  status: 'pending',
  lineItems: [
    { description: 'Fibra Premium 300 Mbps — Agosto 2025', amount: 119.9 },
  ],
  createdAt: '2025-08-01T00:00:00Z',
};

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'tkt-001',
    customerId: 'cust-001',
    subject: 'Velocidade caindo no horário de pico',
    body: 'Desde a semana passada, minha conexão cai para menos de 50 Mbps depois das 19h. Isso é inaceitável pelo preço que pago.',
    status: 'in_progress',
    priority: 'medium',
    category: 'speed',
    assignedTo: null,
    aiTriage: {
      urgency: 3,
      category: 'speed',
      suggestedResponse:
        'Sentimos muito pela instabilidade no horário de pico. Nossa equipe de rede está investigando a congestão na sua região. Tente reiniciar seu roteador após as 18h enquanto isso.',
      provider: 'claude',
      triagedAt: '2025-08-18T19:31:00Z',
      model: 'claude-sonnet-4-20250514',
      confidence: 0.92,
    },
    createdAt: '2025-08-18T19:30:00Z',
    updatedAt: '2025-08-19T10:00:00Z',
  },
  {
    id: 'tkt-002',
    customerId: 'cust-001',
    subject: 'Cobrança indevida na fatura',
    body: 'Fui cobrado R$ 149,90 em vez de R$ 119,90 este mês. Por favor, corrijam.',
    status: 'open',
    priority: 'low',
    category: 'billing',
    assignedTo: null,
    aiTriage: {
      urgency: 2,
      category: 'billing',
      suggestedResponse:
        'Obrigado por reportar. Nossa equipe financeira está analisando sua conta e emitirá um crédito em até 3 dias úteis.',
      provider: 'claude',
      triagedAt: '2025-08-20T08:15:30Z',
      model: 'claude-sonnet-4-20250514',
      confidence: 0.97,
    },
    createdAt: '2025-08-20T08:15:00Z',
    updatedAt: '2025-08-20T08:15:00Z',
  },
];

export const MOCK_OUTAGES: OutageEvent[] = [
  {
    id: 'out-001',
    title: 'Corte de fibra — Centro',
    description:
      'Equipe de construção cortou um trunk principal de fibra que atende o bairro Centro de Paripiranga.',
    status: 'fix_in_progress',
    affectedArea: 'Centro, Paripiranga (BA)',
    affectedCustomerCount: 1247,
    startedAt: '2025-08-22T03:15:00Z',
    estimatedResolution: '2025-08-22T12:00:00Z',
    resolvedAt: null,
    createdAt: '2025-08-22T03:20:00Z',
  },
  {
    id: 'out-002',
    title: 'Queda de energia — Lagoa Preta',
    description:
      'Falha na subestação local afetando equipamentos de rede em Lagoa Preta.',
    status: 'investigating',
    affectedArea: 'Lagoa Preta, Paripiranga (BA)',
    affectedCustomerCount: 432,
    startedAt: '2025-08-22T06:00:00Z',
    estimatedResolution: null,
    resolvedAt: null,
    createdAt: '2025-08-22T06:05:00Z',
  },
];
