# UniSupport — Implementation Roadmap

> **Current status:** Phases 20, 21, and 22 shipped. All planned phases complete. Review the tables below for delivery details and upcoming work.

---

## Honest Progress Assessment

"Done" means the feature exists, works, and is deployed. Items marked ⚠️ have known gaps you should tackle next.

| Phase                                    | Completion | What's real                                                                                         | What's missing                            |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Phase 0 — Critical Fixes                 | ✅ 100%    | 104 bugs fixed                                                                                      | —                                         |
| Phase 1 — shadcn/ui Components           | ✅ 100%    | 9+ primitives                                                                                       | —                                         |
| Phase 2 — Notifications & Real-Time      | ✅ 80%     | Socket.IO, in-app, email sending                                                                    | BullMQ worker implementation              |
| Phase 3 — Attachments                    | ✅ 100%    | MinIO upload/download/delete                                                                        | —                                         |
| Phase 4 — Search, Filtering & Pagination | ✅ 100%    | All list endpoints paginated                                                                        | —                                         |
| Phase 5 — Admin Panel                    | ✅ 100%    | 12 admin pages                                                                                      | —                                         |
| Phase 6 — Knowledge Base                 | ✅ 100%    | Articles, categories, voting, markdown                                                              | —                                         |
| Phase 7 — Dashboard                      | ✅ 90%     | Stats + recharts (status, priority, CSAT)                                                           | Date-range filter, dept scoping           |
| Phase 8 — Advanced Tickets               | ✅ 100%    | Watchers, relations, time entries, templates, bulk ops                                              | —                                         |
| Phase 9 — SLA                            | ✅ 95%     | CRUD, calendars, timestamps, ticket detail                                                          | BullMQ breach-detection worker            |
| Phase 10 — Advanced ITIL                 | ✅ 100%    | Problems, Known Errors, Changes, Approvals                                                          | —                                         |
| Phase 11 — Enterprise Auth               | ✅ 90%     | JWT, MFA/TOTP, lockout, email verify, SAML                                                          | LDAP/AD provider                          |
| Phase 12 — Asset & Inventory             | ✅ 100%    | Assets, assignments, licenses, checkout                                                             | —                                         |
| Phase 13 — Reporting                     | ✅ 100%    | Volume, SLA, agent perf, real CSAT, charts, PDF export                                              | —                                         |
| Phase 14 — Quality & Observability       | ✅ 80%     | CI, Docker, Sentry, Swagger, Prometheus metrics                                                     | Integration/E2E tests need real-DB wiring |
| Phase 15 — UX Polish                     | ✅ 100%    | Dark mode fix, responsivity, markdown, breadcrumbs, empty states, confirm dialogs, i18n scaffolding | —                                         |
| Phase 16 — Security & Compliance         | ✅ 90%     | Data export, anonymize, Redis rate limit, env validation                                            | Pre-commit secret scan                    |
| Phase 17 — Multi-Channel                 | ✅ 100%    | Inbound email webhook, reply-by-email, chat widget, chat-to-ticket, WS real-time, IMAP polling      | —                                         |

---

## Phase 18 — Production Readiness (DELIVERED)

**Commit:** `c68c35c` | **Pushed:** `main`  
**Overall:** 15/17 checklist items complete (2 deferred).

| Step  | Task                                    | Status                             |
| ----- | --------------------------------------- | ---------------------------------- |
| 18.1  | SSO/SAML integration                    | ✅ Delivered                       |
| 18.2  | Unit tests (5 suites, 22 tests)         | ✅ Delivered                       |
| 18.5  | Secrets management (Joi, required vars) | ✅ Delivered                       |
| 18.6  | Redis-backed rate limiting              | ✅ Delivered                       |
| 18.7  | Sentry error monitoring                 | ✅ Delivered (DSN optional)        |
| 18.8  | Dashboard charts (recharts)             | ✅ Delivered                       |
| 18.9  | CSAT survey (DB-backed, star widget)    | ✅ Delivered                       |
| 18.10 | WebSocket real-time chat events         | ✅ Delivered                       |
| 18.11 | Mobile responsive audit                 | ✅ Delivered                       |
| 18.12 | KB markdown rendering                   | ✅ Delivered                       |
| 18.13 | Reports page + CSAT charts              | ✅ Delivered                       |
| 18.14 | i18n scaffolding (`en` baseline)        | ✅ Delivered                       |
| 18.15 | PDF export (`/reports/export/pdf`)      | ✅ Delivered                       |
| 18.16 | BullMQ job queue module                 | ✅ Delivered                       |
| 18.17 | Prometheus metrics endpoint             | ✅ Delivered (`/metrics`)          |
| 18.18 | Deploy GitHub Actions workflow          | ✅ Delivered                       |
| 18.3  | Integration tests                       | ⏳ Deferred — needs real DB wiring |
| 18.4  | E2E tests (Playwright)                  | ⏳ Deferred                        |

### Phase 18 Infrastructure Notes

- `apps/api/.env` lives at the repo root; systemd unit runs from `/home/lhtuan/unisupport` with `ExecStart=apps/api/dist/main`.
- Docker infra (postgres, redis, minio, mailpit) started via `docker compose up -d` from `/home/lhtuan/unisupport`.
- Service health: `GET /api/health` → `{"status":"ok"}`.
- DB migrations applied: `20260716080000_add_saml_id`, `20260716090000_add_ticket_ratings`.

---

## Next-Phase Options (ready for you to pick)

> Choose **one** phase to start. Everything below is independent of the others.

### Phase 20 — IMAP Email Ingestion (recommended)

**Why:** Multi-channel support is 75% done; IMAP polling is the only missing half. A background worker (BullMQ scheduled job or systemd timer) reads a university IMAP inbox, auto-creates Conversation or Ticket records, and links replies to existing threads.

| Step | Task                                                                                            | Effort | Key files                                    |
| ---- | ----------------------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| 20.1 | Add IMAP connection config to `.env` + config schema                                            | Small  | `config/config.module.ts`                    |
| 20.2 | Create `EmailPollingService` with `node-imap`/`mailparser`                                      | Medium | `apps/api/src/chat/email-polling.service.ts` |
| 20.3 | Route inbound emails: new sender → Conversation, existing thread id in subject → append message | Medium | `chat.service.ts`                            |
| 20.4 | Schedule polling via BullMQ repeatable job (every 60s)                                          | Small  | `jobs/email-processing.job.ts`               |
| 20.5 | Handle bounces / OOO auto-replies (mark as spam, don't create ticket)                           | Small  | `email-polling.service.ts`                   |

### Phase 21 — Full i18n + Vietnamese Translation

**Why:** `en.json` scaffolding exists. Adding `vi.json` + wrapping pages makes the app usable for Vietnamese university staff and students — the original target audience.

| Step | Task                                                               | Effort | Key files                      |
| ---- | ------------------------------------------------------------------ | ------ | ------------------------------ |
| 21.1 | Add `vi.json` translations for all 71 keys + page-specific strings | Medium | `apps/web/src/i18n/vi.json`    |
| 21.2 | Create `<LangSwitch />` component                                  | Small  | `components/lang-switch.tsx`   |
| 21.3 | Wrap pages with `useTranslation()` and replace hardcoded strings   | Large  | All `apps/web/src/pages/*.tsx` |
| 21.4 | Persist selection in `localStorage` + backend API locale header    | Small  | `use-auth.tsx` / `lib/api.ts`  |

### Phase 22 — Integration/E2E Tests (DELIVERED)

| Step | Task                                                                                                                  | Status       |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------ |
| 22.1 | Add a `test` database URL + separate Docker Compose test profile or use existing containers                           | ✅ Delivered |
| 22.2 | Run `prisma migrate deploy` against `test` DB in a Jest `beforeAll`                                                   | ✅ Delivered |
| 22.3 | Remove mock overrides in `tickets.integration.spec.ts` and `knowledge-base.integration.spec.ts`; let them hit real DB | ✅ Delivered |
| 22.4 | Add Playwright scaffold (`apps/web/e2e/`) with 3 flows: login, create ticket, admin user page                         | ✅ Delivered |

### Phase 23 — Prometheus + Grafana Dashboard

**Why:** `/metrics` is live, but nobody is scraping or visualizing it. A Grafana instance (another Docker service, port 3003) gives operators visibility into request latency, error rate, and active users.

| Step | Task                                                                                                                                 | Effort | Key files                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------- |
| 23.1 | Add Grafana container to `docker-compose.yml` (provision with Prometheus datasource via provisioning)                                | Small  | `docker-compose.yml`, `grafana/provisioning/` |
| 23.2 | Add custom NestJS business metrics (tickets-created, comments-added, emails-processed) with `@willsoto/nestjs-prometheus` decorators | Medium | `apps/api/src/**/*.service.ts`                |
| 23.3 | Import a ready-made Grafana dashboard JSON (or build a 5-panel dashboard)                                                            | Small  | `grafana/dashboards/`                         |
| 23.4 | Document scrape endpoint in ROADMAP + add `grafana.lhtuan.site` nginx + DNS rules in AGENTS.md                                       | Small  | `AGENTS.md`, `ROADMAP.md`                     |

---

## Architecture Overview

```
Cloudflare (DNS-only)
└── Nginx (reverse proxy, port 80/443)
    ├── /api/* → UniSupport API (NestJS, port 3001)
    │   ├── PostgreSQL 16
    │   ├── Redis 7 (rate limit store, BullMQ)
    │   ├── MinIO (file storage)
    │   └── Mailpit (SMTP for dev)
    └── /* → UniSupport Web (React SPA, static files)
```

---

## Tech Stack

| Layer        | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Backend      | NestJS 11, TypeScript, CommonJS                               |
| Frontend     | React 19, Vite 7, shadcn/ui, ESM                              |
| Database     | PostgreSQL 16 + Prisma 6 ORM                                  |
| Cache/Queue  | Redis 7                                                       |
| File Storage | MinIO (S3-compatible)                                         |
| Auth         | JWT (access 15m + refresh 7d), bcrypt(12), TOTP/MFA, SAML 2.0 |
| Real-time    | Socket.IO (authenticated namespace)                           |
| Monitoring   | Sentry, Pino logger, Prometheus (`/metrics`)                  |
| Docs         | Swagger/OpenAPI at `/api/docs`                                |
| Infra        | Docker Compose, systemd, nginx, certbot                       |
| CI/CD        | GitHub Actions (deploy on push to `main`)                     |

---

## Current Metrics

| Metric                       | Value               |
| ---------------------------- | ------------------- |
| Backend modules              | 28                  |
| API endpoints                | ~121                |
| Database models              | 48                  |
| Frontend pages               | 29                  |
| Unit tests                   | 5 suites / 22 tests |
| Docker services (prod infra) | 4                   |
| GitHub Actions workflows     | 1 (deploy)          |
| i18n locales scaffolded      | `en`                |
| Prometheus endpoint          | `/metrics`          |

---

_Last updated: 2026-07-16_
