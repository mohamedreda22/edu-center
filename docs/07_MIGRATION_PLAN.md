# 07 — Migration Plan

This covers both **code migration** (rebuilding the app) and, separately, **data migration** (moving existing production data from Postgres to MongoDB if the legacy system has live data that must carry over — confirm with the business before Milestone 7; if this is a greenfield rebuild with no live data to preserve, skip §3 entirely).

## 1. Milestones (matches project instructions' 15-milestone structure)

| # | Milestone | Depends on | Key deliverable |
|---|---|---|---|
| 1 | Project foundation | — | Repos scaffolded (frontend Vite app, backend Express app), env config, lint/prettier, CI skeleton |
| 2 | Authentication | 1 | Access+refresh JWT, RBAC middleware, login/logout/refresh endpoints and pages |
| 3 | Shared UI System | 1 | `DataTable`, `FormDialog`, `StatusBadge`, `SearchFilterBar`, `StatCard`, layout shell, RTL/dark-mode theming |
| 4 | Admin Dashboard | 2, 3 | KPI overview page, activity feed |
| 5 | Students Module | 2, 3 | Full CRUD, atomic ID generation, optional-login decision implemented |
| 6 | Teachers Module | 2, 3 | Full CRUD, structured availability, commission model |
| 7 | Scheduling (Lessons) | 5, 6 | Booking, conflict detection, revenue snapshot, attendance status updates |
| 8 | Payments | 5 | Payment CRUD, fixed status enum, linkage to lessons |
| 9 | Payroll | 7 | Monthly recalculation, transport deduction, audit trail |
| 10 | Salaries | 6 | Hourly compensation module, compensation-type reconciliation (per Refactoring Plan §6) |
| 11 | Reports | 7, 9 | Aggregation-pipeline-based overview/by-teacher/by-subject/by-level |
| 12 | Notifications | 8 (soft dep) | Hook point for payment reminders / lesson reminders (new capability, not in legacy) |
| 13 | Settings | 2 | Profile, role management, system configuration |
| 14 | Deployment | all | VPS provisioning, Nginx/PM2/replica-set setup, Vercel project, backups |
| 15 | Testing | ongoing per milestone | Unit/integration/e2e coverage per module (see `18_TESTING_STRATEGY.md`) |

Each milestone should ship independently testable: a working, demoable slice, not a partial cross-cutting layer.

## 2. Legacy → Edu-Core Field Mapping (representative excerpt; full mapping lives alongside migration scripts in Milestone 7)

| Legacy (Prisma/Postgres) | Edu-Core (Mongoose/MongoDB) | Transform |
|---|---|---|
| `Student.id` (cuid string) | `students._id` (ObjectId) | New ID generated; legacy ID preserved in `legacyId` field during migration window only |
| `Student.subjects` (comma string) | `students.subjects` (array) | `.split(',').map(trim)` |
| `Teacher.availableDays` (JSON-as-string) | `teachers.availability.days` (array) | `JSON.parse` then validate against `WEEKDAYS` enum |
| `Teacher.availableHours` (freeform string, e.g. `"9:00-13:00, 16:00-20:00"`) | `teachers.availability.slots` (array of `{start,end}`) | Regex-parse each comma-separated range |
| `Payment.status` enum (no `PARTIALLY_PAID`) | `payments.status` enum (includes `PARTIALLY_PAID`) | Direct copy; no existing data can be `PARTIALLY_PAID` since legacy DB never allowed it — safe, additive |
| `Lesson.teacherPercentage/institutePercentage/teacherEarnings/instituteRevenue` | Same fields, embedded on `lessons` | Direct copy, preserves historical snapshot integrity |
| `PayrollRecord` unique `(teacherId, month, year)` | Same compound unique index | Direct copy |

## 3. Data Migration Procedure (only if live legacy data must be preserved)

1. **Export**: `pg_dump` or targeted Prisma queries to JSON per table.
2. **Transform**: Node script per collection applying the field mapping above; validate every transformed document against the target Mongoose schema *before* insertion (fail the batch loudly on any violation — never insert unvalidated data).
3. **ID re-mapping table**: build a Postgres-ID → Mongo-ObjectId lookup per entity during transform, used to rewrite all foreign-key references (`studentId`, `teacherId`, `lessonId`, etc.) consistently across dependent collections.
4. **Load order** (respects references): `users` → `students`/`teachers` → `lessons` → `payments`/`payrollrecords`/`teachersalaries` → `payrolltransactions` → `activitylogs`.
5. **Reconciliation pass**: after load, run aggregate checks — total lesson count, sum of `teacherEarnings`, sum of `payrollrecords.finalAmount` — compared against equivalent queries on the legacy Postgres data. Any mismatch blocks cutover.
6. **Parallel-run window** (recommended for the Payroll module specifically, given financial stakes): run Edu-Core's payroll recalculation against migrated data and diff against legacy `PayrollRecord` values for at least one full historical month before treating Edu-Core as authoritative.
7. **Cutover**: DNS/API endpoint switch from legacy to Edu-Core backend, legacy system kept read-only/archived for a defined retention period.

## 4. Rollback Plan

Keep the legacy Postgres database and application read-only and running (not decommissioned) for a minimum agreed window post-cutover. Because Edu-Core's `_id`s differ from legacy `id`s, rollback means reverting traffic to the legacy system, not merging Edu-Core writes back — any writes made in Edu-Core during a rollback window would need manual reconciliation. This asymmetry should be explicitly accepted by the business before go-live, not discovered afterward.
