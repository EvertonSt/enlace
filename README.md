# Enlace

**ISP Customer & Network Operations Suite** — Web · Windows Desktop (.exe) · Android (.apk)

## What is Enlace?

Enlace solves three problems every regional ISP actually loses money on:

1. **Support ticket floods during outages** — customers calling en masse because there's no self-service outage visibility
2. **Field technician coordination** — scheduling and status updates still done by phone/spreadsheet
3. **Churn from poor communication** — customers leave not because service is bad, but because they feel uninformed

## Architecture

```
enlace/
├── apps/
│   ├── web/              React + Vite (customer portal)
│   ├── desktop/           Tauri 2.x + React (NOC/staff console)
│   └── mobile/            Expo/React Native (customer + technician)
├── packages/
│   ├── core/               shared types, Zod schemas, API client, i18n
│   └── config/             shared tsconfig, eslint, prettier
├── apps/server/           Fastify API, WebSocket, Claude API triage
└── .github/workflows/     CI pipeline with QA gate
```

## Tech Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** React 19 + Vite + TypeScript + Tailwind CSS
- **Desktop:** Tauri 2.x + React (produces .exe/.msi)
- **Mobile:** Expo / React Native (produces .apk)
- **Backend:** Fastify + PostgreSQL + WebSocket
- **AI:** Anthropic Claude API for ticket triage
- **i18n:** i18next + react-i18next (EN / PT-BR)
- **QA:** Playwright + tauri-driver + Maestro

## Quick Start

```bash
# Install dependencies
pnpm install

# Run web app
pnpm dev:web

# Run desktop app (requires Rust toolchain)
pnpm dev:desktop

# Run server (requires PostgreSQL)
pnpm dev:server
```

## Development Phases

| Phase | Status | What |
|-------|--------|------|
| 1 - Skeleton | ✅ | Monorepo, core types, web dashboard, EN/PT toggle |
| 2 - Core Flow | 🔜 | Real backend, auth, outage map, ticket creation, mobile app |
| 3 - Staff Console | 🔜 | Windows desktop NOC dashboard, dispatch board |
| 4 - Differentiator | 🔜 | Claude AI triage, E2E tests, CI pipeline |
| 5 - Polish | 🔜 | Speed test, push notifications, demo video |

## Language Support

- **English** (default)
- **Português (BR)** — full translation, locale-aware dates (DD/MM/YYYY) and currency (R$)

## License

Private — built for portfolio purposes.
