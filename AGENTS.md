# AGENTS.md — UniSupport

> Guide for AI agents working on this codebase. Read this before making any changes.

---

## Project Overview

UniSupport is a university IT helpdesk system. Monorepo with 3 workspaces:

| Workspace            | Path               | Module system | Framework                                |
| -------------------- | ------------------ | ------------- | ---------------------------------------- |
| `@unisupport/api`    | `apps/api/`        | CommonJS      | NestJS 11, Prisma 6, PostgreSQL          |
| `@unisupport/web`    | `apps/web/`        | ESM           | React 19, Vite 7, Tailwind v4, shadcn/ui |
| `@unisupport/shared` | `packages/shared/` | ESM           | Types only (`ApiResponse<T>`)            |

---

## Build & Dev Commands

```bash
# Root (all workspaces)
npm run build          # build shared → api → web
npm run dev            # vite + nest watch concurrently
npm run lint           # eslint (flat config)
npm run lint:fix       # eslint --fix
npm run format         # prettier --write
npm run test           # jest in all workspaces

# API only
npm run build --workspace=apps/api
npm run test --workspace=apps/api
npm run test:cov --workspace=apps/api
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma

# Web only
npm run build --workspace=apps/web    # tsc -b && vite build
npm run dev --workspace=apps/web      # vite dev server
```

### Type checking (before committing)

```bash
# API
cd apps/api && npx tsc -p tsconfig.build.json --noEmit

# Web
cd apps/web && npx tsc -p tsconfig.json --noEmit
```

---

## Project Structure

```
unisupport/
├── apps/
│   ├── api/                     # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts          # Bootstrap (port 3001)
│   │   │   ├── app.module.ts    # Root module (28 feature modules)
│   │   │   ├── auth/            # JWT, MFA, SAML, login lockout
│   │   │   ├── tickets/         # CRUD, comments, tags, watchers, relations
│   │   │   ├── chat/            # Live chat, email polling, inbound webhook
│   │   │   ├── kb/              # Knowledge base articles + categories
│   │   │   ├── dashboard/       # Stats endpoint
│   │   │   ├── notifications/   # In-app notifications
│   │   │   ├── files/           # MinIO upload/download
│   │   │   ├── jobs/            # BullMQ workers (SLA, email)
│   │   │   ├── filters/         # Global exception filter
│   │   │   ├── config/          # Joi env validation
│   │   │   └── __tests__/       # Integration tests (real DB)
│   │   ├── prisma/
│   │   │   └── schema.prisma    # 32 models, 8 enums
│   │   ├── jest.config.ts       # Unit test config
│   │   └── tsconfig.build.json  # Build config (excludes tests)
│   └── web/                     # React SPA
│       ├── src/
│       │   ├── main.tsx         # Entry + i18n init
│       │   ├── App.tsx          # Routes (flat, no nesting)
│       │   ├── pages/           # Page components
│       │   ├── components/      # Shared + UI primitives
│       │   ├── hooks/           # use-auth, use-notifications, use-theme
│       │   ├── lib/             # api.ts (axios), utils.ts
│       │   └── i18n/            # en.json, vi.json, index.ts
│       └── vite.config.ts
├── packages/shared/             # Shared types
├── docker-compose.yml           # Dev infra (postgres, redis, minio, mailpit)
├── deploy.sh                    # Manual deploy
├── deploy-poll.sh               # Auto-deploy (cron, polls git)
└── package.json                 # Root workspace config
```

---

## Code Conventions

### Naming

| What             | Convention                      | Example                                   |
| ---------------- | ------------------------------- | ----------------------------------------- |
| Files            | kebab-case                      | `auth.service.ts`, `create-ticket.dto.ts` |
| Classes          | PascalCase                      | `AuthService`, `JwtAuthGuard`             |
| DTOs             | `*.dto.ts` with class-validator | `CreateTicketDto`                         |
| Guards           | `*.guard.ts`                    | `JwtAuthGuard`                            |
| Services         | `*.service.ts`                  | `TicketsService`                          |
| Controllers      | `*.controller.ts`               | `TicketsController`                       |
| React components | PascalCase files                | `TicketListPage`, `LangSwitch`            |
| React hooks      | `use-*.ts`                      | `use-auth.ts`, `use-theme.ts`             |

### Formatting (Prettier)

- Semicolons: yes
- Single quotes: yes
- Trailing commas: all
- Print width: 100
- Tab width: 2

### ESLint

- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: warn (allows `_` prefix)

---

## Backend Patterns

### API response format

Every controller method returns:

```typescript
{ success: true, message: '...', data: result }
```

### Route prefix

All API routes are prefixed with `/api`. Swagger at `/api/docs`. Health at `/api/health`.

### Authentication

- JWT access tokens (15min) + refresh tokens (7d)
- `JwtAuthGuard` on most endpoints
- Rate limiting: global 30/min, auth 3-10/min (Redis-backed)
- Login lockout: 5 failed attempts → 30min lockout

### Database

- Prisma ORM, PostgreSQL 16
- All PKs use `cuid()`
- Soft delete via `deletedAt DateTime?`
- Tables mapped to snake_case via `@@map()`
- RBAC: User → Role (many-to-one), Role ↔ Permission (many-to-many)

### Adding a new module

1. Create `src/<module>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`
2. Register in `app.module.ts` imports
3. Add Prisma model to `prisma/schema.prisma` if needed
4. Run `npx prisma migrate dev --schema=apps/api/prisma/schema.prisma`

---

## Frontend Patterns

### Routing

Flat `<Routes>` in `App.tsx` — no nested routes or layout routes. `ProtectedRoute` wrapper for auth.

### State management

- Server state: `@tanstack/react-query` v5
- Local state: `useState`/`useReducer`
- Auth: `AuthProvider` context via `use-auth.tsx`
- Forms: `react-hook-form` + `zod` validation

### API client

Axios instance in `lib/api.ts`:

- Base URL: `/api`
- Request interceptor: attaches Bearer token from localStorage
- Response interceptor: auto-refresh on 401 with queue

### UI components

shadcn/ui primitives in `components/ui/`. Use these, don't create new primitives unless needed.

### i18n

- Single `translation` namespace (all keys in one flat structure)
- `useTranslation()` with NO namespace arguments
- Keys: `auth.signIn`, `common.loading`, `page.tickets`, `ticket.subject`, etc.
- Vietnamese translations in `vi.json`

### Dark mode

- CSS variables in `styles.css` (`:root` and `.dark`)
- `@custom-variant dark (&:is(.dark *))` for class-based dark mode
- Use theme-aware classes: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`
- Never use hardcoded `slate-*`, `white`, `bg-white` for backgrounds/text — always use CSS variable classes

### Path alias

`@/*` maps to `./src/*` (configured in vite.config.ts and tsconfig.json)

---

## Testing

### Unit tests (Jest)

- Location: `apps/api/src/**/*.spec.ts` (co-located with source)
- Excludes: `*.integration.spec.ts`
- Mock PrismaService, external libs (otplib, qrcode)
- Run: `npm run test --workspace=apps/api`

### Integration tests

- Location: `apps/api/src/__tests__/`
- Use real PostgreSQL test DB
- Run migrations in `beforeAll`
- Excluded from default `jest` run

### E2E tests (Playwright)

- Location: `apps/web/e2e/`
- Flows: login, create ticket, admin users
- Run: `npm run test:e2e --workspace=apps/web`

---

## Deployment

### Manual

```bash
cd ~/unisupport && ./deploy.sh
```

### Auto (cron every 5 min)

`deploy-poll.sh` — polls git, deploys on new commits to `main`.

### What deploy.sh does

1. `git pull origin main`
2. `npm ci`
3. Build shared → API → Prisma generate → Prisma migrate → Build web
4. Copy `apps/web/dist/*` to `/srv/unisupport/web/`
5. `sudo systemctl restart unisupport-api.service`

### Infrastructure

- Docker Compose: PostgreSQL, Redis, MinIO, Mailpit (all on localhost)
- API runs as systemd service (`unisupport-api.service`)
- Frontend served as static files from `/srv/unisupport/web/`
- Nginx reverse proxy: `unisupport.lhtuan.site` → `localhost:3001` (API) + static files (web)

---

## Common Pitfalls

1. **API build**: Use `tsc -b tsconfig.build.json --force` for clean builds. Incremental builds can miss files.
2. **Docker containers**: Unisupport Docker containers (postgres, redis, minio, mailpit) may stop after server reboot. Run `docker compose up -d` from project root to restart.
3. **Prisma**: Always run `prisma generate` after changing `schema.prisma`.
4. **i18n**: Keys are flat in a single `translation` namespace. Do NOT use `useTranslation(['namespace'])` — use `useTranslation()` with no args.
5. **Dark mode**: Use `bg-background`, `text-foreground` etc. from CSS variables. Never use hardcoded color classes.
6. **Route prefix**: All API routes are under `/api`. Controller decorators don't include the prefix — it's added globally in `main.ts`.
7. **DTOs**: Always use `class-validator` decorators. The global `ValidationPipe` rejects unknown fields.
8. **File uploads**: Use MinIO via `FilesService`. Don't write to local disk.

---

## File Quick Reference

| File                                              | Purpose                               |
| ------------------------------------------------- | ------------------------------------- |
| `apps/api/src/main.ts`                            | Bootstrap, port, global pipes/filters |
| `apps/api/src/app.module.ts`                      | All module registrations              |
| `apps/api/prisma/schema.prisma`                   | Database schema                       |
| `apps/api/src/config/config.module.ts`            | Joi env validation                    |
| `apps/api/src/filters/global-exception.filter.ts` | Error handling                        |
| `apps/web/src/App.tsx`                            | All frontend routes                   |
| `apps/web/src/i18n/index.ts`                      | i18next config                        |
| `apps/web/src/i18n/en.json`                       | English translations (369 keys)       |
| `apps/web/src/i18n/vi.json`                       | Vietnamese translations               |
| `apps/web/src/styles.css`                         | Tailwind + CSS variables (dark mode)  |
| `apps/web/src/lib/api.ts`                         | Axios instance + interceptors         |
| `apps/web/src/hooks/use-auth.ts`                  | Auth context + token management       |
| `docker-compose.yml`                              | Dev infrastructure                    |
| `deploy.sh`                                       | Manual deploy script                  |
