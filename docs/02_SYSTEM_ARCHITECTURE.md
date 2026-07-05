# 02 — System Architecture (Edu-Core)

## 1. Topology

Two independently deployed applications, communicating over HTTPS/REST:

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   Edu-Core Frontend      │ ────────────────────────▶│   Edu-Core Backend API   │
│   React 19 + Vite        │◀──────────────────────── │   Node.js + Express      │
│   Deployed: Vercel       │      access token in      │   Deployed: Hostinger VPS│
│                          │      Authorization header │   PM2 + Nginx reverse    │
│                          │      refresh token via    │   proxy + TLS            │
│                          │      httpOnly cookie      │                          │
└─────────────────────────┘                            └────────────┬─────────────┘
                                                                     │ Mongoose
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │  MongoDB (local, VPS) │
                                                          │  single-node replica  │
                                                          │  set (see note below) │
                                                          └──────────────────────┘
```

**Cross-origin note:** Vercel (frontend) and Hostinger (backend) are different origins. This forces explicit choices: CORS must allow the Vercel origin with `credentials: true`, and the refresh-token cookie must be `SameSite=None; Secure` (requires HTTPS on both sides — non-negotiable, not optional hardening).

**MongoDB transactions require a replica set**, even for a single-node deployment. Edu-Core relies on multi-document transactions (student+user creation, lesson booking + payroll audit write, payroll upsert + transaction log). The VPS-local MongoDB **must** be initialized with `rs.initiate()` as a single-member replica set. This is documented explicitly in `09_DEPLOYMENT.md` because it's easy to miss and transactions will throw at runtime without it.

## 2. Backend Architecture (Modular / Layered)

```
Request → Router → Middleware chain → Controller (thin) → Service (business logic)
        → Repository (data access) → Mongoose Model → MongoDB
```

### Layer responsibilities

| Layer | Responsibility | Must NOT contain |
|---|---|---|
| **Router** | Maps HTTP verb+path to controller method, applies route-level middleware | Business logic |
| **Middleware** | Auth, RBAC, validation, rate limiting, logging | Domain rules |
| **Controller** | Parse request, call service, shape HTTP response | Database calls, business rules |
| **Service** | Business rules, orchestration, transactions | Express req/res objects |
| **Repository** | Mongoose queries, isolates the ORM from services | Business rules |
| **Model** | Schema, validation, indexes | Business rules beyond field-level validation |

### Example request lifecycle — "Book a lesson"

1. `POST /api/v1/lessons` hits `lesson.routes.js`.
2. `authenticate` middleware verifies access token → attaches `req.user`.
3. `authorize('ADMIN', 'RECEPTIONIST')` middleware checks role.
4. `validate(createLessonSchema)` middleware validates body with Zod.
5. `lesson.controller.js#createLesson` calls `lessonService.createLesson(dto, req.user)`.
6. `lesson.service.js`:
   - opens a Mongoose session/transaction
   - calls `lessonRepository.findConflicts(teacherId, studentId, window)`
   - if conflict → throws `ConflictError` (mapped to HTTP 409 by the error middleware)
   - calls `teacherRepository.findById` for the current commission split
   - computes `teacherEarnings`/`instituteRevenue`
   - calls `lessonRepository.create(...)`, `payrollTransactionRepository.create(...)` inside the same transaction
   - commits
7. Controller returns the standard envelope (`13_API_DESIGN.md`).
8. Centralized error middleware catches any thrown `AppError` subclass and formats the error response.

This is the structural fix for the legacy system's biggest gap: conflict-checking and revenue math move out of the controller and into a single, unit-testable `lesson.service.js`.

### Backend Folder Structure (summary — full tree in `10_FOLDER_STRUCTURE.md`)

```
src/
  config/          # env, db connection, constants
  modules/
    auth/
    students/
    teachers/
    lessons/
    attendance/
    payments/
    payroll/
    salaries/
    reports/
    activity-log/
  shared/
    middlewares/
    utils/
    errors/
    services/       # cross-module services (e.g. audit logger)
  app.js
  server.js
```

Each module folder contains: `*.model.js`, `*.repository.js`, `*.service.js`, `*.controller.js`, `*.routes.js`, `*.validation.js`.

## 3. Frontend Architecture (Feature-Based)

```
src/
  app/              # router setup, providers, layout shell
  features/
    auth/
    students/
    teachers/
    scheduling/
    attendance/
    payments/
    payroll/
    salaries/
    reports/
    dashboard/
  shared/
    components/     # Button, Card, DataTable, Dialog, etc. (design system)
    hooks/
    services/       # axios instance, query client, api wrappers
    utils/
    types/
```

Each feature folder contains: `pages/`, `components/`, `hooks/`, `services/`, `validations/`, `types/`.

### Data flow

- **Axios instance** (`shared/services/apiClient.js`) with a response interceptor: on `401`, attempts a silent refresh via `/api/v1/auth/refresh`, retries the original request once, and logs the user out on repeated failure.
- **TanStack Query** owns all server state (lists, detail views); local component state is reserved for UI-only concerns (open/closed dialogs, form drafts).
- **React Hook Form + Zod** for every form, using the *same* Zod schema shape as the backend validator (kept in sync manually per module — see `19_CODING_STANDARDS.md` for the convention, since frontend and backend are separate deployables and cannot literally share a package without a monorepo, which is out of scope here).

## 4. Error Handling Strategy

- Backend: a small hierarchy of `AppError` (base) → `ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`. A single Express error-handling middleware converts these to the standard error envelope and correct HTTP status; anything unrecognized becomes a logged 500 with no internal detail leaked to the client.
- Frontend: a shared `ApiError` type parsed from the envelope; TanStack Query's `onError` + a global toast handler surface it; forms map field-level errors from the validation envelope back onto React Hook Form fields.

## 5. Logging

- **Winston**, two transports: console (dev, colorized) and rotating file (production, JSON, on the VPS under `/var/log/edu-core/`).
- Every request gets a correlation ID (middleware, `crypto.randomUUID()`), logged on entry/exit and included in error responses for support/debugging.
- Financial mutations (lesson create/update, payroll recalculation, payment status change) always emit an `ActivityLog` document in addition to the Winston log — operational logs and business audit trail are kept separate on purpose.

## 6. Configuration & Environment Variables

All config loaded and validated at boot via a Zod-validated `env.js` (fail fast if a required var is missing — directly fixing the legacy system's silent hardcoded-JWT-secret fallback). See `08_SECURITY.md` for the full variable list.

## 7. Caching Strategy

- **Client-side:** TanStack Query cache (staleTime tuned per resource — e.g. `teachers` list 5 min, `dashboard` stats 1 min).
- **Server-side:** no external cache dependency (no Redis) to respect the "MongoDB local on VPS only" constraint. If read-heavy endpoints (reports, dashboard) become a bottleneck later, an in-process LRU cache (`lru-cache` npm package) keyed by query params is the first scalability step before introducing Redis — see `15_RISK_ANALYSIS.md`.

## 8. Deployment Strategy (summary — full detail in `09_DEPLOYMENT.md`)

- Frontend: Vercel, built from the `frontend/` directory, environment variable `VITE_API_BASE_URL` pointing at the VPS API domain.
- Backend: PM2 process manager on the Hostinger VPS, Nginx as reverse proxy + TLS termination (Let's Encrypt/certbot), MongoDB running as a local single-node replica set, `mongodump` cron for backups.

## 9. Scalability Strategy

- Stateless API (JWT-based, no server-side session store) → horizontally scalable behind Nginx/PM2 cluster mode if a second VPS is ever added.
- MongoDB indexes designed up front (see `03_DATABASE_DESIGN.md`) for the query patterns actually observed in the legacy code (date-range + teacher/student lookups, status filters, month/year payroll lookups).
- Read-heavy aggregation endpoints (`reports`) implemented as MongoDB aggregation pipelines rather than in-application `reduce()` loops (a direct improvement over the legacy implementation, which pulled full result sets into Node and reduced them manually).
