# UniSupport — Implementation Roadmap

Prioritized phases ordered by dependency, risk, and value.

## Progress Summary

| Phase                                      | Status                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Phase 0 — Critical Fixes                   | ✅ **Done**                                                                                        |
| Phase 1 — shadcn/ui Components             | ✅ **Done**                                                                                        |
| Phase 2 — Notifications & Real-Time        | ✅ **Done**                                                                                        |
| Phase 4 — Search, Filtering & Pagination   | ✅ **Done** (via 0.1)                                                                              |
| Phase 5 — Admin Panel                      | ✅ **Done**                                                                                        |
| Phase 3 — Attachments                      | ✅ **Done**                                                                                        |
| Phase 6 — Knowledge Base                   | ✅ **Done**                                                                                        |
| Phase 7 — User Profile & Dashboard         | ✅ **Done**                                                                                        |
| Phase 8 — Advanced Ticket Features         | ✅ **Done**                                                                                        |
| Phase 9 — SLA Management                   | ✅ **Done**                                                                                        |
| Phase 10 — Advanced ITIL                   | ✅ **Done**                                                                                        |
| Phase 11 — Enterprise Auth                 | ✅ **Done**                                                                                        |
| Phase 12 — Asset & Inventory               | ✅ **Done**                                                                                        |
| Phase 13 — Reporting & Analytics           | ✅ **Done**                                                                                        |
| Phase 14 — Quality & Observability         | ✅ **Done**                                                                                        |
| Phase 15 — UX Polish                       | ✅ **Done** (15.1 dark mode, 15.3 breadcrumbs, 15.6 empty states, 15.7 confirm dialogs)            |
| Phase 16 — Security & Compliance           | ✅ **Done** (16.3 data export, 16.4 anonymize, 16.6 per-endpoint rate limiting)                    |
| Phase 17 — Email-to-Ticket & Multi-Channel | ✅ **Done** (17.1–17.3 email webhook + reply-by-email, 17.4 live chat widget, 17.5 chat-to-ticket) |

---

## Phase 9 — SLA Management

| Step | Task                                                  | Files                                        | Depends on                |
| ---- | ----------------------------------------------------- | -------------------------------------------- | ------------------------- |
| 9.1  | `Sla`, `SlaCalendar` models                           | `schema.prisma`                              | —                         |
| 9.2  | SLA CRUD endpoints                                    | `slas/slas.controller.ts`                    | 9.1                       |
| 9.3  | SLA breach detection (BullMQ job)                     | `jobs/sla-check.job.ts`                      | 2.1 (BullMQ future stack) |
| 9.4  | `firstResponseAt`, `resolvedAt`, `closedAt` on Ticket | `schema.prisma`, update `tickets.service.ts` | —                         |
| 9.5  | SLA timer display on ticket detail                    | `ticket-detail.tsx`                          | 9.4                       |
| 9.6  | SLA admin page                                        | `pages/admin/slas.tsx`                       | 9.2                       |

---

## Phase 10 — Advanced ITIL

| Step | Task               | Files                                                |
| ---- | ------------------ | ---------------------------------------------------- |
| 10.1 | Problem management | `Problem` model, CRUD, link to tickets               |
| 10.2 | Known error DB     | `KnownError` model + workarounds                     |
| 10.3 | Change management  | `ChangeRequest` model, CAB approval, change calendar |
| 10.4 | Approval workflows | `Approval` model, chain-of-approval config           |

---

## Phase 11 — Enterprise Auth

| Step | Task                     | Files                                                 |
| ---- | ------------------------ | ----------------------------------------------------- |
| 11.1 | Email verification flow  | `auth.service.ts`, email template, verification token |
| 11.2 | Account lockout policy   | `auth.service.ts` (track attempts, temporary lock)    |
| 11.3 | Password strength policy | Configurable rules, validation                        |
| 11.4 | SSO / SAML / CAS         | `passport-saml` or `@nestjs/passport` SAML strategy   |
| 11.5 | LDAP / AD integration    | Custom auth provider or `passport-ldapauth`           |
| 11.6 | MFA / TOTP               | `otplib`, QR code enrollment, backup codes            |

---

## Phase 12 — Asset & Inventory

| Step | Task                               | Files                                      |
| ---- | ---------------------------------- | ------------------------------------------ |
| 12.1 | `Asset`, `AssetAssignment` models  | `schema.prisma`                            |
| 12.2 | Asset CRUD endpoints + admin UI    | `assets/`                                  |
| 12.3 | `SoftwareLicense` model + tracking | `schema.prisma`                            |
| 12.4 | `HardwareCheckout` (loaner system) | `schema.prisma`, checkout/return endpoints |

---

## Phase 13 — Reporting & Analytics

| Step | Task                          | Files                                               | Depends on          |
| ---- | ----------------------------- | --------------------------------------------------- | ------------------- |
| 13.1 | Ticket volume report endpoint | `reports/reports.controller.ts`                     | —                   |
| 13.2 | SLA compliance report         | `reports.controller.ts`                             | 9.x                 |
| 13.3 | Agent performance report      | `reports.controller.ts`                             | 8.9 (time tracking) |
| 13.4 | CSAT report                   | `reports.controller.ts`                             | —                   |
| 13.5 | Reports page with charts      | `pages/admin/reports.tsx` (chart library: recharts) | 13.1–13.4           |
| 13.6 | CSV/PDF export                | Export service                                      | 13.5                |
| 13.7 | Scheduled reports via BullMQ  | Email delivery of auto-generated reports            | 13.6, 2.2           |

---

## Phase 14 — Quality & Observability

| Step  | Task                                    | Files                                        |
| ----- | --------------------------------------- | -------------------------------------------- |
| 14.1  | Unit tests for auth service             | `auth/auth.service.spec.ts`                  |
| 14.2  | Unit tests for tickets service          | `tickets/tickets.service.spec.ts`            |
| 14.3  | Integration tests (supertest + test DB) | `test/`                                      |
| 14.4  | E2E tests with Playwright               | `test/e2e/`                                  |
| 14.5  | CI pipeline (GitHub Actions)            | `.github/workflows/ci.yml`                   |
| 14.6  | Dockerfiles for API + Web               | `apps/api/Dockerfile`, `apps/web/Dockerfile` |
| 14.7  | Production docker-compose               | `docker-compose.prod.yml`                    |
| 14.8  | Sentry error tracking                   | `SentryModule`, `RavenInterceptor`           |
| 14.9  | Pino structured logging                 | Replace NestJS default logger                |
| 14.10 | Swagger / OpenAPI                       | `swagger.ts`, `@nestjs/swagger` decorators   |
| 14.11 | Prometheus metrics                      | `@willsoto/nestjs-prometheus`                |
| 14.12 | Deep health check                       | DB, Redis, MinIO, Mailpit connectivity check |

---

## Phase 15 — UX Polish

| Step | Task                                         | Files                                                           |
| ---- | -------------------------------------------- | --------------------------------------------------------------- |
| 15.1 | Dark mode toggle                             | `hooks/use-theme.ts`, toggle in navbar, persist to localStorage |
| 15.2 | Responsive layout audit                      | All pages — test at mobile, tablet, desktop breakpoints         |
| 15.3 | Breadcrumb navigation                        | `components/breadcrumbs.tsx`                                    |
| 15.4 | Keyboard navigation + aria labels            | All interactive elements                                        |
| 15.5 | i18n setup (react-i18next)                   | `i18n.ts`, translation JSON files                               |
| 15.6 | Empty states (illustrations + messages)      | `components/empty-state.tsx`, update all list pages             |
| 15.7 | Confirmation dialogs for destructive actions | Wrap delete/logout in `Dialog`                                  |
| 15.8 | Page transition animations                   | Framer Motion or CSS transitions                                |

---

## Phase 16 — Security & Compliance

| Step | Task                                         | Files                                    |
| ---- | -------------------------------------------- | ---------------------------------------- |
| 16.1 | Secrets vault (Doppler / env injection)      | Replace plain `.env`                     |
| 16.2 | Pre-commit hook to detect secrets            | `.husky/pre-commit` + `secretlint`       |
| 16.3 | GDPR / FERPA data export endpoint            | `GET /users/me/export`                   |
| 16.4 | Data anonymization / right-to-delete         | `DELETE /users/me/anonymize`             |
| 16.5 | Audit log retention policy                   | Configurable TTL + cleanup job           |
| 16.6 | Rate limiting per-endpoint (not just global) | `@nestjs/throttler` per-route decorators |

---

## Phase 17 — Email-to-Ticket & Multi-Channel

| Step | Task                             | Files                                           |
| ---- | -------------------------------- | ----------------------------------------------- |
| 17.1 | Inbound email parsing (IMAP)     | `modules/email/inbound.service.ts` (BullMQ job) |
| 17.2 | Create/update tickets from email | Parse subject/body, match by ticket ID in reply |
| 17.3 | Reply-by-email threading         | `References` / `In-Reply-To` header matching    |
| 17.4 | Live chat widget                 | `components/chat-widget.tsx`, Socket.IO-based   |
| 17.5 | Chat-to-ticket conversion        | Promote chat session to ticket                  |

---

## Dependency Graph (Simplified)

```
Phase 0 (Critical fixes)
  └── Phase 1 (shadcn/ui components)
       ├── Phase 2 (Notifications & Real-Time)
       │    └── Phase 3 (Attachments)
       │         └── Phase 4 (Search & Filtering)
       ├── Phase 5 (Admin Panel)
       │    ├── Phase 6 (Knowledge Base)
       │    ├── Phase 7 (Profile & Dashboard)
       │    └── Phase 9 (SLA)
       ├── Phase 8 (Advanced Tickets)
       │    └── Phase 10 (Advanced ITIL)
       └── Phase 11 (Enterprise Auth)
            └── Phase 12 (Asset Management)

Phase 13 (Reporting)        ← depends on many earlier phases
Phase 14 (Quality/Observability)  ← independent, parallel
Phase 15 (UX Polish)         ← independent, mostly frontend
Phase 16 (Security)          ← independent, parallel
Phase 17 (Multi-Channel)     ← depends on Phase 2
```

---

## Recommended Order of Execution

| Pri | Phase | Effort | Value |
|---|---|---|---|---|
| ✅ | Phase 0 — Critical Fixes | Small | Unlocks usability |
| ✅ | Phase 1 — shadcn/ui Components | Medium | Foundation for all UI |
| ✅ | Phase 2 — Notifications & Real-Time | Large | Users get feedback |
| ✅ | Phase 3 — Attachments | Medium | File sharing |
| ✅ | Phase 4 — Search & Filtering | Small | Usability |
| ✅ | Phase 5 — Admin Panel | Large | User/role mgmt |
| ✅ | Phase 6 — Knowledge Base | Large | Self-service articles |
| ✅ | Phase 7 — Profile & Dashboard | Medium | User self-service |
| ✅ | Phase 8 — Advanced Ticket Features | Large | Full-featured tickets |
| 1 | Phase 9 — SLA | Medium | Service quality |
| 2 | Phase 14 — Quality & Observability | Large | Production readiness |
| 3 | Phase 11 — Enterprise Auth | Large | University SSO |
| 4 | Phase 13 — Reporting | Large | Decision making |
| 5 | Remaining phases | Varies | Nice-to-have |

---

_Generated 2026-07-16. Update this file as priorities shift._
