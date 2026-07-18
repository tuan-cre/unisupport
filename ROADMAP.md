# UniSupport — Implementation Roadmap

> **Current status:** All 25 phases plus 2 bug bashes shipped. Service is live at `unisupport.lhtuan.site`. Production-ready with metrics, monitoring, and polished UX.

---

## Honest Progress Assessment

"Done" means the feature exists, works, and is deployed. Items marked ⚠️ have known gaps you should tackle next.

| Phase                                    | Completion | What's real                                                                                         | What's missing                               |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Phase 0 — Critical Fixes                 | ✅ 100%    | 104 bugs fixed                                                                                      | —                                            |
| Phase 1 — shadcn/ui Components           | ✅ 100%    | 9+ primitives                                                                                       | —                                            |
| Phase 2 — Notifications & Real-Time      | ✅ 80%     | Socket.IO, in-app, email sending                                                                    | ⚠️ BullMQ worker implementation              |
| Phase 3 — Attachments                    | ✅ 100%    | MinIO upload/download/delete                                                                        | —                                            |
| Phase 4 — Search, Filtering & Pagination | ✅ 100%    | All list endpoints paginated                                                                        | —                                            |
| Phase 5 — Admin Panel                    | ✅ 100%    | 12 admin pages                                                                                      | —                                            |
| Phase 6 — Knowledge Base                 | ✅ 100%    | Articles, categories, voting, markdown                                                              | —                                            |
| Phase 7 — Dashboard                      | ✅ 90%     | Stats + recharts (status, priority, CSAT)                                                           | ⚠️ Date-range filter, dept scoping           |
| Phase 8 — Advanced Tickets               | ✅ 100%    | Watchers, relations, time entries, templates, bulk ops                                              | —                                            |
| Phase 9 — SLA                            | ✅ 95%     | CRUD, calendars, timestamps, ticket detail                                                          | ⚠️ BullMQ breach-detection worker            |
| Phase 10 — Advanced ITIL                 | ✅ 100%    | Problems, Known Errors, Changes, Approvals                                                          | —                                            |
| Phase 11 — Enterprise Auth               | ✅ 90%     | JWT, MFA/TOTP, lockout, email verify, Google OAuth                                                  | ⚠️ LDAP/AD provider                          |
| Phase 12 — Asset & Inventory             | ✅ 100%    | Assets, assignments, licenses, checkout                                                             | —                                            |
| Phase 13 — Reporting                     | ✅ 100%    | Volume, SLA, agent perf, real CSAT, charts, PDF export                                              | —                                            |
| Phase 14 — Quality & Observability       | ✅ 80%     | CI, Docker, Sentry, Swagger, Prometheus metrics                                                     | ⚠️ Integration/E2E tests need real-DB wiring |
| Phase 15 — UX Polish                     | ✅ 100%    | Dark mode fix, responsivity, markdown, breadcrumbs, empty states, confirm dialogs, i18n scaffolding | —                                            |
| Phase 16 — Security & Compliance         | ✅ 90%     | Data export, anonymize, Redis rate limit, env validation                                            | ⚠️ Pre-commit secret scan                    |
| Phase 17 — Multi-Channel                 | ✅ 100%    | Inbound email webhook, reply-by-email, chat widget, chat-to-ticket, WS real-time                    | —                                            |
| Phase 20 — IMAP Email Ingestion          | ✅ 100%    | IMAP polling, duplicate detection, connection leak fix, logging                                     | —                                            |
| Phase 21 — Full i18n + Vietnamese        | ✅ 100%    | `vi.json` structured, all 369 `en.json` keys filled, pages wrapped, LangSwitch, `Accept-Language`   | —                                            |
| Phase 22 — Integration/E2E Tests         | ✅ 100%    | 2 integration specs, 3 Playwright E2E flows, test DB setup, compile fixes                           | —                                            |
| Phase 19 — Bug Bash                      | ✅ 100%    | 28 bugs fixed across P0–P3; all known regressions resolved                                          | —                                            |
| Phase 23 — Prometheus + Grafana          | ✅ 100%    | Custom metrics, Grafana dashboard, docker-compose provisioning                                      | —                                            |
| Phase 24 — UI Polish & Stability         | ✅ 100%    | P0–P3 fixes, responsive admin, glass header, logo, profile layout, attachment indicator, deploy opt | —                                            |

---

## Phase 18 — Production Readiness (DELIVERED)

**Commit:** `c68c35c` | **Pushed:** `main`  
**Overall:** ✅ 17/17 complete.

| Step  | Task                                    | Status                      |
| ----- | --------------------------------------- | --------------------------- |
| 18.1  | SSO/SAML integration                    | ✅ Delivered                |
| 18.2  | Unit tests (5 suites, 22 tests)         | ✅ Delivered                |
| 18.3  | Integration tests                       | ✅ Delivered (Phase 22)     |
| 18.4  | E2E tests (Playwright)                  | ✅ Delivered (Phase 22)     |
| 18.5  | Secrets management (Joi, required vars) | ✅ Delivered                |
| 18.6  | Redis-backed rate limiting              | ✅ Delivered                |
| 18.7  | Sentry error monitoring                 | ✅ Delivered (DSN optional) |
| 18.8  | Dashboard charts (recharts)             | ✅ Delivered                |
| 18.9  | CSAT survey (DB-backed, star widget)    | ✅ Delivered                |
| 18.10 | WebSocket real-time chat events         | ✅ Delivered                |
| 18.11 | Mobile responsive audit                 | ✅ Delivered                |
| 18.12 | KB markdown rendering                   | ✅ Delivered                |
| 18.13 | Reports page + CSAT charts              | ✅ Delivered                |
| 18.14 | i18n scaffolding (`en` baseline)        | ✅ Delivered                |
| 18.15 | PDF export (`/reports/export/pdf`)      | ✅ Delivered                |
| 18.16 | BullMQ job queue module                 | ✅ Delivered                |
| 18.17 | Prometheus metrics endpoint             | ✅ Delivered (`/metrics`)   |
| 18.18 | Deploy GitHub Actions workflow          | ✅ Delivered                |

---

## Phase 19 — Bug Bash (DELIVERED)

**When:** 2026-07-16 to 2026-07-17  
**Scope:** Discovered and fixed 28 bugs across all priority levels during phases 20–22 QA.

| Priority | Count | Examples                                                                                                                                                       |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | 9     | Admin sidebar raw keys, broken `en.json` empty objects, ConfirmDialog async, SAML callback double-fire, Bull queue crash, IMAP dupe/leak/silent                |
| P1       | 6     | `Accept-Language` header, asset deletion confirm, pagination on problems/known-errors, `vi.json` restructured, integration test compilation, reports SLA crash |
| P2       | 9     | File download error handler, hardcoded role, tag update diff, auth DTOs, CSAT cache, console.error→logger, CSV download, risk level select, profile title      |
| P3       | 4     | Unused `Trans` imports, LangSwitch aria-label, `returnObjects: false`, wasteful namespace bindings                                                             |

---

## Phases 20–22 (DELIVERED)

### Phase 20 — IMAP Email Ingestion

| Step | Task                                                  | Status       |
| ---- | ----------------------------------------------------- | ------------ |
| 20.1 | IMAP connection config + env schema                   | ✅ Delivered |
| 20.2 | `EmailPollingService` with `node-imap`/`mailparser`   | ✅ Delivered |
| 20.3 | Route inbound: new→Conversation, existing→append      | ✅ Delivered |
| 20.4 | Polling via `setInterval` (60s), not BullMQ (simpler) | ✅ Delivered |
| 20.5 | Bounce/OOO filtering                                  | ✅ Delivered |

### Phase 21 — Full i18n + Vietnamese Translation

| Step | Task                                                            | Status       |
| ---- | --------------------------------------------------------------- | ------------ |
| 21.1 | `vi.json` with `common`/`nav`/`auth`/`ticket`/`page` namespaces | ✅ Delivered |
| 21.2 | `<LangSwitch />` component                                      | ✅ Delivered |
| 21.3 | All pages wrapped with `useTranslation()`                       | ✅ Delivered |
| 21.4 | `localStorage` persistence + `Accept-Language` header           | ✅ Delivered |

### Phase 22 — Integration/E2E Tests

| Step | Task                                              | Status       |
| ---- | ------------------------------------------------- | ------------ |
| 22.1 | Test DB setup with existing containers            | ✅ Delivered |
| 22.2 | `prisma migrate deploy` in `beforeAll`            | ✅ Delivered |
| 22.3 | Tickets + KB integration tests against real DB    | ✅ Delivered |
| 22.4 | Playwright E2E: login, create ticket, admin users | ✅ Delivered |

---

## Phase 23 — Prometheus + Grafana Dashboard (DELIVERED)

**Pushed:** `main` | **Date:** 2026-07-18

| Step | Task                                                                               | Status       |
| ---- | ---------------------------------------------------------------------------------- | ------------ |
| 23.1 | Add Prometheus + Grafana containers to `docker-compose.yml` with auto-provisioning | ✅ Delivered |
| 23.2 | Configure Prometheus scrape target (`localhost:3001/metrics`, 15s interval)        | ✅ Delivered |
| 23.3 | Provision Grafana datasource (Prometheus) and 6-panel dashboard JSON               | ✅ Delivered |
| 23.4 | Add custom business metrics via `@willsoto/nestjs-prometheus`                      | ✅ Delivered |
| 23.5 | Add `grafana.lhtuan.site` to nginx + DNS rules in AGENTS.md                        | ✅ Delivered |

**Metrics added:**

- `unisupport_tickets_created_total` — created counter with department + priority label
- `unisupport_comments_added_total` — added counter per ticket
- `unisupport_ticket_resolution_seconds` — histogram of resolution time
- `unisupport_auth_attempts_total` — counter with success/failure label

---

## Phase 24 — UI Polish & Cross-Cutting Fixes (DELIVERED)

**Pushed:** `main` | **Date:** 2026-07-18

A comprehensive stabilization pass after Phase 23, targeting developer experience, mobile UX, and visual consistency.

| Step  | Task                                                              | Status       |
| ----- | ----------------------------------------------------------------- | ------------ |
| 24.1  | Fix all P0–P3 bugs (i18n raw keys, dark mode, mobile header, API) | ✅ Delivered |
| 24.2  | Responsive card layouts for admin users & departments tables      | ✅ Delivered |
| 24.3  | Glass header (`backdrop-blur-md`), dashboard stat cards w/ accent | ✅ Delivered |
| 24.4  | Polished login page (gradient + logo + shadow)                    | ✅ Delivered |
| 24.5  | Global card hover transitions, ticket row hover effects           | ✅ Delivered |
| 24.6  | Profile page layout fix (MFA dialog, centered buttons)            | ✅ Delivered |
| 24.7  | Admin nav i18n labels (`page.*` prefix)                           | ✅ Delivered |
| 24.8  | Attachment indicator (paperclip + count) in ticket list           | ✅ Delivered |
| 24.9  | Reports ticket volume SQL fix (raw table name)                    | ✅ Delivered |
| 24.10 | IN_PROGRESS badge `whitespace-nowrap`                             | ✅ Delivered |
| 24.11 | Add app logo (transparent PNG) to header + login page             | ✅ Delivered |
| 24.12 | Deploy script optimization (skip npm ci / prisma if unchanged)    | ✅ Delivered |
| 24.13 | Database seed script (5 users, 12 tickets, KB, tags, SLAs)        | ✅ Delivered |
| 24.14 | Git history rewrite (all commits authored as tuan-cre)            | ✅ Delivered |

---

## Next-Phase Options

> Choose **one** phase to start. Everything below is independent of the others.

### Phase 25 — Dashboard Date-Range & Department Filtering (from Phase 7 gap)

**Why:** The dashboard shows aggregate stats but users can't drill into specific time ranges or filter by department. This is the biggest UX gap flagged in Phase 7.

| Step | Task                                                                          | Effort | Key files                                         |
| ---- | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------- |
| 24.1 | Add `startDate`, `endDate`, `departmentId` query params to `GET /dashboard`   | Small  | `dashboard.controller.ts`, `dashboard.service.ts` |
| 24.2 | Update frontend chart components to filter by date range picker + dept select | Medium | `pages/dashboard.tsx`, `components/charts/`       |
| 24.3 | Add date-range picker from shadcn/ui (or use native `<input type="date">`)    | Small  | —                                                 |

### Phase 26 — BullMQ Workers (from Phase 2 + Phase 9 gaps)

**Why:** Two stub workers need real implementations: SLA breach detection and background email processing. Without them, SLA targets are decorative and IMAP polling is synchronous.

| Step | Task                                                                                                  | Effort | Key files                                                  |
| ---- | ----------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| 25.1 | Implement SLA breach detection worker (compare ticket timestamps against calendar, emit notification) | Medium | `jobs/sla-check.job.ts`, `sla.service.ts`                  |
| 25.2 | Implement email processing worker (move IMAP polling onto BullMQ repeatable job for reliability)      | Medium | `jobs/email-processing.job.ts`, `email-polling.service.ts` |

### Phase 27 — LDAP/AD Provider (from Phase 11 gap)

**Why:** Enterprise users can't authenticate with their university directory credentials. Adds `ldapjs` integration alongside existing JWT/SAML strategies.

| Step | Task                                                      | Effort | Key files                                    |
| ---- | --------------------------------------------------------- | ------ | -------------------------------------------- |
| 26.1 | Add `ldapjs` package + LDAP env config                    | Small  | `package.json`, `config.module.ts`           |
| 26.2 | Create `LdapAuthService` (bind, search, verify)           | Medium | `auth/ldap-auth.service.ts`                  |
| 26.3 | Add LDAP login endpoint or extend existing login strategy | Medium | `auth/auth.controller.ts`, `auth.service.ts` |

---

## Infrastructure Notes

- `apps/api/.env` lives at the repo root; systemd unit runs from `/home/lhtuan/unisupport` with `ExecStart=apps/api/dist/main`.
- Docker infra (postgres, redis, minio, mailpit) started via `docker compose up -d` from `/home/lhtuan/unisupport`.
- **Containers can stop unexpectedly** (e.g., after server reboot or Docker daemon restart). No auto-restart or `restart: unless-stopped` is configured in `docker-compose.yml`. Consider adding restart policies, or a systemd oneshot that runs `docker compose up -d` at boot.
- Service health: `GET /api/health` → `{"status":"ok"}`.
- DB migrations applied: `20260716080000_add_saml_id`, `20260716090000_add_ticket_ratings`.

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

| Metric                       | Value                                                      |
| ---------------------------- | ---------------------------------------------------------- |
| Backend modules              | 28                                                         |
| API endpoints                | ~121                                                       |
| Database models              | 48                                                         |
| Frontend pages               | 29                                                         |
| Unit tests                   | 5 suites / 22 tests                                        |
| Integration tests            | 2 suites                                                   |
| E2E tests (Playwright)       | 3 flows                                                    |
| Docker services (prod infra) | 6 (PostgreSQL, Redis, MinIO, Mailpit, Prometheus, Grafana) |
| Grafana dashboards           | 1 (6-panel, auto-provisioned)                              |
| Prometheus metrics           | 4 custom counters/histograms                               |
| GitHub Actions workflows     | 1 (deploy)                                                 |
| i18n locales                 | `en`, `vi`                                                 |

---

_Last updated: 2026-07-18_
