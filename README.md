# UniSupport

University IT Help Desk SaaS Platform — a monorepo built with NestJS, React, and TypeScript.

## Start

```bash
npm install
docker compose up -d
npm run dev          # runs web + api concurrently
```

Workspace commands: `npm run dev:web`, `npm run dev:api`, `npm run build`.

## Structure

| Package              | Path              | Stack            |
| -------------------- | ----------------- | ---------------- |
| `@unisupport/web`    | `apps/web`        | React 19 + Vite  |
| `@unisupport/api`    | `apps/api`        | NestJS 11 + REST |
| `@unisupport/shared` | `packages/shared` | Shared types     |

## Planned Features

Ticket management, RBAC, realtime updates, SLA management, knowledge base, file attachments (MinIO), email notifications, admin dashboard, audit logging.
