import type { OutageEvent, Ticket } from '@enlace/core';

export const MOCK_OUTAGES: OutageEvent[] = [
  {
    "id": "o1",
    "title": "Fiber backbone cut — Centro",
    "description": "Construction crew severed 48-strand fiber.",
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
    "title": "Power outage — Lagoa Preta substation",
    "description": "Local substation lost power.",
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
    "title": "DNS resolution delays",
    "description": "Intermittent DNS timeout reports.",
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
    "title": "Scheduled maintenance — Lagoa Preta OLT",
    "description": "Planned firmware upgrade on OLT-07.",
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
    "title": "Router crash — Centro POP",
    "description": "BNG router rebooted after memory leak.",
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
    "subject": "Internet completely down since morning",
    "body": "Without internet since 7am. Critical for work from home.",
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
      "suggestedResponse": "NOC team alerted. Technician dispatched. ETA 2 hours.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.94,
      "triagedAt": "2026-08-22T10:30:01Z"
    }
  },
  {
    "id": "t2",
    "subject": "Billing discrepancy on last invoice",
    "body": "Invoice shows R$ 189,90 but plan is R$ 119,90.",
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
      "suggestedResponse": "Extra R$ 70,00 is a one-time equipment fee.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.88,
      "triagedAt": "2026-08-22T09:15:01Z"
    }
  },
  {
    "id": "t3",
    "subject": "Speeds dropped to 10 Mbps",
    "body": "Paying for 300 Mbps but getting 10-15 Mbps for 3 days.",
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
      "suggestedResponse": "Technician will visit within 24h to test ONT.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.91,
      "triagedAt": "2026-08-22T12:00:01Z"
    }
  },
  {
    "id": "t4",
    "subject": "Wi-Fi 6 router keeps disconnecting",
    "body": "Router disconnects all devices every 2-3 hours.",
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
      "suggestedResponse": "Blinking amber indicates firmware update cycle.",
      "provider": "openai",
      "model": "gpt-4o",
      "confidence": 0.85,
      "triagedAt": "2026-08-22T08:45:01Z"
    }
  },
  {
    "id": "t5",
    "subject": "Request for plan upgrade",
    "body": "Want to upgrade from Fibra Básico to Premium.",
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
      "suggestedResponse": "Account qualifies for Fibra Premium.",
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "confidence": 0.97,
      "triagedAt": "2026-08-22T13:20:01Z"
    }
  },
  {
    "id": "t6",
    "subject": "No internet after moving apartments",
    "body": "Moved from Centro to Centro. Need service transfer.",
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
      "suggestedResponse": "Installation available tomorrow.",
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
