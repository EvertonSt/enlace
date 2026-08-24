import type { OutageEvent, Ticket } from '@enlace/core';

export const MOCK_OUTAGES: OutageEvent[] = [
  {
    "id": "o1",
    "title": "Corte de fibra — Centro",
    "description": "Equipe de construção cortou trunk de fibra de 48 fibras.",
    "status": "fix_in_progress",
    "affectedArea": "Centro",
    "affectedCustomerCount": 1247,
    "startedAt": "2026-08-22T08:30:00Z",
    "estimatedResolution": "2026-08-22T16:00:00Z",
    "resolvedAt": null,
    "createdAt": "2026-08-22T08:30:00Z"
  },
  {
    "id": "o2",
    "title": "Queda de energia — Subestação Lagoa Preta",
    "description": "Subestação local perdeu energia.",
    "status": "identified",
    "affectedArea": "Lagoa Preta",
    "affectedCustomerCount": 432,
    "startedAt": "2026-08-22T06:15:00Z",
    "estimatedResolution": "2026-08-22T14:00:00Z",
    "resolvedAt": null,
    "createdAt": "2026-08-22T06:15:00Z"
  },
  {
    "id": "o3",
    "title": "Atrasos na resolução de DNS",
    "description": "Relatórios intermitentes de timeout de DNS.",
    "status": "investigating",
    "affectedArea": "Centro",
    "affectedCustomerCount": 89,
    "startedAt": "2026-08-22T11:45:00Z",
    "estimatedResolution": null,
    "resolvedAt": null,
    "createdAt": "2026-08-22T11:45:00Z"
  },
  {
    "id": "o4",
    "title": "Manutenção programada — OLT Lagoa Preta",
    "description": "Atualização de firmware planejada no OLT-07.",
    "status": "reported",
    "affectedArea": "Lagoa Preta",
    "affectedCustomerCount": 312,
    "startedAt": "2026-08-23T02:00:00Z",
    "estimatedResolution": "2026-08-23T05:00:00Z",
    "resolvedAt": null,
    "createdAt": "2026-08-22T10:00:00Z"
  },
  {
    "id": "o5",
    "title": "Falha no roteador — POP Centro",
    "description": "Roteador BNG reiniciado após vazamento de memória.",
    "status": "resolved",
    "affectedArea": "Centro",
    "affectedCustomerCount": 567,
    "startedAt": "2026-08-21T22:00:00Z",
    "estimatedResolution": "2026-08-22T00:00:00Z",
    "resolvedAt": "2026-08-22T00:15:00Z",
    "createdAt": "2026-08-21T22:00:00Z"
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    "id": "t1",
    "subject": "Internet completamente fora desde a manhã",
    "body": "Sem internet desde as 7h. Crítico para trabalho remoto.",
    "status": "open",
    "priority": "high",
    "category": "outage",
    "assignedTo": null,
    "customerId": "c1",
    "createdAt": "2026-08-22T10:30:00Z",
    "updatedAt": "2026-08-22T10:30:00Z",
    "aiTriage": {
      "urgency": 5,
      "category": "outage",
      "suggestedResponse": "Equipe NOC alertada. Técnico despachado. ETA 2 horas.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.94,
      "triagedAt": "2026-08-22T10:30:01Z"
    }
  },
  {
    "id": "t2",
    "subject": "Discrepância na fatura anterior",
    "body": "Fatura mostra R$ 189,90 mas o plano é R$ 119,90.",
    "status": "in_progress",
    "priority": "medium",
    "category": "billing",
    "assignedTo": "c2",
    "customerId": "c2",
    "createdAt": "2026-08-22T09:15:00Z",
    "updatedAt": "2026-08-22T11:00:00Z",
    "aiTriage": {
      "urgency": 2,
      "category": "billing",
      "suggestedResponse": "Valor extra de R$ 70,00 é taxa única de equipamento.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.88,
      "triagedAt": "2026-08-22T09:15:01Z"
    }
  },
  {
    "id": "t3",
    "subject": "Velocidade caiu para 10 Mbps",
    "body": "Pagando por 300 Mbps mas recebendo 10-15 Mbps há 3 dias.",
    "status": "open",
    "priority": "high",
    "category": "speed",
    "assignedTo": null,
    "customerId": "c3",
    "createdAt": "2026-08-22T12:00:00Z",
    "updatedAt": "2026-08-22T12:00:00Z",
    "aiTriage": {
      "urgency": 4,
      "category": "speed",
      "suggestedResponse": "Técnico visitará em até 24h para testar a ONT.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.91,
      "triagedAt": "2026-08-22T12:00:01Z"
    }
  },
  {
    "id": "t4",
    "subject": "Roteador Wi-Fi 6 desconecta constantemente",
    "body": "Roteador desconecta todos os dispositivos a cada 2-3 horas.",
    "status": "open",
    "priority": "medium",
    "category": "equipment",
    "assignedTo": null,
    "customerId": "c4",
    "createdAt": "2026-08-22T08:45:00Z",
    "updatedAt": "2026-08-22T08:45:00Z",
    "aiTriage": {
      "urgency": 3,
      "category": "equipment",
      "suggestedResponse": "Pisca amarelo indica ciclo de atualização de firmware.",
      "provider": "openai",
      "model": "gpt-4o",
      "confidence": 0.85,
      "triagedAt": "2026-08-22T08:45:01Z"
    }
  },
  {
    "id": "t5",
    "subject": "Solicitação de upgrade de plano",
    "body": "Quero fazer upgrade de Fibra Básico para Premium.",
    "status": "in_progress",
    "priority": "low",
    "category": "other",
    "assignedTo": null,
    "customerId": "c5",
    "createdAt": "2026-08-22T13:20:00Z",
    "updatedAt": "2026-08-22T13:45:00Z",
    "aiTriage": {
      "urgency": 1,
      "category": "other",
      "suggestedResponse": "Conta qualifica para Fibra Premium.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.97,
      "triagedAt": "2026-08-22T13:20:01Z"
    }
  },
  {
    "id": "t6",
    "subject": "Sem internet após mudança de apartamento",
    "body": "Mudei dentro do Centro. Preciso de transferência de serviço.",
    "status": "resolved",
    "priority": "medium",
    "category": "installation",
    "assignedTo": null,
    "customerId": "c6",
    "createdAt": "2026-08-20T09:00:00Z",
    "updatedAt": "2026-08-22T11:30:00Z",
    "aiTriage": {
      "urgency": 2,
      "category": "installation",
      "suggestedResponse": "Instalação disponível amanhã.",
      "provider": "openai",
      "model": "gpt-4o",
      "confidence": 0.92,
      "triagedAt": "2026-08-20T09:00:01Z"
    }
  }
];

export const MOCK_CUSTOMERS = [
  {
    "id": "c1",
    "name": "Ana Beatriz Santos",
    "email": "ana.santos@email.com",
    "phone": "+55 11 98765-4321",
    "plan": "Fibra Premium 300 Mbps",
    "status": "active",
    "address": "Rua Cardeal Arcoverde 123, Centro",
    "since": "2024-03-15",
    "tickets": 3,
    "lastContact": "2026-08-22"
  },
  {
    "id": "c2",
    "name": "Carlos Eduardo Silva",
    "email": "carlos.silva@email.com",
    "phone": "+55 11 97654-3210",
    "plan": "Fibra Premium 300 Mbps",
    "status": "active",
    "address": "Rua da Lagoa Preta 456, Lagoa Preta",
    "since": "2023-11-20",
    "tickets": 1,
    "lastContact": "2026-08-22"
  },
  {
    "id": "c3",
    "name": "Fernanda Oliveira",
    "email": "fernanda@email.com",
    "phone": "+55 11 96543-2109",
    "plan": "Fibra Ultra 500 Mbps",
    "status": "active",
    "address": "Rua dos Centro 789, Centro",
    "since": "2025-01-10",
    "tickets": 2,
    "lastContact": "2026-08-22"
  },
  {
    "id": "c4",
    "name": "Roberto Nascimento",
    "email": "roberto@email.com",
    "phone": "+55 11 95432-1098",
    "plan": "Fibra Básico 100 Mbps",
    "status": "active",
    "address": "Alameda dos Anapurus 321, Lagoa Preta",
    "since": "2025-06-01",
    "tickets": 1,
    "lastContact": "2026-08-22"
  },
  {
    "id": "c5",
    "name": "Mariana Costa",
    "email": "mariana@email.com",
    "phone": "+55 11 94321-0987",
    "plan": "Fibra Básico 100 Mbps",
    "status": "active",
    "address": "Rua Haddock Lobo 654, Centro",
    "since": "2024-09-22",
    "tickets": 1,
    "lastContact": "2026-08-22"
  },
  {
    "id": "c6",
    "name": "Pedro Augusto Lima",
    "email": "pedro@email.com",
    "phone": "+55 11 93210-9876",
    "plan": "Fibra Premium 300 Mbps",
    "status": "active",
    "address": "Rua Augusta 987, Centro",
    "since": "2023-05-18",
    "tickets": 1,
    "lastContact": "2026-08-20"
  }
];

export const MOCK_TECHNICIANS = [
  {
    "id": "tech1",
    "name": "Lucas Ferreira",
    "status": "available",
    "currentJob": null,
    "area": "Centro",
    "phone": "+55 11 91111-1111",
    "completedToday": 3,
    "rating": 4.8
  },
  {
    "id": "tech2",
    "name": "Diego Souza",
    "status": "on_job",
    "currentJob": {
      "ticketId": "t3",
      "address": "Rua dos Centro 789",
      "customer": "Fernanda Oliveira",
      "eta": "14:30"
    },
    "area": "Centro",
    "phone": "+55 11 92222-2222",
    "completedToday": 2,
    "rating": 4.6
  },
  {
    "id": "tech3",
    "name": "Camila Rodrigues",
    "status": "on_job",
    "currentJob": {
      "ticketId": "t1",
      "address": "Rua Cardeal Arcoverde 123",
      "customer": "Ana Beatriz Santos",
      "eta": "13:00"
    },
    "area": "Centro",
    "phone": "+55 11 93333-3333",
    "completedToday": 4,
    "rating": 4.9
  },
  {
    "id": "tech4",
    "name": "Thiago Mendes",
    "status": "off_duty",
    "currentJob": null,
    "area": "Lagoa Preta",
    "phone": "+55 11 94444-4444",
    "completedToday": 0,
    "rating": 4.5
  }
];
