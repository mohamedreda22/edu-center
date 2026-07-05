# 06 — Refactoring Plan

Per the project's Refactoring Rules: understand → identify problems → suggest improvements → explain trade-offs → then (in later milestones) implement. This document is the "suggest improvements + trade-offs" step for every issue found in `01_PROJECT_ANALYSIS.md`. Nothing here is a blind rewrite; each item states the legacy behavior it preserves and what specifically changes.

## 1. Extract business logic into services

**Problem:** Commission math, conflict detection, and payroll aggregation live inline in Next.js route handlers (`app/api/lessons/route.ts`, `lib/payroll.ts`), duplicated conceptually in two places.
**Why it's a problem:** Untestable without spinning up HTTP, easy for the two implementations to drift (they already differ slightly in how they compute percentages), impossible to reuse from, e.g., a future bulk-import job.
**Production impact:** A future rate change or bug fix must be applied in two places; missing one silently produces wrong financial numbers.
**Solution:** A single `commissionCalculator.js` pure function (`{ lessonPrice, teacherPercentage } → { teacherEarnings, instituteRevenue }`), used by both `lesson.service.js` (on create) and `payroll.service.js` (on recalculation). Unit-tested in isolation.
**Trade-off:** None significant — this is strictly an improvement with no behavior change if implemented as a direct extraction of the existing formula.

## 2. Wrap multi-document writes in transactions

**Problem:** Student creation (`User` + `Student`), lesson creation (`Lesson` + `PayrollTransaction`), and payroll recalculation (`PayrollRecord` + `PayrollTransaction`) are each multiple separate writes with no atomicity.
**Why it's a problem:** A crash or validation failure between steps leaves orphaned or inconsistent data (e.g., a `User` with no matching `Student`).
**Production impact:** Data integrity bugs that are hard to detect and hard to clean up after the fact, especially in financial records.
**Solution:** Mongoose sessions/transactions (requires the single-node replica set noted in `03_DATABASE_DESIGN.md`), wrapped in a shared `withTransaction(fn)` helper.
**Trade-off:** Slightly more latency per write (transaction overhead) and requires the replica-set infra step during VPS setup — acceptable given the financial-correctness stakes.

## 3. Replace count-based ID generation

**Problem:** `studentId` (and implicitly `employeeId`) generated via `count() + 1`.
**Why it's a problem:** Classic race condition — two concurrent creates can read the same count and generate a duplicate ID, which then fails (or worse, succeeds if uniqueness isn't enforced consistently) unpredictably under load.
**Production impact:** Duplicate or skipped IDs under concurrent receptionist usage (a realistic scenario — multiple front-desk staff enrolling students at once).
**Solution:** Atomic counter document + `findOneAndUpdate({ $inc: { seq: 1 } }, { upsert: true, new: true })`, as detailed in `03_DATABASE_DESIGN.md`.
**Trade-off:** One extra collection and query per creation — negligible cost for a correctness guarantee.

## 4. Decouple student records from login accounts

**Problem:** Every student creation force-creates a `User` row with a synthetic, non-functional email and empty password.
**Why it's a problem:** Pollutes the `users` table with accounts that can never log in, conflates "is a student" with "can authenticate," and complicates future self-service portal work.
**Production impact:** Low immediate risk, but blocks a natural future feature (parent/student login) without further schema surgery.
**Solution:** Make `Student.userId` optional. A student gets a `User` account only when explicitly granted portal access (a deliberate action, not an automatic side effect of enrollment).
**Trade-off:** Requires a decision on what identifies a student in the UI when there's no linked user (answer: `studentCode` + stored `name`/`phone` fields directly on `Student`, rather than joined from `User`). This is a schema shape change, not just a bug fix — flagged for explicit confirmation before Milestone 5.

## 5. Fix rate limiting so it fails closed, not open

**Problem:** `checkRateLimit` returns `{ success: true }` (i.e., allows the request) whenever Upstash Redis env vars are absent.
**Why it's a problem:** On a bare VPS with no Redis configured (the stated deployment target has no managed Redis), rate limiting is **silently a no-op in production** — the opposite of "secure by default."
**Production impact:** No real brute-force protection on login or any other endpoint despite the code appearing to implement it.
**Solution:** Edu-Core uses `express-rate-limit` with an in-memory store by default (sufficient for a single-VPS deployment with no horizontal scaling), so protection is always active regardless of external service availability. If the app is later scaled to multiple instances, swap the store for a MongoDB- or Redis-backed one — but it must never silently disable itself.
**Trade-off:** In-memory store resets on process restart and doesn't share state across multiple instances — acceptable for the current single-VPS deployment target; documented as a scaling consideration in `15_RISK_ANALYSIS.md`.

## 6. Reconcile the two teacher compensation models

**Problem:** `PayrollRecord` (computed from completed lessons) and `TeacherSalary` (manual hourly entry) both represent "what a teacher is owed," with no field indicating which applies to a given teacher.
**Why it's a problem:** Ambiguous source of truth risks double-payment or missed payment if both are used for the same teacher in the same month.
**Production impact:** Financial/trust risk — this is money.
**Solution (needs product sign-off, not a unilateral engineering call):** Add `compensationType: 'PER_LESSON' | 'HOURLY'` to `Teacher`, and gate the UI/API so each teacher only has one active compensation path per month.
**Trade-off:** Requires a business decision on existing legacy data (are any teachers currently paid both ways?) before the field can be backfilled — this must be answered during Milestone 7 data migration, not assumed.

## 7. Break up God Components

**Problem:** `teachers/page.tsx` (464 lines), `payments/page.tsx` (430 lines), `salaries/page.tsx` (345 lines), `students/page.tsx` (355 lines) each combine data fetching, filter state, modal/dialog state, and table rendering in one file.
**Why it's a problem:** Impossible to unit test in isolation, high merge-conflict surface, no reuse of the table/dialog/filter patterns across modules (each page reinvents them slightly differently).
**Production impact:** Slower feature velocity, higher regression risk on every change.
**Solution:** Split along the lines in `04_UI_COMPONENTS.md` — `<DataTable>`, `<SearchFilterBar>`, `<FormDialog>` as shared components; each feature page becomes a thin composition (~50-80 lines) wiring TanStack Query hooks to those shared components.
**Trade-off:** Larger upfront build for the design system before feature pages feel fast to build — pays off starting at the second or third module built (Students, then Teachers get dramatically faster once the pattern exists).

## 8. Close the JWT-secret-fallback and enum-safety gaps

**Problem:** Hardcoded fallback JWT secret; `as any` casts on enum fields from user input.
**Why it's a problem:** Fallback secret means a misconfigured production deployment silently uses a public, guessable secret. `as any` defeats the type system exactly where invalid input (an enum value that doesn't exist) is most likely to cause downstream bugs.
**Production impact:** Auth bypass risk (guessable secret); potential for invalid enum values reaching the database if validation is ever bypassed.
**Solution:** Boot-time env validation (fails to start, not falls back) for `JWT_SECRET`/`JWT_REFRESH_SECRET`; Zod `.enum()` parsing on every input field with no `as any` escape hatches anywhere in the codebase (enforced via lint rule).
**Trade-off:** None — pure hardening.
