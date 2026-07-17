# UniSupport — Project Reference

University IT Help Desk SaaS Platform (prototype). Monorepo with npm workspaces.

---

## Directory Tree

```
unisupport/
├── .env.example
├── docker-compose.yml          # Postgres 16, Redis 7, MinIO, Mailpit
├── package.json                # Root workspace config (CommonJS)
├── ROADMAP.md                  # Phased plan with progress
├── PROJECTS.md                 # ← this file
│
├── apps/api/                   # @unisupport/api — NestJS 11, Prisma 6
│   ├── prisma/
│   │   ├── schema.prisma       # 32 models, 8 enums
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── main.ts
│   ├── app.module.ts # 28 modules registered (incl. JobsModule)
│       ├── swagger.ts
│       ├── app.controller.ts   # GET /health
│       ├── assets/             # Phase 12: Asset, License, Checkout mgmt
│   ├── auth/ # JWT, register, login, MFA, password reset, SSO/SAML
│       ├── changes/            # Phase 10: Change requests + approvals
│       ├── chat/               # Phase 17: Live chat + inbound email
│       ├── config/
│       ├── dashboard/          # Agent dashboard stats
│       ├── departments/
│       ├── events/             # Socket.IO gateway (authenticated)
│       ├── files/              # MinIO file attachments
│       ├── filters/
│       ├── health/             # Terminus health checks
│       ├── kb/                 # Phase 7: Knowledge base
│       ├── known-errors/       # Phase 10: Known error DB
│       ├── minio/              # MinIO client config
│       ├── notifications/      # Phase 2: In-app notifications
│       ├── prisma/             # Global PrismaService
│       ├── problems/           # Phase 10: Problem records + ticket linking
│   ├── reports/ # Phase 13/18: Reports, analytics, CSAT, PDF export
│       ├── roles/              # RBAC role/permission management
│       ├── sentry/             # Phase 14: Sentry error tracking
│       ├── slas/               # Phase 9: SLA policies + calendars
│       ├── tickets/            # Core ticket CRUD + comments + history
│       ├── types/
│       └── users/              # User CRUD by admins
│
├── apps/web/                   # @unisupport/web — React 19 + Vite 7
│   ├── components.json         # shadcn/ui config
│   └── src/
│       ├── App.tsx             # All routes
│       ├── main.tsx
│       ├── styles.css          # Tailwind v4 + shadcn/ui vars
│       ├── components/
│       │   ├── ui/             # shadcn/ui primitives (button, input, badge, card, dialog, skeleton, etc.)
│       │   ├── app-layout.tsx
│       │   ├── breadcrumbs.tsx
│       │   ├── chat-widget.tsx
│       │   ├── confirm-dialog.tsx
│       │   ├── empty-state.tsx
│       │   └── protected-route.tsx
│       ├── hooks/
│       │   ├── use-auth.tsx
│       │   ├── use-notifications.tsx
│       │   ├── use-theme.ts
│       │   └── use-toast.tsx
│       ├── lib/
│       │   ├── api.ts          # Axios + auto-refresh
│       │   └── utils.ts        # cn() helper
│       └── pages/
│           ├── admin/
│           │   ├── layout.tsx
│           │   ├── users.tsx, roles.tsx, departments.tsx
│           │   ├── kb.tsx, slas.tsx
│           │   ├── problems.tsx, known-errors.tsx, changes.tsx
│           │   ├── assets.tsx, reports.tsx, chat.tsx
│           ├── login.tsx, register.tsx, mfa.tsx
│           ├── forgot-password.tsx, reset-password.tsx, change-password.tsx
│           ├── ticket-list.tsx, ticket-create.tsx, ticket-detail.tsx
│           ├── dashboard.tsx, profile.tsx
│           ├── kb-list.tsx, kb-article.tsx
│           ├── forbidden.tsx, not-found.tsx
│
└── packages/shared/            # @unisupport/shared — types only
    └── src/index.ts            # ApiResponse<T>
```

---

## Workspaces

| Package              | Path              | Type                     | Stack                                    |
| -------------------- | ----------------- | ------------------------ | ---------------------------------------- |
| `@unisupport/web`    | `apps/web`        | ESM (`"type": "module"`) | React 19, Vite 7, Tailwind v4, shadcn/ui |
| `@unisupport/api`    | `apps/api`        | CommonJS (default)       | NestJS 11, Prisma 6, PostgreSQL          |
| `@unisupport/shared` | `packages/shared` | ESM (`"type": "module"`) | TypeScript (types only)                  |

---

## Key Scripts

**From root:**

| Script             | Action                                     |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Web (Vite) + API (Nest watch) concurrently |
| `npm run dev:web`  | Vite dev server only                       |
| `npm run dev:api`  | Nest watch only                            |
| `npm run build`    | Build all workspaces                       |
| `npm run test`     | Runs `test` script in every workspace      |
| `npm run lint`     | `eslint .`                                 |
| `npm run lint:fix` | `eslint . --fix`                           |
| `npm run format`   | `prettier --write .`                       |
| `npm run prepare`  | `husky` (auto-run on install)              |

**From `apps/api`:**

| Script                    | Action                 |
| ------------------------- | ---------------------- |
| `npm run start:dev`       | Nest watch + restart   |
| `npm run build`           | Nest compile           |
| `npm run start:prod`      | `node dist/main`       |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate`  | `prisma migrate dev`   |
| `npm run prisma:studio`   | Prisma Studio GUI      |

**From `apps/web`:**

| Script            | Action                         |
| ----------------- | ------------------------------ |
| `npm run dev`     | Vite dev server                |
| `npm run build`   | `tsc -b && vite build`         |
| `npm run preview` | Serve production build locally |

**From `packages/shared`:**

| Script          | Action                 |
| --------------- | ---------------------- |
| `npm run build` | `tsc -p tsconfig.json` |

---

## Dev Setup

```bash
# 1. Install workspace deps
npm install

# 2. Start infrastructure (Docker required)
docker compose up -d

# 3. Copy .env
cp .env.example .env

# 4. Run database migrations
npm run prisma:migrate --workspace apps/api

# 5. Seed database (admin user + roles + permissions)
npm run prisma:seed --workspace apps/api

# 6. Start dev
npm run dev
```

Web → `http://localhost:5173` | API → `http://localhost:3001/api/health`

---

## Environment Variables

| Var                  | Default                 | Required |
| -------------------- | ----------------------- | -------- |
| `NODE_ENV`           | `development`           |          |
| `PORT`               | `3001`                  |          |
| `WEB_ORIGIN`         | `http://localhost:5173` |          |
| `DATABASE_URL`       | —                       | **Yes**  |
| `REDIS_URL`          | —                       | **Yes**  |
| `MINIO_ENDPOINT`     | —                       | **Yes**  |
| `MINIO_PORT`         | —                       | **Yes**  |
| `MINIO_ACCESS_KEY`   | —                       | **Yes**  |
| `MINIO_SECRET_KEY`   | —                       | **Yes**  |
| `JWT_SECRET`         | —                       | **Yes**  |
| `JWT_REFRESH_SECRET` | —                       | **Yes**  |
| `WEBHOOK_SECRET`     | —                       | **Yes**  |
| `SENTRY_DSN`         | —                       | No       |

Validated on startup via Joi in `apps/api/src/config/config.module.ts`.

---

## API Endpoints

### Health

| Method | Path      | Auth | Action        |
| ------ | --------- | ---- | ------------- |
| GET    | `/health` | No   | Server status |

### Auth (`/auth`)

| Method | Path               | Auth | Action                        |
| ------ | ------------------ | ---- | ----------------------------- |
| POST   | `/register`        | No   | Register (3/min rate limit)   |
| POST   | `/login`           | No   | Login (10/min rate limit)     |
| POST   | `/refresh`         | No   | Rotate refresh token          |
| POST   | `/logout`          | Yes  | Revoke session                |
| GET    | `/me`              | Yes  | Current user with permissions |
| POST   | `/mfa/verify`      | Yes  | Verify TOTP code              |
| GET    | `/me/export`       | Yes  | Export user data (Phase 16)   |
| DELETE | `/me/anonymize`    | Yes  | Anonymize account (Phase 16)  |
| POST   | `/forgot-password` | No   | Send reset email (3/min)      |
| POST   | `/reset-password`  | No   | Reset with token              |
| POST   | `/change-password` | Yes  | Change password               |

### Tickets (`/tickets`)

| Method | Path             | Auth | Action                           |
| ------ | ---------------- | ---- | -------------------------------- |
| GET    | `/`              | Yes  | List tickets (role-scoped)       |
| POST   | `/`              | Yes  | Create ticket                    |
| GET    | `/:id`           | Yes  | Get ticket with comments/history |
| PATCH  | `/:id`           | Yes  | Update ticket                    |
| POST   | `/:id/comments`  | Yes  | Add comment                      |
| POST   | `/:id/watchers`  | Yes  | Watch/resolve ticket             |
| POST   | `/:id/rate`      | Yes  | CSAT rating 1-5 with feedback    |
| GET    | `/templates`     | Yes  | List ticket templates            |
| POST   | `/templates`     | Yes  | Create template                  |
| PATCH  | `/templates/:id` | Yes  | Update template                  |
| DELETE | `/templates/:id` | Yes  | Delete template                  |
| GET    | `/csv`           | Yes  | CSV export                       |

### Admin / Users/Roles/Departments

| Method | Path               | Auth  | Action                 |
| ------ | ------------------ | ----- | ---------------------- |
| GET    | `/users`           | admin | List users             |
| POST   | `/users`           | admin | Create user            |
| PATCH  | `/users/:id`       | admin | Update user            |
| DELETE | `/users/:id`       | admin | Soft-delete user       |
| GET    | `/roles`           | admin | List roles             |
| POST   | `/roles`           | admin | Create role            |
| PATCH  | `/roles/:id`       | admin | Update role            |
| DELETE | `/roles/:id`       | admin | Delete role            |
| GET    | `/departments`     | admin | List departments       |
| POST   | `/departments`     | admin | Create department      |
| PATCH  | `/departments/:id` | admin | Update department      |
| DELETE | `/departments/:id` | admin | Soft-delete department |

### Notifications (`/notifications`)

| Method | Path        | Auth | Action                  |
| ------ | ----------- | ---- | ----------------------- |
| GET    | `/`         | Yes  | List user notifications |
| PATCH  | `/:id/read` | Yes  | Mark as read            |
| POST   | `/read-all` | Yes  | Mark all read           |

### Dashboard (`/dashboard`)

| Method | Path     | Auth | Action                 |
| ------ | -------- | ---- | ---------------------- |
| GET    | `/stats` | Yes  | Ticket stats by status |

### Files (`/files`)

| Method | Path      | Auth | Action          |
| ------ | --------- | ---- | --------------- |
| POST   | `/upload` | Yes  | Upload to MinIO |
| GET    | `/:key`   | Yes  | Download        |
| DELETE | `/:key`   | Yes  | Delete          |

### Knowledge Base (`/kb`)

| Method | Path           | Auth | Action                |
| ------ | -------------- | ---- | --------------------- |
| GET    | `/`            | Yes  | List articles         |
| POST   | `/`            | Yes  | Create article        |
| GET    | `/:slug`       | Yes  | Get article           |
| PATCH  | `/:id`         | Yes  | Update article        |
| DELETE | `/:id`         | Yes  | Delete article        |
| POST   | `/:id/publish` | Yes  | Toggle publish status |

### SLA (`/slas`)

| Method | Path             | Auth | Action            |
| ------ | ---------------- | ---- | ----------------- |
| GET    | `/policies`      | Yes  | List SLA policies |
| POST   | `/policies`      | Yes  | Create policy     |
| PATCH  | `/policies/:id`  | Yes  | Update policy     |
| DELETE | `/policies/:id`  | Yes  | Delete policy     |
| GET    | `/calendars`     | Yes  | List calendars    |
| POST   | `/calendars`     | Yes  | Create calendar   |
| PATCH  | `/calendars/:id` | Yes  | Update calendar   |
| DELETE | `/calendars/:id` | Yes  | Delete calendar   |

### Problems (Phase 10, `/problems`)

| Method | Path           | Auth | Action                 |
| ------ | -------------- | ---- | ---------------------- |
| GET    | `/`            | Yes  | List problems          |
| POST   | `/`            | Yes  | Create problem         |
| GET    | `/:id`         | Yes  | Get problem + tickets  |
| PATCH  | `/:id`         | Yes  | Update problem         |
| DELETE | `/:id`         | Yes  | Delete problem         |
| POST   | `/:id/tickets` | Yes  | Link ticket to problem |

### Known Errors (Phase 10, `/known-errors`)

| Method | Path   | Auth | Action             |
| ------ | ------ | ---- | ------------------ |
| GET    | `/`    | Yes  | List known errors  |
| POST   | `/`    | Yes  | Create known error |
| PATCH  | `/:id` | Yes  | Update             |
| DELETE | `/:id` | Yes  | Delete             |

### Changes (Phase 10, `/changes`)

| Method | Path                       | Auth | Action                  |
| ------ | -------------------------- | ---- | ----------------------- |
| GET    | `/`                        | Yes  | List change requests    |
| POST   | `/`                        | Yes  | Create change request   |
| PATCH  | `/:id`                     | Yes  | Update status           |
| DELETE | `/:id`                     | Yes  | Delete                  |
| PATCH  | `/:changeId/approvals/:id` | Yes  | Approve/reject approval |

### Assets (Phase 12, `/assets`)

| Method | Path             | Auth | Action            |
| ------ | ---------------- | ---- | ----------------- |
| GET    | `/`              | Yes  | List assets       |
| POST   | `/`              | Yes  | Create asset      |
| PATCH  | `/:id`           | Yes  | Update asset      |
| DELETE | `/:id`           | Yes  | Delete asset      |
| POST   | `/:id/assign`    | Yes  | Assign to user    |
| DELETE | `/:id/assign`    | Yes  | Unassign          |
| GET    | `/licenses`      | Yes  | List licenses     |
| POST   | `/licenses`      | Yes  | Create license    |
| PATCH  | `/licenses/:id`  | Yes  | Update license    |
| POST   | `/:id/checkout`  | Yes  | Checkout hardware |
| PATCH  | `/checkouts/:id` | Yes  | Checkin hardware  |

### Reports (Phase 13, `/reports`)

| Method | Path                 | Auth | Action                                  |
| ------ | -------------------- | ---- | --------------------------------------- |
| GET    | `/ticket-volume`     | Yes  | Tickets over time (chart)               |
| GET    | `/sla-compliance`    | Yes  | SLA hit/miss rates                      |
| GET    | `/agent-performance` | Yes  | Agent resolution metrics                |
| GET    | `/csat`              | Yes  | CSAT scores (avg, distribution, recent) |
| GET    | `/export/csv`        | Yes  | CSV export                              |
| GET    | `/export/pdf`        | Yes  | PDF export                              |

### Chat (Phase 17, `/chat`)

| Method | Path                               | Auth | Action                    |
| ------ | ---------------------------------- | ---- | ------------------------- |
| POST   | `/conversations`                   | No   | Create (visitor)          |
| POST   | `/conversations/:id/messages`      | No   | Send message (visitor)    |
| GET    | `/conversations/:id/messages`      | No   | Fetch messages (by email) |
| GET    | `/conversations`                   | Yes  | List all (agent)          |
| GET    | `/conversations/:id`               | Yes  | Detail with messages      |
| POST   | `/conversations/:id/agent-message` | Yes  | Reply as agent            |
| PATCH  | `/conversations/:id/close`         | Yes  | Close conversation        |
| POST   | `/conversations/:id/convert`       | Yes  | Convert to ticket         |
| POST   | `/inbound-email`                   | No   | Email webhook (30/min)    |

### Rate Limiting

| Endpoint                                | Limit per minute |
| --------------------------------------- | ---------------- |
| Global (default)                        | 30               |
| `POST /auth/login`                      | 10               |
| `POST /auth/register`                   | 3                |
| `POST /auth/forgot-password`            | 3                |
| `POST /chat/inbound-email`              | 30               |
| `POST /chat/conversations/:id/messages` | 20               |

---

## Database Schema (Prisma)

### Enums (8)

| Enum             | Values                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `UserStatus`     | `ACTIVE` `INACTIVE` `SUSPENDED`                                                                                |
| `TicketStatus`   | `OPEN` `IN_PROGRESS` `PENDING` `RESOLVED` `CLOSED`                                                             |
| `ProblemStatus`  | `IDENTIFIED` `INVESTIGATING` `KNOWN_ERROR` `RESOLVED` `CLOSED`                                                 |
| `ChangeStatus`   | `DRAFT` `PENDING_APPROVAL` `APPROVED` `IN_PROGRESS` `IMPLEMENTED` `REVIEWED` `CLOSED` `ROLLED_BACK` `REJECTED` |
| `ApprovalStatus` | `PENDING` `APPROVED` `REJECTED`                                                                                |
| `TicketPriority` | `LOW` `MEDIUM` `HIGH` `URGENT`                                                                                 |
| `AssetType`      | `HARDWARE` `SOFTWARE` `NETWORK` `PERIPHERAL` `OTHER`                                                           |
| `AssetStatus`    | `AVAILABLE` `ASSIGNED` `RETIRED` `UNDER_MAINTENANCE`                                                           |

### Models (32)

| Model                | Key Fields                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `User`               | email, passwordHash, roleId?, departmentId?, status, totpSecret?, emailVerifiedAt?, samlId?                          |
| `Role`               | name (unique), permissions (M2M)                                                                                     |
| `Permission`         | name (unique), roles (M2M)                                                                                           |
| `Department`         | name (unique), soft-delete                                                                                           |
| `Session`            | userId, refreshTokenHash, expiresAt                                                                                  |
| `Ticket`             | subject, description, status, priority, requesterId, assigneeId?, departmentId?, resolvedAt?, closedAt?, soft-delete |
| `Tag`                | name, color                                                                                                          |
| `TicketTag`          | ticketId, tagId (M2M join)                                                                                           |
| `TicketTemplate`     | name, subject, description, priority, category?                                                                      |
| `Comment`            | content, ticketId, authorId                                                                                          |
| `TicketHistory`      | ticketId, userId, field, oldValue, newValue                                                                          |
| `TicketWatcher`      | ticketId, userId                                                                                                     |
| `TicketRelation`     | ticketId, relatedTicketId, type                                                                                      |
| `ArticleCategory`    | name, slug, parentId?                                                                                                |
| `Article`            | title, slug, content, categoryId, authorId, published                                                                |
| `Attachment`         | filename, mimeType, size, objectName, ticketId?                                                                      |
| `TimeEntry`          | ticketId, userId, minutes, description                                                                               |
| `Notification`       | userId, type, title, message, link, read                                                                             |
| `PasswordResetToken` | userId, token, expiresAt, used                                                                                       |
| `Sla`                | name, responseTime, resolutionTime, priority, calendar                                                               |
| `SlaCalendar`        | name, timezone, businessHours, holidays                                                                              |
| `Problem`            | subject, description, status, resolvedAt?, rootCause?                                                                |
| `ProblemTicket`      | problemId, ticketId                                                                                                  |
| `KnownError`         | subject, description, workaround?, solution?, category?                                                              |
| `ChangeRequest`      | subject, description, status, riskLevel, plannedStart, plannedEnd                                                    |
| `Approval`           | changeId, approverId?, role?, status, comment                                                                        |
| `Asset`              | name, type, status, serialNumber?, model?, purchaseDate?, warrantyUntil?                                             |
| `AssetAssignment`    | assetId, userId, assignedAt, returnedAt?                                                                             |
| `SoftwareLicense`    | name, key, seats, vendor, expiresAt?                                                                                 |
| `HardwareCheckout`   | assetId, userId, checkedOutAt, checkedInAt?, dueDate                                                                 |
| `ChatConversation`   | subject?, visitorName?, visitorEmail?, status (ACTIVE/CLOSED), ticketId?                                             |
| `ChatMessage`        | conversationId, content, senderType (VISITOR/AGENT), senderId?, senderName?                                          |
| `TicketRating`       | ticketId, userId, rating (1-5), feedback?, createdAt                                                                 |

All PKs use `cuid()`. Soft delete via `deletedAt DateTime?` on User/Ticket/Department/Comment.

---

## Seed Data

| Entity      | Values                                                            |
| ----------- | ----------------------------------------------------------------- |
| Permissions | `ticket:read`, `ticket:write`, `ticket:assign`, `user:manage`     |
| Roles       | `admin` (all 4), `agent` (read/write/assign), `user` (read/write) |
| Admin user  | `admin@unisupport.local` / `admin123`                             |

---

## Frontend Routing (`App.tsx`)

| Path                  | Component              | Auth Required |
| --------------------- | ---------------------- | ------------- |
| `/login`              | `LoginPage`            | No            |
| `/register`           | `RegisterPage`         | No            |
| `/mfa`                | `MfaPage`              | No            |
| `/forgot-password`    | `ForgotPasswordPage`   | No            |
| `/reset-password`     | `ResetPasswordPage`    | No            |
| `/tickets`            | `TicketListPage`       | Yes           |
| `/tickets/new`        | `CreateTicketPage`     | Yes           |
| `/tickets/:id`        | `TicketDetailPage`     | Yes           |
| `/dashboard`          | `DashboardPage`        | Yes           |
| `/profile`            | `ProfilePage`          | Yes           |
| `/change-password`    | `ChangePasswordPage`   | Yes           |
| `/kb`                 | `KbListPage`           | Yes           |
| `/kb/:slug`           | `KbArticlePage`        | Yes           |
| `/admin/users`        | `AdminUsersPage`       | auth + guard  |
| `/admin/roles`        | `AdminRolesPage`       | auth + guard  |
| `/admin/departments`  | `AdminDepartmentsPage` | auth + guard  |
| `/admin/kb`           | `AdminKbPage`          | auth + guard  |
| `/admin/slas`         | `AdminSlasPage`        | auth + guard  |
| `/admin/reports`      | `AdminReportsPage`     | auth + guard  |
| `/admin/problems`     | `AdminProblemsPage`    | auth + guard  |
| `/admin/known-errors` | `AdminKnownErrorsPage` | auth + guard  |
| `/admin/changes`      | `AdminChangesPage`     | auth + guard  |
| `/admin/assets`       | `AdminAssetsPage`      | auth + guard  |
| `/admin/chat`         | `AdminChatPage`        | auth + guard  |
| `/saml-callback`      | `SamlCallbackPage`     | No            |
| `/forbidden`          | `ForbiddenPage`        | No            |
| `*`                   | `NotFoundPage`         | No            |

Uses `BrowserRouter`, `AuthProvider`, `QueryClientProvider` (TanStack Query), `ProtectedRoute` wrapper.

---

## Auth Context (`use-auth.tsx`)

Provides `user`, `loading`, `login()`, `register()`, `logout()`, `refreshUser()` via React context. Stores tokens in `localStorage`. Auto-fetches `/auth/me` on mount. Handles MFA flow. Checks `user:manage` permission for admin UI visibility.

---

## API Client (`lib/api.ts`)

Axios instance with:

- `baseURL: '/api'`
- Request interceptor: attaches `Bearer` token
- Response interceptor: on 401, queues concurrent requests and refreshes token once; on failure redirects to `/login`

---

## Key Frontend Components

| Component             | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `app-layout.tsx`      | Main layout: navbar, notification bell, dark mode toggle, logout, admin dropdown |
| `breadcrumbs.tsx`     | Auto-breadcrumb from route path segments                                         |
| `empty-state.tsx`     | Centered icon + title + message + optional action                                |
| `confirm-dialog.tsx`  | Confirmation modal for destructive actions                                       |
| `chat-widget.tsx`     | Floating live chat widget (REST polling, visitor-facing)                         |
| `csat-survey.tsx`     | Star-rating widget for ticket satisfaction                                       |
| `protected-route.tsx` | Route guard: redirects to `/login` if unauthenticated                            |
| `use-theme.ts`        | Dark mode: localStorage + system preference, toggles `.dark` class               |

### shadcn/ui Components Used

`button`, `input`, `badge`, `card`, `dialog`, `dropdown-menu`, `skeleton`, `select`, `avatar`, `toast`, `checkbox`

---

## Build Artifacts (gitignored)

- `dist/`, `*.tsbuildinfo`
- `node_modules/`, `coverage/`
- `.env`, `.env.*` (except `.env.example`)

---

## Commit History

```
<latest>  feat: all 17 phases — polishing, bugfixes, chat, admin pages
18de992  feat: project foundation — tooling, API hardening, Prisma, Tailwind/shadcn
7604b77  chore: ignore generated build artifacts
e2bfe0c  feat: scaffold UniSupport starter monorepo
fe0b2aa  Initial commit
```

---

_Generated 2026-07-16. Update this file when the project structure changes._
