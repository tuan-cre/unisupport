# UniSupport

University IT Help Desk SaaS Platform — a monorepo with NestJS 11, React 19, and TypeScript.

## Quick Start

```bash
npm install
docker compose up -d
cp .env.example .env
npm run prisma:migrate --workspace apps/api
npm run prisma:seed --workspace apps/api
npm run dev          # runs web + api concurrently
```

Web → `http://localhost:5173` | API → `http://localhost:3001/api/health`
Admin login: `admin@unisupport.local` / `admin123`

## Stack

| Layer      | Technology                               |
| ---------- | ---------------------------------------- |
| Frontend   | React 19, Vite 7, Tailwind v4, shadcn/ui |
| Backend    | NestJS 11, Prisma 6, PostgreSQL 16       |
| Infra      | Redis 7, MinIO, Mailpit (Docker Compose) |
| Auth       | JWT access/refresh, bcrypt(12), MFA/TOTP |
| Real-time  | Socket.IO (authenticated notifications)  |
| Monitoring | Pino, Sentry, Prometheus, Terminus       |

## Features

| Area              | Summary                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| **Tickets**       | Full CRUD, comments, history, watchers, templates, role-scoped listing  |
| **KB**            | Articles, categories, publish/draft workflow                            |
| **SLA**           | Policies, calendars, priority-based response/resolution targets         |
| **ITIL**          | Problems, known errors, change requests, approval workflows             |
| **Assets**        | Hardware/software inventory, assignments, licenses, checkout            |
| **Admin**         | Users, roles, departments, permissions, KB, SLA, reports                |
| **Reports**       | Ticket volume, SLA compliance, agent performance, CSAT, CSV export      |
| **Chat**          | Live chat widget, agent console, chat-to-ticket, inbound email          |
| **Notifications** | In-app real-time, read/unread, toast                                    |
| **Security**      | Rate limiting per-endpoint, account lockout, data export/anonymize, MFA |
| **UX**            | Dark mode, breadcrumbs, empty states, confirm dialogs, responsive       |

## Workspaces

| Package              | Path              | Type             |
| -------------------- | ----------------- | ---------------- |
| `@unisupport/web`    | `apps/web`        | ESM              |
| `@unisupport/api`    | `apps/api`        | CommonJS         |
| `@unisupport/shared` | `packages/shared` | ESM (types only) |

## Scripts

| Command          | Action                 |
| ---------------- | ---------------------- |
| `npm run dev`    | Web + API concurrently |
| `npm run build`  | Build all workspaces   |
| `npm run test`   | Run all tests          |
| `npm run lint`   | ESLint                 |
| `npm run format` | Prettier               |

## Docs

- [`PROJECTS.md`](./PROJECTS.md) — full project reference (tree, API, schema, routing)
- [`ROADMAP.md`](./ROADMAP.md) — phased implementation plan (all 17 phases complete)
