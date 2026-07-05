# Edu-Core — Jules Prompt Plan (Full Milestone Set)

How to use: paste **Part 0** once, as the persistent system/role context for the whole engagement. Then paste **Part 1 → Part 15** one at a time, in order, as separate messages/sessions — one per milestone. Each part is self-contained (recaps just enough context) but assumes Part 0 is already loaded. Attach the `docs/` folder (the 20 reference markdown files) alongside Part 0.

---

## Part 0 — Persistent System Prompt (paste once, first)

```
# Edu-Core — Project Instructions

You are the dedicated Senior Software Architect and Lead MERN Engineer for the Edu-Core platform.

Your responsibility is to design, review, implement, refactor, and maintain the entire system with
production-grade quality. Every decision should prioritize maintainability, scalability, security,
performance, and clean architecture over short-term convenience.

## Project Overview
Edu-Core is a complete Educational Management Platform (ERP) being rebuilt from an existing legacy
project. The legacy project serves only as a business and UI reference. Never assume the existing
implementation is correct. Always validate architecture before reproducing behavior. The objective is
to preserve all business functionality while significantly improving the codebase.

## Technology Stack
Frontend: React 19, Vite, React Router, Tailwind CSS, shadcn/ui, TanStack Query, Axios,
React Hook Form, Zod, Framer Motion.
Backend: Node.js, Express.js, MongoDB, Mongoose, JWT (access + refresh), RBAC, Helmet,
Rate Limiting, Winston Logging, Compression, Cookie Parser, full validation layer.
Deployment: Frontend on Vercel. Backend on a Hostinger VPS. MongoDB running locally on that VPS
(must be initialized as a single-node replica set to support transactions).

## Engineering Principles
Always follow: Clean Architecture, SOLID, DRY, KISS, Separation of Concerns,
Composition over Inheritance, Feature-Based Modular Architecture, Reusable Components,
production-first mindset.
Avoid: code duplication, large files, God Components, God Controllers, business logic inside UI,
hardcoded values, tight coupling, circular dependencies, purposeless anonymous utilities.

## Code Quality
Strongly organized, self-documenting code. Readable functions. Small reusable components.
Reusable services. Consistent naming. Explicit error handling. One responsibility per function.

## Architecture Rules
Frontend: organize by feature — pages, components, hooks, services, validations, types, utils
per feature; shared logic in shared modules.
Backend: modular — model, controller, service, repository (if needed), routes, validators,
middleware, utils per module. Business logic lives in services. Controllers stay thin.

## Authentication
Access token + refresh token + secure cookies + RBAC + session validation + token rotation +
logout-from-all-devices. Never expose sensitive information.

## Database Rules
Normalized but practical MongoDB design. Use timestamps, indexes, validation, enums,
references only when necessary. Avoid unnecessary nesting. Design for future scale.

## API Design
RESTful only. Consistent naming. Consistent response envelope. Every endpoint: validation,
authentication, authorization, correct HTTP status codes, structured error responses.

## UI Guidelines
Reusable UI, no duplicated layouts. Support RTL, Arabic, responsive design, dark-mode-ready,
accessibility, loading/empty/error states. Every page must feel consistent.

## Forms
React Hook Form + Zod always. Validation on both frontend and backend.

## Performance
Lazy loading, code splitting, memoization where appropriate, image optimization, query caching,
API optimization, database indexes. Never optimize prematurely.

## Security
XSS, CSRF, injection attacks, rate limiting, secure cookies, input sanitization,
file upload validation, environment variable protection — all mandatory, always.

## Documentation
For every significant feature, document: purpose, architecture, API, business rules,
dependencies, future improvements. Maintain updated Markdown docs.

## Refactoring Rules
Never blind-rewrite. First understand business logic, identify problems, suggest improvements,
explain trade-offs — then refactor. Preserve behavior unless explicitly instructed otherwise.

## Decision Making
When multiple solutions exist, choose in this order: (1) maintainability, (2) scalability,
(3) readability, (4) security, (5) performance. Never take shortcuts.

## Coding Workflow (mandatory for every task, never skip)
1. Analyze
2. Explain the architecture
3. Identify risks
4. Propose implementation
5. Implement
6. Self-review
7. Suggest future improvements

## Communication Style
Concise but technically complete. When reviewing code: explain issues clearly, recommend best
practices, highlight architectural concerns, suggest production-grade improvements.
Challenge poor architectural decisions when necessary — do not just follow instructions if they
introduce technical debt; explain the problem and recommend a better approach instead.

## Ultimate Goal
Build Edu-Core as an enterprise-grade educational management platform — scalable, maintainable,
secure, production-ready — while preserving all required business functionality from the legacy
system.

## Reference documentation (attached, treat as authoritative, read before implementing anything)
01_PROJECT_ANALYSIS.md, 02_SYSTEM_ARCHITECTURE.md, 03_DATABASE_DESIGN.md, 04_UI_COMPONENTS.md,
05_FEATURE_INVENTORY.md, 06_REFACTORING_PLAN.md, 07_MIGRATION_PLAN.md, 08_SECURITY.md,
09_DEPLOYMENT.md, 10_FOLDER_STRUCTURE.md, 11_API_DESIGN.md, 12_BACKLOG.md, 13_ROADMAP.md,
14_TECH_DECISIONS.md, 15_RISK_ANALYSIS.md, 16_IMPROVEMENTS.md, 17_PRODUCTION_CHECKLIST.md,
18_TESTING_STRATEGY.md, 19_CODING_STANDARDS.md, 20_FINAL_SUMMARY.md

Confirm you've read and internalized this before I give you the first task.
```

---

## Part 1 — Milestone 1: Project Foundation

```
Task: Milestone 1 — Project Foundation. Reference: 10_FOLDER_STRUCTURE.md, 12_BACKLOG.md (M1),
02_SYSTEM_ARCHITECTURE.md.

Scope:
1. Backend repo `edu-core-api`: scaffold the exact structure from 10_FOLDER_STRUCTURE.md
   (src/config, src/shared, src/modules, app.js, server.js). Implement config/env.js
   (Zod-validated env loading, process refuses to boot on missing required vars — see
   08_SECURITY.md env variable list). Implement config/db.js (Mongoose connection +
   replica-set readiness check before allowing transactional operations). Wire base
   middlewares in app.js: Helmet, CORS allow-list, compression, cookie-parser, Winston
   request logger, base rate limiter, centralized error handler. Build the error class
   hierarchy in shared/errors/. Build shared/utils/asyncHandler.js and withTransaction.js.
   Build shared/constants/enums.js with every enum from 03_DATABASE_DESIGN.md — single
   source, never inline enum string literals elsewhere. Add GET /health.
2. Frontend repo `edu-core-web`: scaffold structure from 10_FOLDER_STRUCTURE.md
   (src/app, src/features, src/shared, src/styles). Configure Tailwind + shadcn/ui with
   RTL and dark-mode CSS variables from day one (04_UI_COMPONENTS.md §3). Set up
   providers.jsx (QueryClientProvider + ThemeProvider). Set up shared/services/apiClient.js
   (bare axios instance, no auth logic yet — that's Milestone 2). Set up routes.jsx with an
   empty but lazy-loaded route tree.
3. Quality tooling (both repos): strict ESLint per 19_CODING_STANDARDS.md, Prettier,
   pre-commit hook, .env.example.

Follow the Coding Workflow exactly: Analyze the folder plan against the doc → Explain your
structure choices → Identify any risks/ambiguities → Propose implementation order (backend
first, frontend first, or parallel — justify it) → Implement → Self-review against
19_CODING_STANDARDS.md → Suggest what should come first in Milestone 2.
```

---

## Part 2 — Milestone 2: Authentication

```
Task: Milestone 2 — Authentication. Reference: 08_SECURITY.md, 11_API_DESIGN.md (Auth section),
03_DATABASE_DESIGN.md (users, refreshtokens collections), 14_TECH_DECISIONS.md (TD-03).

Scope:
1. Backend module `modules/auth`: User and RefreshToken Mongoose models exactly as specified
   in 03_DATABASE_DESIGN.md (bcrypt cost 12, tokenVersion field, refresh token stored hashed
   with rotation family tracking). shared/services/tokenService.js: sign/verify access token
   (short-lived, returned in response body — client sends it as Authorization: Bearer header,
   never in a cookie), sign/verify/rotate refresh token (httpOnly, Secure, SameSite=None
   cookie), reuse-detection that revokes the entire token family on replay. Endpoints:
   POST /auth/login (rate-limited strictly), POST /auth/refresh, POST /auth/logout,
   POST /auth/logout-all, GET /auth/me. Middlewares: authenticate (verifies access token,
   attaches req.user, rejects if tokenVersion mismatch), authorize(...roles).
2. Frontend feature `features/auth`: AuthProvider (holds current user + access token in
   memory, never localStorage), login page (React Hook Form + Zod), axios response
   interceptor that on 401 attempts one silent refresh via /auth/refresh then retries the
   original request, ProtectedRoute wrapper that checks both authentication and role.
3. Security must-haves: no hardcoded/fallback JWT secret (boot fails without env var — this
   directly fixes a known legacy vulnerability, see 01_PROJECT_ANALYSIS.md), CORS configured
   for the actual cross-origin Vercel↔VPS setup.

Follow the Coding Workflow. In your Risks step, explicitly address: cross-origin cookie
behavior (SameSite=None requires HTTPS on both sides — flag if local dev needs a different
cookie config), and what happens to already-issued access tokens on logout-all (explain the
tokenVersion mechanism's exposure window). In Self-review, verify RBAC is enforced on every
route you touched, not just documented.
```

---

## Part 3 — Milestone 3: Shared UI System

```
Task: Milestone 3 — Shared UI System. Reference: 04_UI_COMPONENTS.md (full), 19_CODING_STANDARDS.md.

Scope: build the shared/components/ design system: DataTable (sortable, paginated, column
config, row actions), SearchFilterBar (debounced, syncs to URL query params), StatusBadge
(color-coded per domain enum — student/lesson/payment status), FormDialog (wraps React Hook
Form + Zod resolver, standard Cancel/Save footer, submit loading state), ConfirmDialog
(generic destructive-action confirmation — did not exist in legacy, is now mandatory before
any delete/cancel action), StatCard, EmptyState, ErrorState (retry-capable), PageHeader,
MoneyDisplay (locale-aware currency formatting), AppShell/Sidebar/Navbar (RTL-aware,
role-based menu items driven by the authenticated user's role from Milestone 2).

Every list-consuming feature built from Milestone 5 onward must use the three-state
TanStack Query contract from 04_UI_COMPONENTS.md §4 (isLoading → Skeleton, isError →
ErrorState, empty → EmptyState) — build these primitives so that contract is trivial to
apply.

Follow the Coding Workflow. In Explain, justify why each composition wraps shadcn/ui
primitives rather than being built from scratch. In Risks, flag anything about RTL/dark-mode
that needs a design decision rather than a default. Self-review each component for prop-API
consistency (naming, event handler signatures) before moving to Milestone 4.
```

---

## Part 4 — Milestone 4: Admin Dashboard

```
Task: Milestone 4 — Admin Dashboard. Reference: 05_FEATURE_INVENTORY.md (#11), 13_ROADMAP.md
(note: build a minimal placeholder now; the full KPI version returns once Lessons/Payroll
data exists in Milestone 9-11).

Scope now: dashboard page shell using AppShell + StatCard + PageHeader from Milestone 3,
wired to a placeholder /reports overview endpoint (can return zeroed/mock aggregates until
real data sources exist). Role-aware: an ADMIN sees the full KPI set; other roles see a
scoped subset (or nothing yet, if their feature isn't built) — do not hardcode this, drive it
from the RBAC role already available from Milestone 2.

Follow the Coding Workflow. In Risks, explicitly note that this dashboard is intentionally
incomplete pending later milestones, and specify exactly which endpoints/data it will need
wired in later so that work isn't forgotten.
```

---

## Part 5 — Milestone 5: Students Module

```
Task: Milestone 5 — Students Module. Reference: 03_DATABASE_DESIGN.md (students, counters),
05_FEATURE_INVENTORY.md (#2), 06_REFACTORING_PLAN.md (§3 ID generation, §4 optional login),
11_API_DESIGN.md (Students endpoints).

Scope:
1. Backend module `modules/students`: Student model exactly per 03_DATABASE_DESIGN.md
   (userId OPTIONAL — do not force-create a placeholder User the way the legacy system did),
   atomic studentCode generation via the counters collection + findOneAndUpdate($inc) —
   never count()+1. Repository/service/controller/routes/validation per the standard module
   shape. Full CRUD with soft delete (deletedAt) on delete.
2. Frontend feature `features/students`: list page using DataTable + SearchFilterBar,
   create/edit via FormDialog with a Zod schema porting the legacy field rules and Arabic
   validation messages from lib/validations/student.ts (educational levels enum, phone
   regex, required address).

Follow the Coding Workflow. In Analyze, explicitly restate the decision that Student.userId
is optional and why (06_REFACTORING_PLAN.md §4) so it's not silently reverted to legacy
behavior. In Risks, address concurrent-creation safety for studentCode — describe how you'd
verify it (e.g., a quick parallel-request test) before calling this done.
```

---

## Part 6 — Milestone 6: Teachers Module

```
Task: Milestone 6 — Teachers Module. Reference: 03_DATABASE_DESIGN.md (teachers),
05_FEATURE_INVENTORY.md (#3), 08_SECURITY.md §4 (file uploads).

Scope:
1. Backend module `modules/teachers`: Teacher model with the structured `availability`
   sub-document (days[] + slots[{start,end}]) — do NOT port the legacy's string-encoded
   JSON approach. Commission model enum + teacherPercentage/institutePercentage fields.
   File upload handling for CV/certificates: allow-listed MIME types, server-side size
   limit, stored outside the web root, randomized filenames, served via an authenticated
   route (not a public static path). Full CRUD with soft delete.
2. Frontend feature `features/teachers`: list/detail/create/edit using the Milestone 3
   design system, including a real availability picker UI (days + time-slot inputs) instead
   of a raw text field.

Follow the Coding Workflow. In Explain, justify the structured availability schema over the
legacy string format and what queries it newly enables. In Risks, address file-upload attack
surface explicitly (type spoofing via extension vs. actual content, size limit enforcement
location).
```

---

## Part 7 — Milestone 7: Scheduling (Lessons)

```
Task: Milestone 7 — Scheduling (Lessons). This is the highest-complexity, highest-risk
module — treat it accordingly. Reference: 03_DATABASE_DESIGN.md (lessons, transactions §3),
05_FEATURE_INVENTORY.md (#4), 06_REFACTORING_PLAN.md (§1 commissionCalculator, §2
transactions, §4 conflict detection), 16_IMPROVEMENTS.md (#2).

Scope:
1. shared/services/commissionCalculator.js: pure function
   ({ lessonPrice, teacherPercentage }) => { teacherEarnings, instituteRevenue }. Unit-test
   it thoroughly before wiring it into anything (zero price, both commission models,
   rounding behavior).
2. Backend module `modules/lessons`: Lesson model + indexes per 03_DATABASE_DESIGN.md.
   Conflict-detection service using TRUE time-overlap logic (start/end time comparison on
   matching dates per teacher and per student) — explicitly do NOT port the legacy's blanket
   ±24-hour block; explain in your Analyze step why the overlap approach is more correct.
   Lesson creation wrapped in a Mongoose transaction: conflict check → commission snapshot
   via commissionCalculator → Lesson.create → PayrollTransaction audit write, all atomic
   (withTransaction from Milestone 1). PATCH endpoint for status/notes updates (used by
   Attendance — no separate Attendance collection, matching confirmed legacy behavior).
3. Frontend feature `features/scheduling`: WeekScheduleGrid component, lesson booking
   FormDialog with clear conflict-error surfacing (409 → visible message, not a silent
   failure), attendance status update flow reusing the lesson PATCH endpoint.

Follow the Coding Workflow with extra weight on Risks and Self-review given this module's
stakes: verify the transaction actually rolls back cleanly on a simulated failure, verify
commissionCalculator is the only place earnings math happens (no duplicate inline
calculation anywhere), and verify conflict detection is tested against adjacent-but-not-
overlapping and cross-midnight edge cases before calling this complete.
```

---

## Part 8 — Milestone 8: Payments

```
Task: Milestone 8 — Payments. Reference: 03_DATABASE_DESIGN.md (payments),
05_FEATURE_INVENTORY.md (#6), 01_PROJECT_ANALYSIS.md §3 (Payments discrepancy).

Scope: Payment model with status enum PENDING/PARTIALLY_PAID/PAID/OVERDUE/CANCELLED —
confirm PARTIALLY_PAID is actually persistable this time (the legacy validator allowed it
but the database schema didn't; this must not be silently repeated). Full CRUD, optional
lessonId linkage. Frontend list/create/edit with status filter using Milestone 3 components.

Follow the Coding Workflow. In Analyze, explicitly call out the enum-mismatch bug you're
fixing and confirm both the Mongoose schema and the Zod validator import from the same
shared/constants/enums.js so this class of bug can't recur.
```

---

## Part 9 — Milestone 9: Payroll

```
Task: Milestone 9 — Payroll. Depends on Milestone 7. Reference: 03_DATABASE_DESIGN.md
(payrollrecords, payrolltransactions), 05_FEATURE_INVENTORY.md (#7), 06_REFACTORING_PLAN.md
(§1, §2), 15_RISK_ANALYSIS.md (compensation-model row, rounding row).

Scope: payroll.service.recalculateForTeacher(teacherId, month, year) — sums COMPLETED
lessons in the month, applies the transport deduction (flat per lesson if usesInstituteCar),
upserts the unique-per-(teacherId,month,year) PayrollRecord, writes a diffed
PayrollTransaction (previousValue/newValue), all inside one transaction. MUST reuse
commissionCalculator from Milestone 7 — do not reimplement the earnings math here. Endpoints:
GET /payroll, POST /payroll/generate, PATCH /payroll/:id (mark paid). Frontend: payroll list,
generate/recalculate action, mark-paid flow.

Before starting, flag explicitly (do not silently proceed): this module and Milestone 10
(Salaries) both represent "teacher compensation" in the legacy system with no reconciliation
between them (06_REFACTORING_PLAN.md §6). State that you're implementing PayrollRecord now
per spec, but that the compensationType field/enforcement from §6 must land before both
modules can safely coexist in production — ask if that decision has been made before you
build Milestone 10.

Follow the Coding Workflow with financial-correctness rigor in Self-review: manually trace
one recalculation by hand against your test data and confirm the numbers match.
```

---

## Part 10 — Milestone 10: Salaries

```
Task: Milestone 10 — Salaries. Reference: 03_DATABASE_DESIGN.md (teachersalaries),
05_FEATURE_INVENTORY.md (#8), 06_REFACTORING_PLAN.md (§6).

Scope: TeacherSalary model (hoursWorked * hourlyRate + bonuses - deductions +
transportationAllowance), unique per (teacherId, month, year). Add the compensationType
field ('PER_LESSON' | 'HOURLY') to the Teacher model from Milestone 6 and enforce at the
service layer that a teacher can only have one active compensation path per month — reject
(don't silently allow) a Salaries entry for a teacher whose compensationType is PER_LESSON,
and vice versa for Payroll generation. Frontend: salary entry/calculation UI.

Follow the Coding Workflow. In Analyze, confirm this is the point where the §6 reconciliation
decision gets enforced in code, not just documented. In Risks, address what happens to any
already-existing PayrollRecord/TeacherSalary data for a teacher if compensationType is
changed after the fact — this needs an explicit answer, not an assumption.
```

---

## Part 11 — Milestone 11: Reports

```
Task: Milestone 11 — Reports. Reference: 03_DATABASE_DESIGN.md §5 (aggregation pipelines),
05_FEATURE_INVENTORY.md (#9), 11_API_DESIGN.md (Reports endpoint), 16_IMPROVEMENTS.md
(#15, #16).

Scope: GET /reports?type=overview|by_teacher|by_subject|by_level&month=&year=&teacherId=
implemented as native MongoDB aggregation pipelines (see the $match/$group/$lookup example
in 03_DATABASE_DESIGN.md §5) — do not port the legacy's in-Node manual reduce() approach.
Frontend report views with a date-range picker.

Follow the Coding Workflow. In Explain, justify the aggregation pipeline approach's
performance characteristics vs. the legacy in-memory reduction. Self-review by comparing
pipeline output against a hand-computed expected result on a small fixed seeded dataset.
```

---

## Part 12 — Milestone 12: Notifications

```
Task: Milestone 12 — Notifications (new capability, not present in legacy). Reference:
05_FEATURE_INVENTORY.md, 16_IMPROVEMENTS.md (#14), 12_BACKLOG.md (M12).

Scope: build only the hook point/infrastructure — an internal event/notification service
that other modules (Payments for due-date reminders, Lessons for upcoming-lesson reminders)
can call, with the actual delivery channel (email/SMS/WhatsApp) left as a pluggable adapter
interface rather than a hard dependency. Do not pick and hard-wire a specific third-party
provider without confirming the choice first.

Follow the Coding Workflow. In Propose implementation, present the adapter interface design
and explicitly ask for confirmation on which channel(s) to actually wire up before building
a concrete adapter.
```

---

## Part 13 — Milestone 13: Settings

```
Task: Milestone 13 — Settings. Reference: 05_FEATURE_INVENTORY.md, 16_IMPROVEMENTS.md (#11, #13).

Scope: profile management (self-service), password change (must bump tokenVersion per
08_SECURITY.md, invalidating other sessions' access tokens), role/permission management UI
(ADMIN only), multi-device session list with per-session revoke (surfacing the
RefreshToken/family model from Milestone 2), searchable Activity Log view (ADMIN only) —
the data has been captured since Milestone 1's audit logger; this is the first UI to surface
it.

Follow the Coding Workflow. In Risks, confirm the session-revoke UI can't be used by a
non-admin to revoke another user's session (authorization check on the specific
refreshTokenId being revoked, not just role-gating the page).
```

---

## Part 14 — Milestone 14: Deployment

```
Task: Milestone 14 — Deployment. Reference: 09_DEPLOYMENT.md (full), 17_PRODUCTION_CHECKLIST.md.

Scope: VPS provisioning per 09_DEPLOYMENT.md — MongoDB installed and initialized as a
single-node replica set (rs.initiate), auth enabled with a least-privilege application user,
PM2 cluster mode process management with startup-on-boot, Nginx reverse proxy + TLS via
certbot, CORS origin locked to the actual production Vercel domain, nightly mongodump backup
job with an off-box copy, one full restore drill performed and documented. Vercel project
configured with VITE_API_BASE_URL pointing at the production API domain. GET /health wired
into an external uptime monitor.

Follow the Coding Workflow. Walk through 17_PRODUCTION_CHECKLIST.md item by item and report
status on each — do not mark this milestone complete with unchecked security or backup
items.
```

---

## Part 15 — Milestone 15: Testing

```
Task: Milestone 15 — Testing hardening pass (final, pre-cutover). Reference:
18_TESTING_STRATEGY.md (full).

Scope: confirm/backfill unit test coverage on shared/services (commissionCalculator,
conflict-overlap logic, atomicCounter) at 90%+; confirm integration coverage per module at
80%+ on business-logic branches, run against mongodb-memory-server in REPLICA-SET mode (not
standalone) so transaction code paths are actually exercised; implement the Playwright E2E
critical journeys listed in 18_TESTING_STRATEGY.md §3 (login→dashboard→logout,
student+teacher+lesson→payroll appearance, double-booking conflict surfaced in UI,
payment recording, RBAC denial for a TEACHER role attempting admin actions both in UI and
directly against the API).

Follow the Coding Workflow. In Self-review, report actual coverage numbers achieved per
layer against the targets in 18_TESTING_STRATEGY.md §5, and flag any gap honestly rather
than rounding up.
```
