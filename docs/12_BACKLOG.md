# 12 — Backlog

Grouped by milestone (see `07_MIGRATION_PLAN.md` for milestone definitions). Within each milestone, ordered by dependency, not necessarily priority.

## Milestone 1 — Project Foundation
- [ ] Scaffold `edu-core-api` (Express, folder structure per `10_FOLDER_STRUCTURE.md`)
- [ ] Scaffold `edu-core-web` (Vite + React 19 + React Router)
- [ ] ESLint + Prettier config (both repos), pre-commit hook
- [ ] Zod-validated env loader (backend)
- [ ] Mongo connection module with replica-set readiness check
- [ ] Base Express app: Helmet, CORS, compression, request logger, error handler middleware wired

## Milestone 2 — Authentication
- [ ] `User` and `RefreshToken` models
- [ ] `tokenService` (sign/verify access+refresh, rotation, family tracking)
- [ ] Login/refresh/logout/logout-all endpoints
- [ ] `authenticate`/`authorize` middlewares
- [ ] Frontend: `AuthProvider`, login page, protected route wrapper, axios interceptor for silent refresh

## Milestone 3 — Shared UI System
- [ ] Install/theme shadcn/ui primitives, RTL + dark-mode CSS variables
- [ ] `DataTable`, `SearchFilterBar`, `StatusBadge`, `FormDialog`, `ConfirmDialog`, `StatCard`, `EmptyState`, `ErrorState`, `PageHeader`, `MoneyDisplay`
- [ ] `AppShell` (Sidebar + Navbar), role-based nav items

## Milestone 4 — Admin Dashboard
- [ ] `reports` overview aggregation endpoint
- [ ] Dashboard page: KPI `StatCard`s, recent-activity feed

## Milestone 5 — Students Module
- [ ] `Student` model + atomic ID counter
- [ ] Repository/service/controller/routes, decision implemented: optional `userId`
- [ ] Zod validation schema (ported field rules + Arabic messages)
- [ ] Frontend: list page, create/edit `FormDialog`, search/filter

## Milestone 6 — Teachers Module
- [ ] `Teacher` model with structured `availability` sub-document
- [ ] File upload handling for CV/certificates (validated, stored outside web root)
- [ ] Frontend: list/detail/create/edit

## Milestone 7 — Scheduling (Lessons)
- [ ] `Lesson` model + indexes
- [ ] `commissionCalculator` shared pure function
- [ ] Conflict-detection service (overlap-based, replacing legacy's ±24h block)
- [ ] Transactional create (lesson + payroll transaction)
- [ ] Frontend: `WeekScheduleGrid`, booking dialog, attendance status update flow

## Milestone 8 — Payments
- [ ] `Payment` model (with `PARTIALLY_PAID` in enum)
- [ ] CRUD endpoints, linkage to lessons
- [ ] Frontend: list/create/edit, status filter

## Milestone 9 — Payroll
- [ ] `PayrollRecord`/`PayrollTransaction` models
- [ ] `payroll.service.recalculateForTeacher` (transactional, reuses `commissionCalculator`)
- [ ] Frontend: payroll list, generate/recalculate action, mark-paid

## Milestone 10 — Salaries
- [ ] `TeacherSalary` model
- [ ] Product decision resolved: `compensationType` field on `Teacher`, mutual-exclusivity enforcement
- [ ] Frontend: salary entry/calculation UI

## Milestone 11 — Reports
- [ ] Aggregation pipelines: by_teacher, by_subject, by_level
- [ ] Frontend: report views, date-range picker, (stretch) CSV export

## Milestone 12 — Notifications (new capability)
- [ ] Hook point for payment-due and lesson-reminder notifications (channel — email/WhatsApp — deferred to a follow-up decision, not blocking core parity)

## Milestone 13 — Settings
- [ ] Profile management, password change (bumps `tokenVersion`)
- [ ] Role/permission management UI (ADMIN only)

## Milestone 14 — Deployment
- [ ] VPS provisioning per `09_DEPLOYMENT.md`
- [ ] Vercel project setup
- [ ] Backup job + restore drill

## Milestone 15 — Testing
- [ ] Unit tests for all `shared/services` (especially `commissionCalculator`, conflict detection)
- [ ] Integration tests per module (Supertest against a test Mongo instance)
- [ ] E2E happy-path per feature (Playwright)
