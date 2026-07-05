# 05 — Feature Inventory

Legend: **Priority** (Critical/High/Medium/Low for MVP parity) · **Complexity** (effort to build correctly in Edu-Core) · **Migration Difficulty** (risk/effort translating legacy business rules, independent of raw build effort).

## 1. Authentication & Session Management
- **Purpose:** Login, logout, session check, role-based access.
- **Dependencies:** `users` collection, JWT, bcrypt.
- **Modules:** `modules/auth` (backend), `features/auth` (frontend).
- **Priority:** Critical | **Complexity:** Medium | **Migration Difficulty:** Medium (adding refresh rotation is new work, not a port).
- **Reuse Strategy:** Reuse role enum and permission checks conceptually; auth mechanism is rebuilt, not ported.
- **Recommended Improvements:** refresh token rotation, logout-all-devices, account lockout after N failed attempts, remove hardcoded secret fallback.

## 2. Student Management
- **Purpose:** CRUD for student profiles, enrollment status, guardian info.
- **Dependencies:** `users`, `students`, atomic ID counter.
- **Modules:** `modules/students`, `features/students`.
- **Priority:** High | **Complexity:** Medium | **Migration Difficulty:** Medium (ID generation and optional-login redesign).
- **Reuse Strategy:** Port Zod field rules and Arabic educational-level enum directly.
- **Recommended Improvements:** make student login optional (not auto-created), transactional create, structured `subjects` array instead of comma-string.

## 3. Teacher Management
- **Purpose:** CRUD for teacher profiles, commission model, availability, transport.
- **Dependencies:** `users`, `teachers`.
- **Modules:** `modules/teachers`, `features/teachers`.
- **Priority:** High | **Complexity:** Medium-High | **Migration Difficulty:** Medium-High (availability data model redesign).
- **Reuse Strategy:** Port commission model enum and percentage-snapshot pattern exactly (this is core financial logic that must stay behaviorally identical).
- **Recommended Improvements:** structured availability sub-document (replacing string-encoded JSON), CV/certificate file validation (type/size limits — absent in legacy).

## 4. Scheduling / Lessons
- **Purpose:** Book lessons between teacher and student, detect conflicts, snapshot revenue split.
- **Dependencies:** `students`, `teachers`, `lessons`, `payrolltransactions`.
- **Modules:** `modules/lessons`, `features/scheduling`.
- **Priority:** Critical | **Complexity:** High | **Migration Difficulty:** High (this is the core domain engine; conflict logic and revenue math must be extracted into a well-tested service).
- **Reuse Strategy:** Preserve exact commission-snapshot behavior; preserve Arabic conflict error copy as the default locale string.
- **Recommended Improvements:** replace blanket ±24h conflict block with true time-overlap detection; wrap create in a transaction; extract commission calculation into a pure, unit-testable function shared between lesson creation and payroll recalculation (fixing the legacy's duplicated math).

## 5. Attendance
- **Purpose:** Mark lesson outcome (completed/absent/cancelled) per day with notes.
- **Dependencies:** `lessons` (status/notes fields).
- **Modules:** folded into `modules/lessons` (no separate collection — matches actual legacy behavior).
- **Priority:** Medium | **Complexity:** Low | **Migration Difficulty:** Low.
- **Reuse Strategy:** Direct port of the "filtered lesson list + status PATCH" pattern.
- **Recommended Improvements:** decide deliberately whether to keep attendance folded into lessons or promote it to its own collection now (recommended if per-session attendance history independent of lesson identity becomes a reporting need) — see `16_IMPROVEMENTS.md`.

## 6. Payments
- **Purpose:** Track student fee payments, optionally linked to a lesson.
- **Dependencies:** `students`, `lessons` (optional), `payments`.
- **Modules:** `modules/payments`, `features/payments`.
- **Priority:** High | **Complexity:** Medium | **Migration Difficulty:** Medium.
- **Reuse Strategy:** Port field shape; fix the enum mismatch (add `PARTIALLY_PAID` to the persisted schema, not just the validator).
- **Recommended Improvements:** partial-payment running-balance tracking, payment reminders/notifications hook point.

## 7. Payroll (lesson-based)
- **Purpose:** Monthly aggregation of completed lessons into payable teacher payroll, with transport deduction and full audit trail.
- **Dependencies:** `lessons`, `teachers`, `payrollrecords`, `payrolltransactions`.
- **Modules:** `modules/payroll`, `features/payroll`.
- **Priority:** Critical | **Complexity:** High | **Migration Difficulty:** High (financial correctness — needs parallel-run verification against legacy numbers before cutover).
- **Reuse Strategy:** Port the aggregation formula and diff-audit pattern exactly.
- **Recommended Improvements:** wrap recalculation in a transaction; reconcile with the Salaries module (see below) to avoid two competing "teacher pay" sources of truth.

## 8. Salaries (hourly-based)
- **Purpose:** Manual hourly-rate compensation entry, separate from lesson-based payroll.
- **Dependencies:** `teachers`, `teachersalaries`.
- **Modules:** `modules/salaries`, `features/salaries`.
- **Priority:** High | **Complexity:** Medium | **Migration Difficulty:** Medium — flagged for a product decision (see `06_REFACTORING_PLAN.md`) on whether this coexists with or is superseded by lesson-based payroll per teacher type.
- **Reuse Strategy:** Port field shape as-is pending the product decision.
- **Recommended Improvements:** explicit `compensationType` field on `teachers` (`PER_LESSON` vs `HOURLY`) to make the two systems mutually exclusive per teacher rather than ambiguously parallel.

## 9. Reports
- **Purpose:** Financial dashboards — overview, by teacher, by subject, by level.
- **Dependencies:** `lessons`, `teachers`.
- **Modules:** `modules/reports`, `features/reports`.
- **Priority:** Medium | **Complexity:** Medium | **Migration Difficulty:** Low (maps cleanly onto MongoDB aggregation, arguably simpler than the legacy manual-reduce approach).
- **Reuse Strategy:** Port the four report "shapes" as the initial API contract.
- **Recommended Improvements:** date-range presets, CSV/PDF export, teacher-level drill-down.

## 10. Activity Log / Audit Trail
- **Purpose:** Generic audit trail for user actions across all modules.
- **Dependencies:** `users`, `activitylogs`.
- **Modules:** `shared/services/auditLogger` (cross-cutting, not a page-level feature).
- **Priority:** Medium | **Complexity:** Low | **Migration Difficulty:** Low — direct port.
- **Recommended Improvements:** admin-facing searchable activity log UI (legacy stores the data but the dashboard pages don't appear to surface it).

## 11. Dashboard Overview
- **Purpose:** Landing KPI page — counts, revenue snapshot, recent activity.
- **Dependencies:** aggregates from students/teachers/lessons/payments.
- **Modules:** `modules/reports` (stats endpoint), `features/dashboard`.
- **Priority:** Medium | **Complexity:** Low-Medium | **Migration Difficulty:** Low.
- **Recommended Improvements:** role-specific dashboards (a teacher's view vs. an admin's view) — legacy appears to show one generic dashboard regardless of role.

## Summary Priority Matrix

| Feature | Priority | Complexity | Migration Difficulty |
|---|---|---|---|
| Auth | Critical | Medium | Medium |
| Scheduling/Lessons | Critical | High | High |
| Payroll | Critical | High | High |
| Students | High | Medium | Medium |
| Teachers | High | Medium-High | Medium-High |
| Payments | High | Medium | Medium |
| Salaries | High | Medium | Medium |
| Attendance | Medium | Low | Low |
| Reports | Medium | Medium | Low |
| Activity Log | Medium | Low | Low |
| Dashboard | Medium | Low-Medium | Low |
