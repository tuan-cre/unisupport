# Architecture Philosophy

UniSupport follows a **Modular Monolith Architecture**.

Goals:

- Production-style architecture
- Easy development for a team
- Maintainable codebase
- Suitable for SaaS scale

Not using:

- Microservices
- Kubernetes
- Kafka
- GraphQL
- Elasticsearch

because the current system scale does not require them.

---

# Technology Stack

## Frontend

### Core

| Technology   | Purpose             |
| ------------ | ------------------- |
| React 19     | Frontend framework  |
| Vite         | Build tool          |
| TypeScript   | Type safety         |
| npm          | Package manager     |
| React Router | Client-side routing |

### UI System

| Technology      | Purpose                    |
| --------------- | -------------------------- |
| Tailwind CSS v4 | Styling system             |
| shadcn/ui       | Customizable UI components |

Main components: Button, Dialog, Dropdown, Table, Form, Calendar, Toast, Pagination, Command Menu

### State Management

#### Server State — TanStack Query

Handles: API requests, Cache, Loading state, Server synchronization

Managed data: Tickets, Users, Comments, Notifications, Knowledge Articles

#### Client State — Zustand

Handles: Sidebar, Theme, Modal, UI preferences

### Forms & Validation

| Technology      | Purpose           |
| --------------- | ----------------- |
| React Hook Form | Form handling     |
| Zod             | Client validation |

Used for: Login, Register, Ticket creation, Profile update, Admin forms

### HTTP & Realtime

| Technology       | Purpose                |
| ---------------- | ---------------------- |
| Axios            | HTTP Client            |
| Socket.IO Client | Realtime communication |

Realtime features: Ticket status update, Comments, Assignment notification, User presence

---

## Backend

### Core

| Technology | Purpose              |
| ---------- | -------------------- |
| NestJS     | Backend framework    |
| TypeScript | Programming language |
| REST API   | API architecture     |

### Backend Validation

Technologies: `class-validator`, `class-transformer`

Request flow: `Request → DTO Validation → Controller → Service → Database`

---

# Database

## PostgreSQL

Main relational database. Used for: Users, Tickets, Departments, Permissions, Knowledge Base, Audit data.

## Prisma ORM

Benefits: Type-safe queries, Migration management, Clean database access, Strong TypeScript integration.

---

# Authentication

```
Login → Generate Access Token → Generate Refresh Token → Hash Refresh Token → Store Session → Send Refresh Token via HttpOnly Cookie
```

Using: JWT Access Token, Refresh Token, HttpOnly Cookie, Refresh Token Hash.

## Session Management

Instead of storing refresh token directly in users table, a separate `Sessions` table stores: `id`, `user_id`, `refresh_token_hash`, `device`, `ip_address`, `created_at`, `expires_at`, `revoked_at`.

Benefits: Multi-device login, Session management, Device revoke, Better security.

---

# Authorization — RBAC + Policy Based Authorization

Architecture: `RBAC + Policy Layer`

RBAC checks: "Does user have this permission?"
Policy checks: "Can user perform this action on this resource?"

Optional: CASL

Database: Users → Roles → Permissions → Role Permissions

Permissions example: `ticket:create`, `ticket:update`, `ticket:assign`, `ticket:close`, `user:create`, `knowledge:publish`

---

# Cache & Background Jobs

## Redis

Used for: Cache, BullMQ queue, Socket.IO adapter, Rate limiting, Temporary data.

## BullMQ

Background job system. Jobs: Email sending, Notification processing, SLA checking, Report exporting.

Flow: `Create Ticket → Queue → Worker → Send Email`

---

# Realtime System — Socket.IO

- Backend: NestJS Gateway
- Frontend: Socket.IO Client

Used for: Ticket updates, Comments, Assignment notification, User presence.

Scaling via Redis adapter across NestJS instances.

---

# File Storage — MinIO

S3 compatible object storage. Stores: Avatars, Images, PDFs, DOCX, ZIPs, Ticket attachments.

Flow: `Frontend → NestJS API → MinIO`

Production alternatives: AWS S3, Cloudflare R2, DigitalOcean Spaces.

### File Security (Optional)

`Upload → MinIO → ClamAV Scan → Accept / Reject`

---

# Email System

Development: `NestJS → BullMQ → SMTP → Mailpit`

Mail UI: `localhost:8025`

Production alternatives: Amazon SES, Brevo, Mailgun, SMTP Provider.

Email templates: `ticket-created.html`, `ticket-assigned.html`, `ticket-closed.html` (Handlebars).

---

# Logging & Monitoring

## Logging — Pino

Used for: Request logging, Debugging, Production analysis.

## Error Tracking — Sentry (Optional)

Used for: Exception tracking, Error alerting, Production debugging.

## Observability — OpenTelemetry (Future)

For: Metrics, Tracing, Performance monitoring.

---

# API Documentation — Swagger

Endpoint: `/api/docs` — includes endpoints, request/response schemas, authentication, error format.

## API Response Standard

**Success:**

```json
{ "success": true, "message": "Ticket created", "data": {} }
```

**Pagination:**

```json
{ "success": true, "data": [], "meta": { "page": 1, "limit": 10, "total": 100 } }
```

**Error:**

```json
{ "success": false, "message": "Validation failed", "errors": [] }
```

---

# Database Strategy

Principles: Normalized database, Avoid duplicated data, Clear relationships.

## Soft Delete

Using `deleted_at` on: Users, Tickets, Categories, Departments, Knowledge Articles.

Not applied to Audit Logs or Activity Logs (historical records should remain immutable).

---

# Code Quality

| Tool        | Purpose           |
| ----------- | ----------------- |
| ESLint      | Code quality      |
| Prettier    | Formatting        |
| Husky       | Git hooks         |
| lint-staged | Pre-commit checks |

Workflow: `git commit → Husky → Lint → Format → Commit`

---

# Testing

## Backend — Jest

Unit tests: Auth Service, Ticket Service, Permission Service, SLA Service.
Integration tests: REST API, Database flow, Authentication flow.

## Frontend — Vitest + React Testing Library

Testing: Components, Hooks, Forms, UI behavior.

## End-to-End — Playwright

Testing: Login flow, Ticket creation, User workflow.

---

# DevOps

## Development Environment

Docker Compose: PostgreSQL, Redis, MinIO, Mailpit.

## Production Architecture

```
Nginx → Frontend + Backend → Worker → PostgreSQL / Redis / MinIO
```

## Backup Strategy

`pg_dump` + scheduled backup. Important: Users, Tickets, Audit logs, Knowledge articles.

---

# Git Workflow

GitHub Flow: `Feature Branch → Pull Request → Code Review → Merge main`

## CI/CD — GitHub Actions

Pipeline: `Push/PR → Install deps → Lint → Test → Build → Deploy`

---

# Final Architecture

```
Frontend (React 19 / Vite / TypeScript / Tailwind / shadcn/ui / React Router / TanStack Query / Zustand / Axios / Socket.IO)

        ↓

Backend (NestJS / REST API / Prisma / PostgreSQL)

        ↓

Redis (BullMQ + Socket.IO Adapter)

        ↓

MinIO (File Storage)

        ↓

SMTP (Email System)

        ↓

Pino / Sentry / OpenTelemetry
```

---

# Project Goal

UniSupport is built for:

- Real-world SaaS architecture
- Full-stack engineering practice
- Portfolio development
- Team collaboration
- Production workflow experience
