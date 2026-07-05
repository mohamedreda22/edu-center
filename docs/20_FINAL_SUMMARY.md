# 20 — Final Summary

## What was analyzed

The legacy system (`mohamedreda22/edu-center`, product name "Rakan Institute Management System") is a Next.js 16 + Prisma + PostgreSQL monolith implementing an educational institute's operations: students, teachers, lesson scheduling with per-lesson commission splitting, payments, monthly payroll aggregation, an alternate hourly-salary track, and financial reporting — fully Arabic-first in its UI text and domain vocabulary.

This was read directly from source (schema, route handlers, validators, and page components), not assumed. Concrete findings — including several latent bugs (a status enum mismatch, a race-condition-prone ID generator, a rate limiter that fails open, a hardcoded JWT fallback secret, and two unreconciled compensation models) — are documented in `01_PROJECT_ANALYSIS.md` and carried through the plan as explicit, tracked items rather than silently fixed or silently copied.

## The one decision that shapes everything downstream

The legacy domain is relational by nature (foreign keys, unique compound constraints, multi-table transactional writes). The Edu-Core stack mandates MongoDB. This was flagged explicitly and **confirmed** as the direction to proceed with (`14_TECH_DECISIONS.md`, TD-01). Every schema, transaction, and aggregation decision in `03_DATABASE_DESIGN.md` is designed around making that relational-shaped domain work correctly and safely in MongoDB — most importantly, the requirement that the VPS's local MongoDB be initialized as a single-node **replica set**, without which the transactional writes this system depends on for financial correctness will simply fail at runtime.

## What Edu-Core preserves exactly

- The commission-snapshot model (a lesson locks in the teacher's rate at booking time; later rate changes never retroactively alter past earnings).
- The monthly payroll aggregation and transport-deduction formula.
- The full domain vocabulary: roles, statuses, commission models, Arabic educational levels, and Arabic-first user-facing text.
- The four-way report breakdown (overview / by teacher / by subject / by level).

## What Edu-Core deliberately changes

- Business logic moves out of route handlers into a real service layer (`06_REFACTORING_PLAN.md`).
- Multi-step writes become atomic transactions.
- ID generation becomes race-condition-free.
- Rate limiting is self-hosted and fails closed, not open.
- Student records no longer force-create a non-functional login account.
- Lesson conflict detection becomes true time-overlap based rather than a blanket 24-hour block.
- The `PARTIALLY_PAID` payment status becomes actually persistable, closing a real legacy bug.
- The frontend's largest legacy files (up to 464 lines) are decomposed into a genuine shared design system plus thin feature pages.

## What still needs a human decision before certain milestones proceed

1. **Compensation model reconciliation** (`PayrollRecord` vs `TeacherSalary`) — blocks Milestones 9/10 go-live.
2. **Whether any live legacy data must be migrated**, which determines whether `07_MIGRATION_PLAN.md` §3 (data migration) is in scope at all, or this is a clean greenfield build.
3. **Attendance as its own collection vs. staying folded into `Lesson.status`** — a genuine product question, not an engineering one (`16_IMPROVEMENTS.md` #6).

## Suggested next step

With documentation complete, Milestone 1 (Project Foundation) is ready to start: scaffolding both repositories per `10_FOLDER_STRUCTURE.md`, wiring the base Express app and Vite app, and setting up the Zod-validated environment configuration that the rest of the system depends on. Milestone 2 (Authentication) should follow immediately after, since every other module's endpoints depend on `authenticate`/`authorize` middleware existing.
