# 01 — Project Analysis (Legacy System)

Source analyzed: `github.com/mohamedreda22/edu-center` (product name in code: **"Rakan Institute Management System"**).

> This document reflects what was actually found in the repository, not assumptions. Every claim below was verified by reading the source.

## 1. Actual Stack (as opposed to the target stack)

| Layer | Legacy | Edu-Core Target |
|---|---|---|
| Framework | Next.js 16 (App Router, monolith) | React 19 (Vite SPA) + Express API (separate) |
| Language | TypeScript | TypeScript/JS |
| ORM/DB | Prisma 7 + **PostgreSQL** | Mongoose + **MongoDB** |
| Auth | Single JWT in httpOnly cookie, no refresh token | Access + Refresh tokens, rotation, logout-all-devices |
| Rate limiting | Upstash Redis (silently disabled if env vars missing) | express-rate-limit, self-hosted |
| Styling | Tailwind CSS v4 | Tailwind CSS + shadcn/ui |
| Data fetching | Native `fetch` in `useEffect` | TanStack Query + Axios |
| Forms | Uncontrolled/manual state | React Hook Form + Zod |

**Key implication:** the legacy app is a single Next.js deployable (UI + API + DB access in one process). Edu-Core is a genuinely different topology — a static Vite SPA on Vercel talking to an independent Express API on a Hostinger VPS. Nothing about the legacy request/response wiring can be copied; only the **business behavior** transfers.

## 2. Folder Structure Found

```
app/
  api/                  → REST-ish route handlers (Next.js Route Handlers)
    auth/{login,logout,me}
    students/ (+ [id])
    teachers/ (+ [id])
    lessons/  (+ [id])
    payments/ (+ [id])
    payroll/  (+ [id], generate)
    salaries/ (+ [id], calculate)
    reports/
  dashboard/
    page.tsx            → overview/home (212 lines)
    students/page.tsx    (355 lines)
    teachers/page.tsx    (464 lines)
    schedule/page.tsx     (302 lines)
    attendance/page.tsx  (168 lines)
    payments/page.tsx    (430 lines)
    payroll/page.tsx     (199 lines)
    salaries/page.tsx    (345 lines)
  login/
  layout.tsx, page.tsx, globals.css
components/ui/           → minimal, mostly empty (shadcn not really adopted)
lib/
  db.ts                 → Prisma client singleton
  auth.ts               → JWT verify/requireAuth (41 lines)
  activityLog.ts         → audit log writer
  payroll.ts            → payroll recalculation logic
  stats.ts              → dashboard stats aggregation
  rateLimit.ts          → Upstash-based, no-ops without env vars
  validations/           → Zod schemas: student, teacher, lesson, payment, salary
prisma/
  schema.prisma          → the real source of truth for the domain model
types/index.ts
```

**Observation:** there is no `services/`, `repositories/`, or `controllers/` layer at all. Route handler files under `app/api/**/route.ts` *are* the controller, service, and data-access layer combined.

## 3. Page-by-Page / Module-by-Module Analysis

### Authentication (`app/api/auth/*`, `lib/auth.ts`, `app/login/`)
- **Purpose:** login, logout, "who am I" session check.
- **Mechanism:** `login` issues one JWT (`jose`), sets it as an httpOnly cookie named `token`. `requireAuth(request, roles[])` decodes it per-request.
- **Problems:** no refresh token, no rotation, no way to revoke a single session, no multi-device logout, secret defaults to a hardcoded fallback string (`'your_super_secret_key'`) if `JWT_SECRET` is unset — a real vulnerability if deployed without env config.
- **Migration priority:** Critical / first milestone. Complexity: medium (adding refresh rotation properly, low if done carelessly).

### Students (`app/api/students`, `dashboard/students/page.tsx`)
- **Purpose:** CRUD for student records; a `Student` is always backed by a `User` row.
- **Business logic found:** creates a placeholder `User` with a synthetic email (`student-{phone}@institute.local`) and empty password on student creation — students don't authenticate as themselves today. `studentId` is generated as `STU-` + `count()+1`, zero-padded.
- **Problems:** two separate `prisma.create` calls with no transaction → orphaned `User` possible on partial failure. Count-based ID generation is a race condition under concurrent writes. 355-line page file mixes table, filters, modal form, and fetch logic.
- **Reuse:** the Zod validation shape (`lib/validations/student.ts`) is a faithful business-rules reference (Arabic educational levels enum, phone regex, required address) and should be ported near-verbatim into the new shared validation layer.
- **Priority:** High. Complexity: Medium. Migration difficulty: Medium (ID generation and user-linking must be redesigned).

### Teachers (`app/api/teachers`, `dashboard/teachers/page.tsx`)
- **Purpose:** CRUD for teacher records, including commission model, availability, transport.
- **Business logic found:** `commissionModel` enum (`SEVENTY_THIRTY` / `SIXTYFIVE_THIRTYFIVE`) resolves to stored `teacherPercentage`/`institutePercentage` floats that are snapshotted onto every lesson at creation time. `usesInstituteCar` drives a flat per-lesson transport deduction in payroll.
- **Problems:** 464-line page (largest in the app). `availableDays`/`availableHours` stored as raw strings ("JSON array as string" per code comment) instead of structured data — fragile, unqueryable.
- **Priority:** High. Complexity: Medium-High (availability data deserves a real structured redesign, not a literal copy).

### Lessons / Scheduling (`app/api/lessons`, `dashboard/schedule/page.tsx`)
- **Purpose:** book, list, and update lessons between a teacher and a student.
- **Business logic found:** on create, checks a **±24h conflict window** per teacher and per student before allowing booking (returns Arabic error messages on conflict, HTTP 409). Computes `endTime` from `startTime` + `durationHours`. Snapshots the teacher's current commission split onto the lesson (`teacherEarnings`, `instituteRevenue`) so historical earnings don't change if the teacher's rate changes later. Every create also writes a `PayrollTransaction` audit row.
- **Problems:** conflict check and revenue-split calculation live inline in the route handler, duplicated conceptually with `lib/payroll.ts`'s recalculation math — two places compute earnings with slightly different code paths. No transaction wrapping the lesson insert + payroll transaction insert.
- **Priority:** Critical (this is the core scheduling engine). Complexity: High.

### Attendance (`dashboard/attendance/page.tsx`)
- **Purpose:** mark a lesson's outcome for a given day (completed/absent/cancelled) and attach notes.
- **Finding:** there is **no dedicated Attendance collection/table**. It is implemented entirely as `PATCH /api/lessons/[id]` updates to `Lesson.status` and `Lesson.notes`. An `AttendanceStatus` enum exists in `schema.prisma` but is **unused dead code** — nothing references it.
- **Priority:** Medium. Complexity: Low (it is just a filtered lesson view + status update).

### Payments (`app/api/payments`, `dashboard/payments/page.tsx`)
- **Purpose:** track student fee payments, optionally linked to a specific lesson.
- **Discrepancy found:** `lib/validations/payment.ts` allows a `PARTIALLY_PAID` status, but `schema.prisma`'s `PaymentStatus` enum only defines `PENDING | PAID | OVERDUE | CANCELLED`. This is a **latent bug** in the legacy system — the validator accepts a value the database rejects. Must be resolved (not silently copied) in Edu-Core.
- **Priority:** High. Complexity: Medium.

### Payroll (`app/api/payroll/*`, `lib/payroll.ts`, `dashboard/payroll/page.tsx`)
- **Purpose:** monthly aggregation of a teacher's completed lessons into a payable `PayrollRecord`, with transport deductions and a full audit trail (`PayrollTransaction`, diffing previous vs. new values).
- **Business logic found:** `recalculatePayrollForTeacher(teacherId, month, year)` sums `lessonPrice`/`teacherEarnings`/`instituteRevenue` over `COMPLETED` lessons in the month, subtracts a flat 1-unit-per-lesson transport deduction if `usesInstituteCar`, upserts a unique `(teacherId, month, year)` record, and logs a diff transaction.
- **Priority:** Critical (financial correctness). Complexity: High.

### Salaries (`app/api/salaries/*`, `dashboard/salaries/page.tsx`)
- **Purpose:** a *second*, simpler payroll-like model (`TeacherSalary`) based on `hoursWorked * hourlyRate` plus manual bonuses/deductions/transportation allowance, independent of the lesson-based `PayrollRecord`.
- **Finding:** the system carries **two parallel and not-obviously-reconciled compensation models** (`PayrollRecord` from lesson aggregation, and `TeacherSalary` from manual hourly entry). This needs an explicit product decision, not a blind copy — see `06_REFACTORING_PLAN.md`.
- **Priority:** High. Complexity: Medium.

### Reports (`app/api/reports`)
- **Purpose:** financial dashboards — `overview`, `by_teacher`, `by_subject`, `by_level`, each aggregating completed lessons in a date range.
- **Priority:** Medium. Complexity: Medium (aggregation logic maps cleanly to MongoDB aggregation pipelines — arguably a better fit in Mongo than it was in Prisma's `groupBy`-less manual reduction).

### Activity Log (`lib/activityLog.ts`)
- **Purpose:** generic audit trail — `userId`, `action`, `entityType`, `entityId`, `metadata` JSON, IP, user agent.
- **Priority:** Medium. Complexity: Low. Directly portable pattern.

### Dashboard Overview (`dashboard/page.tsx`, `lib/stats.ts`)
- **Purpose:** landing KPI page — counts, revenue snapshot, recent activity.
- **Priority:** Medium. Complexity: Low-Medium.

## 4. Cross-Cutting Findings

1. **No service layer anywhere.** Every business rule (commission math, conflict detection, payroll aggregation) is inline in a route handler. This is the single biggest architectural gap relative to Edu-Core's mandated Clean Architecture.
2. **No use of database transactions**, despite several multi-step writes that require atomicity (user+student creation, lesson+payroll-transaction creation, payroll upsert+transaction log).
3. **Full Arabic-first UI**: every user-facing validation message and several enum values (`تأسيس`, `ابتدائي`, day names) are in Arabic. RTL and Arabic are not an afterthought — they are the primary language of the product and must be first-class in Edu-Core, not bolted on.
4. **God Components** on the frontend: 4 of 8 dashboard pages exceed 300 lines, the largest (`teachers/page.tsx`) at 464 lines, combining data fetching, modal state, form state, and table rendering in one file.
5. **Security gaps**: hardcoded JWT fallback secret, no CSRF protection strategy, rate limiting that fails open (no-ops) when misconfigured, `as any` casts bypassing enum type safety on user input.
6. **Dead/inconsistent schema elements**: unused `AttendanceStatus` enum, `PARTIALLY_PAID` validated but not persistable.

## 5. Reusable Assets (carry the *intent* forward, not the code)

- Zod validation shapes (field names, Arabic messages, constraints) — direct reference for the new shared validation layer.
- The full domain vocabulary: roles, statuses, commission models, educational levels.
- The report aggregation categories (`by_teacher`, `by_subject`, `by_level`, `overview`).
- The audit-log-everything pattern for financial mutations.

See `05_FEATURE_INVENTORY.md` for the complete feature-by-feature breakdown with priority and complexity scoring.
