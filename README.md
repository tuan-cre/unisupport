# UniSupport

University IT Help Desk SaaS Platform.

UniSupport is a Help Desk management system designed for universities.
The platform helps students, lecturers, and IT departments manage support requests efficiently.

## Start Here

This repo is set up as an npm workspace monorepo.

Structure:

- `apps/web` - React + Vite frontend
- `apps/api` - NestJS backend
- `packages/shared` - shared types and utilities

Local run commands:

```bash
npm install
docker compose up -d
npm run dev
```

Useful workspace commands:

- `npm run dev:web`
- `npm run dev:api`
- `npm run build`

## Main Features

- Ticket management
- User management
- Department management
- Role & Permission system
- Realtime ticket updates
- Realtime comments
- Notification system
- SLA management
- Knowledge Base
- File attachments
- Email notifications
- Admin dashboard
- Audit logging

---

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

# Frontend

## Core

| Technology | Purpose |
|-|-|
| React 19 | Frontend framework |
| Vite | Build tool |
| TypeScript | Type safety |
| npm | Package manager |
| React Router | Client-side routing |

---

## UI System

| Technology | Purpose |
|-|-|
| Tailwind CSS v4 | Styling system |
| shadcn/ui | Customizable UI components |

Main components:

```
Button
Dialog
Dropdown
Table
Form
Calendar
Toast
Pagination
Command Menu
```

---

## State Management

### Server State

Technology:

```
TanStack Query
```

Handles:

- API requests
- Cache
- Loading state
- Server synchronization


Managed data:

```
Tickets

Users

Comments

Notifications

Knowledge Articles
```

---

### Client State

Technology:

```
Zustand
```

Handles:

```
Sidebar

Theme

Modal

UI preferences
```

---

## Forms & Validation

| Technology | Purpose |
|-|-|
| React Hook Form | Form handling |
| Zod | Client validation |

Used for:

- Login
- Register
- Ticket creation
- Profile update
- Admin forms

---

## HTTP & Realtime

| Technology | Purpose |
|-|-|
| Axios | HTTP Client |
| Socket.IO Client | Realtime communication |

Realtime features:

- Ticket status update
- Comments
- Assignment notification
- User presence

---

# Backend

## Core

| Technology | Purpose |
|-|-|
| NestJS | Backend framework |
| TypeScript | Programming language |
| REST API | API architecture |

---

## Backend Validation

Technologies:

```
class-validator

class-transformer
```

Request flow:

```
Request

↓

DTO Validation

↓

Controller

↓

Service

↓

Database
```

---

# Database

## PostgreSQL

Main relational database.

Used for:

- Users
- Tickets
- Departments
- Permissions
- Knowledge Base
- Audit data


## Prisma ORM

Benefits:

- Type-safe queries
- Migration management
- Clean database access
- Strong TypeScript integration

---

# Authentication

Authentication system:

```
Login

↓

Generate Access Token

↓

Generate Refresh Token

↓

Hash Refresh Token

↓

Store Session

↓

Send Refresh Token via HttpOnly Cookie
```

Using:

- JWT Access Token
- Refresh Token
- HttpOnly Cookie
- Refresh Token Hash

---

## Session Management

Instead of storing refresh token directly in users table:

```
Users

Sessions
---------
id
user_id
refresh_token_hash
device
ip_address
created_at
expires_at
revoked_at
```

Benefits:

- Multi-device login
- Session management
- Device revoke
- Better security

---

# Authorization

## RBAC + Policy Based Authorization

Architecture:

```
RBAC

+

Policy Layer
```

RBAC checks:

```
"Does user have this permission?"
```

Policy checks:

```
"Can user perform this action on this resource?"
```

---

Example:

Permission:

```
ticket:update
```

Policy:

```
Can user update this specific ticket?
```

---

Technology:

Optional:

```
CASL
```

---

Database:

```
Users

Roles

Permissions

Role Permissions
```

Example:

```
ticket:create

ticket:update

ticket:assign

ticket:close

user:create

knowledge:publish
```

---

# Cache & Background Jobs

## Redis

Used for:

- Cache
- BullMQ queue
- Socket.IO adapter
- Rate limiting
- Temporary data


---

## BullMQ

Background job system.


Example:

```
Create Ticket

↓

Queue

↓

Worker

↓

Send Email
```

Jobs:

- Email sending
- Notification processing
- SLA checking
- Report exporting

---

# Realtime System

## Socket.IO

Backend:

```
NestJS Gateway
```

Frontend:

```
Socket.IO Client
```


Used for:

- Ticket updates
- Comments
- Assignment notification
- User presence


Scaling:

```
NestJS Instance 1

        |

      Redis

        |

NestJS Instance 2
```

---

# File Storage

## MinIO

S3 compatible object storage.


Stores:

- Avatar
- Images
- PDF
- DOCX
- ZIP
- Ticket attachments


Flow:

```
Frontend

↓

NestJS API

↓

MinIO
```

---

Production compatible:

- AWS S3
- Cloudflare R2
- DigitalOcean Spaces

---

## File Security (Optional)

For uploaded files:

```
Upload

↓

MinIO

↓

ClamAV Scan

↓

Accept / Reject
```

---

# Email System

## Development

```
NestJS

↓

BullMQ

↓

SMTP

↓

Mailpit
```

Mail UI:

```
localhost:8025
```

---

## Production

Can replace with:

- Amazon SES
- Brevo
- Mailgun
- SMTP Provider


Email templates:

```
ticket-created.html

ticket-assigned.html

ticket-closed.html
```

Template engine:

```
Handlebars
```

---

# Logging & Monitoring

## Logging

Technology:

```
Pino
```

Example:

```json
{
  "level":"info",
  "method":"POST",
  "url":"/tickets",
  "duration":"35ms"
}
```

Used for:

- Request logging
- Debugging
- Production analysis


---

## Error Tracking

Optional:

```
Sentry
```

Used for:

- Exception tracking
- Error alerting
- Production debugging


---

## Observability

Future:

```
OpenTelemetry
```

For:

- Metrics
- Tracing
- Performance monitoring

---

# API Documentation

## Swagger

Endpoint:

```
/api/docs
```

Includes:

- API endpoints
- Request schema
- Response schema
- Authentication
- Error format

---

# API Response Standard

## Success

```json
{
  "success": true,
  "message": "Ticket created",
  "data": {}
}
```

---

## Pagination

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page":1,
    "limit":10,
    "total":100
  }
}
```

---

## Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# Database Strategy

## Design

Principles:

- Normalized database
- Avoid duplicated data
- Clear relationships


---

## Soft Delete

Using:

```
deleted_at
```

Applied to:

- Users
- Tickets
- Categories
- Departments
- Knowledge Articles


Not applied:

- Audit Logs
- Activity Logs

because historical records should remain immutable.

---

# Code Quality

Tools:

| Tool | Purpose |
|-|-|
| ESLint | Code quality |
| Prettier | Formatting |
| Husky | Git hooks |
| lint-staged | Pre-commit checks |

Workflow:

```
git commit

↓

Husky

↓

Lint

↓

Format

↓

Commit
```

---

# Testing

## Backend

Framework:

```
Jest
```

Unit tests:

- Auth Service
- Ticket Service
- Permission Service
- SLA Service


Integration tests:

- REST API
- Database flow
- Authentication flow


---

## Frontend

Tools:

```
Vitest

React Testing Library
```

Testing:

- Components
- Hooks
- Forms
- UI behavior


---

## End-to-End Testing

Tool:

```
Playwright
```

Testing:

- Login flow
- Ticket creation
- User workflow

---

# DevOps

## Development Environment

Docker Compose:

```
PostgreSQL

Redis

MinIO

Mailpit
```

---

## Production Architecture

```
              Nginx
                |
        ----------------
        |              |
    Frontend       Backend
                       |
                    Worker
                       |
          -----------------------
          |          |          |
     PostgreSQL    Redis      MinIO
```

---

# Backup Strategy

Database backup:

```
pg_dump

+

Scheduled backup
```

Important data:

- Users
- Tickets
- Audit logs
- Knowledge articles

---

# Repository Structure

Recommended:

```
helpdesk-frontend

helpdesk-backend

helpdesk-docs
```

---

# Git Workflow

Using GitHub Flow:

```
Feature Branch

↓

Pull Request

↓

Code Review

↓

Merge main
```

---

# CI/CD

Using:

```
GitHub Actions
```

Pipeline:

```
Push / Pull Request

↓

Install dependencies

↓

Lint

↓

Test

↓

Build

↓

Deploy
```

---

# Final Architecture

```
Frontend

React 19
Vite
TypeScript
Tailwind
shadcn/ui
React Router
TanStack Query
Zustand
Axios
Socket.IO


                |

                |


Backend

NestJS
REST API
Prisma
PostgreSQL

                |

                |

Redis

├── BullMQ

└── Socket.IO Adapter


                |

                |

MinIO

File Storage


                |

                |

SMTP

Email System


                |

                |

Pino
Sentry
OpenTelemetry
```

---

# Project Goal

UniSupport is built for:

- Real-world SaaS architecture
- Full-stack engineering practice
- Portfolio development
- Team collaboration
- Production workflow experience