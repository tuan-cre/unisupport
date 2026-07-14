# UniSupport — Project Reference

University IT Help Desk SaaS Platform. Monorepo with npm workspaces.

---

## Directory Tree

```
unisupport/
├── .env.example               # Env var template
├── .gitignore
├── .husky/pre-commit           # Runs lint-staged
├── .prettierrc                 # Prettier config
├── .prettierignore
├── .vscode/extensions.json     # Recommended VS Code extensions
├── docker-compose.yml          # Postgres 16, Redis 7, MinIO, Mailpit
├── eslint.config.js            # ESLint flat config (CommonJS)
├── LICENSE                     # MIT
├── package.json                # Root workspace config (type: commonjs)
├── package-lock.json
├── README.md
├── PROJECTS.md                 # ← this file
│
├── apps/
│   ├── api/                    # @unisupport/api — NestJS 11
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── app.controller.ts
│   │       ├── config/config.module.ts
│   │       └── prisma/
│   │           ├── prisma.module.ts
│   │           └── prisma.service.ts
│   │
│   └── web/                    # @unisupport/web — React 19 + Vite 7
│       ├── components.json     # shadcn/ui config
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── styles.css
│           ├── lib/utils.ts
│           └── components/ui/button.tsx
│
├── packages/shared/            # @unisupport/shared
│   ├── package.json
│   ├── tsconfig.json
│   └── src/index.ts
│
└── docs/                       # (empty — reserved for future docs)
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

# 3. Create .env from example
cp .env.example .env

# 4. Run database migrations
npm run prisma:migrate --workspace apps/api

# 5. Start dev
npm run dev
```

Web → `http://localhost:5173` | API → `http://localhost:3001/health`

---

## Environment Variables

| Var                | Default                 | Required |
| ------------------ | ----------------------- | -------- |
| `NODE_ENV`         | `development`           |          |
| `PORT`             | `3001`                  |          |
| `WEB_ORIGIN`       | `http://localhost:5173` |          |
| `DATABASE_URL`     | —                       | **Yes**  |
| `REDIS_URL`        | —                       | **Yes**  |
| `MINIO_ENDPOINT`   | —                       | **Yes**  |
| `MINIO_PORT`       | —                       | **Yes**  |
| `MINIO_ACCESS_KEY` | —                       | **Yes**  |
| `MINIO_SECRET_KEY` | —                       | **Yes**  |

Validated on startup via Joi in `apps/api/src/config/config.module.ts`. Missing required vars crash the API immediately (fail-fast).

---

## API Source Code

**`src/main.ts`**: Bootstrap. Creates NestJS app, enables CORS (origin from `WEB_ORIGIN`, defaults to `localhost:5173`), registers global `ValidationPipe` (whitelist + transform + forbidNonWhitelisted), reads `PORT`.

**`src/app.module.ts`**: Root module. Imports `AppConfigModule` (global, env validation) and `PrismaModule` (global PrismaService). Controller: `AppController`.

**`src/app.controller.ts`**: Single endpoint:

- `GET /health` → `{ success: true, message: "UniSupport API is running" }`

**`src/config/config.module.ts`**: `ConfigModule.forRoot` with `isGlobal: true`. Validates env vars with Joi.

**`src/prisma/prisma.service.ts`**: Extends `PrismaClient`, implements `OnModuleInit` → calls `$connect()`.

**`src/prisma/prisma.module.ts`**: `@Global()` module providing `PrismaService`.

---

## Database Schema (Prisma — `apps/api/prisma/schema.prisma`)

| Model        | Table         | Key Fields                                                                                                                                                      |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`       | `users`       | email (unique), passwordHash, firstName, lastName, status (Active/Inactive/Suspended), roleId?, departmentId?, soft-delete                                      |
| `Role`       | `roles`       | name (unique), permissions (M2M implicit)                                                                                                                       |
| `Permission` | `permissions` | name (unique), roles (M2M implicit)                                                                                                                             |
| `Department` | `departments` | name (unique), soft-delete                                                                                                                                      |
| `Session`    | `sessions`    | userId (FK), refreshTokenHash, device?, ipAddress?, expiresAt, revokedAt?                                                                                       |
| `Ticket`     | `tickets`     | subject, description, status (Open/InProgress/Pending/Resolved/Closed), priority (Low/Medium/High/Urgent), requesterId, assigneeId?, departmentId?, soft-delete |
| `Comment`    | `comments`    | content, ticketId (FK, cascade delete), authorId, soft-delete                                                                                                   |

Relations:

- User → Role (optional M:1)
- User → Department (optional M:1)
- User → Session (1:M)
- User → Ticket (1:M as requester + 1:M as assignee)
- User → Comment (1:M)
- Role ↔ Permission (implicit M2M)
- Department → Ticket (1:M)
- Ticket → Comment (1:M, cascade delete)

All primary keys use `cuid()`. Soft delete via `deletedAt DateTime?`. Immutable records (audit logs) don't use soft delete.

---

## Frontend Source

### Entry: `src/main.tsx`

Renders `<App />` in `<StrictMode>`, imports `styles.css`.

### App: `src/App.tsx`

Landing page with centered hero card, heading, description, a "Get started" (`<Button variant="default">`) and "Documentation" (`<Button variant="outline">`).

### Styles: `src/styles.css`

Tailwind v4 setup:

- `@import 'tailwindcss'` + `@import 'tw-animate-css'`
- `@custom-variant dark` → `.dark *`
- `:root` / `.dark` CSS variables (background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, radius)
- `@theme inline` block mapping CSS vars to Tailwind tokens
- `@layer base` applying `border-border` and `bg-background text-foreground` to body

### shadcn/ui Components

| File                           | Component                                         |
| ------------------------------ | ------------------------------------------------- |
| `src/components/ui/button.tsx` | `Button` + `ButtonProps` + `buttonVariants` (cva) |

Button variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
Button sizes: `default`, `sm`, `lg`, `icon`
Supports `asChild` via `@radix-ui/react-slot`.

### Utils: `src/lib/utils.ts`

`cn(...inputs)` → `twMerge(clsx(inputs))` utility for class merging.

---

## Shared Package

**`packages/shared/src/index.ts`** — Exports:

```ts
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};
```

---

## Code Quality Tooling

### ESLint — `eslint.config.js` (flat config, CJS)

- Base: `@eslint/js` recommended + `typescript-eslint` recommended
- Prettier integration via `eslint-config-prettier` (disables conflicting rules, last in chain)
- Globals: Node + browser (union for monorepo)
- Custom rules: `no-explicit-any: warn`, `no-unused-vars: warn` (ignore `_` prefix)
- Ignores: `dist/`, `node_modules/`, `coverage/`, `*.config.js`, `*.config.ts`

### Prettier — `.prettierrc`

- semi: true, singleQuote: true, trailingComma: all, printWidth: 100, tabWidth: 2

### Husky + lint-staged

- `.husky/pre-commit` runs `npx lint-staged`
- lint-staged: `*.{ts,tsx,js,jsx}` → `eslint --fix` + `prettier --write`; `*.{json,md,css,html}` → `prettier --write`

---

## Docker Stack (`docker-compose.yml`)

| Service    | Image              | Ports                         | Notes                      |
| ---------- | ------------------ | ----------------------------- | -------------------------- |
| PostgreSQL | postgres:16-alpine | 5432                          | DB: unisupport             |
| Redis      | redis:7-alpine     | 6379                          |                            |
| MinIO      | minio/minio:latest | 9000 (S3 API), 9001 (Console) | Root user/pass: minioadmin |
| Mailpit    | axllent/mailpit    | 1025 (SMTP), 8025 (UI)        | Dev mail catcher           |

---

## Architecture Notes

- **Modular Monolith** — not microservices. No Kafka, GraphQL, or Elasticsearch.
- **Default branch**: `main`. GitHub Flow for PRs.
- **Future stack** (documented but not installed): TanStack Query, Zustand, React Hook Form, Zod, Axios, Socket.IO, BullMQ, Sentry, Pino, Swagger, Playwright.

---

## Build Artifacts (gitignored)

- `dist/` — any depth (TS/Vite output)
- `*.tsbuildinfo` — TypeScript incremental build info
- `apps/web/vite.config.{js,d.ts}` — generated by `tsc -b` on tsconfig.node
- `node_modules/`, `coverage/`
- `.env`, `.env.*` (except `.env.example`)

---

## Commit History

```
18de992  feat: project foundation — tooling, API hardening, Prisma, Tailwind/shadcn
7604b77  chore: ignore generated build artifacts
e2bfe0c  feat: scaffold UniSupport starter monorepo
fe0b2aa  Initial commit
```

---

_Generated 2026-07-14. Update this file when the project structure changes._
