# 16 — Recommended Improvements (Beyond Parity)

These go beyond "preserve legacy functionality" — flagged separately so they can be consciously accepted, deferred, or rejected rather than silently bundled into the rebuild.

## Data & Domain
1. **Optional student self-login.** Decouple `Student` from a mandatory placeholder `User` (already designed for in `03_DATABASE_DESIGN.md`); enables a future parent/student portal without further schema surgery.
2. **True time-overlap conflict detection** for lessons, replacing the legacy's blanket ±24h block, which can both under-block (two 1-hour lessons 20 hours apart on the same day for the same teacher would still be flagged as conflicting) and doesn't fully protect against same-time double-booking across day boundaries in edge cases.
3. **Structured teacher availability** (days + time slots as real sub-documents) instead of the legacy's string-encoded JSON — enables actually querying "which teachers are free Tuesday 4-6pm" instead of just displaying the string.
4. **Reconcile the two compensation models** with an explicit `compensationType` field (flagged as a blocking decision in `06_REFACTORING_PLAN.md`, listed here as the *positive* framing: this closes a real gap in the legacy system, it isn't only risk mitigation).
5. **Money as integer minor units** (fils/cents) rather than floats, eliminating rounding drift risk over the life of the payroll system.
6. **Dedicated Attendance collection** (optional) — if the business ever wants attendance history independent of a specific lesson record (e.g., tracking a pattern of no-shows across rescheduled lessons), promoting attendance from "just a lesson status field" to its own collection referencing the lesson becomes valuable. Not required for parity; a genuine product question.

## User Experience
7. **Loading/empty/error states everywhere**, standardized (`04_UI_COMPONENTS.md`) — the legacy system has none consistently, leaving blank screens on slow loads or failures.
8. **Confirm-before-destroy dialogs** for delete/cancel actions — not found anywhere in the legacy codebase.
9. **Role-specific dashboards** — a teacher logging in currently sees the same generic dashboard as an admin; scoping the dashboard (and lesson list) to "my own schedule" for the TEACHER role is a meaningful UX improvement with no architectural cost given RBAC is already in place.
10. **Dark mode**, designed in from the start via CSS variable theming rather than retrofitted.

## Security & Operations
11. **Multi-device session management UI** ("you're logged in on 2 devices, log out everywhere") — a natural surface for the new refresh-token-family architecture.
12. **Account lockout after repeated failed logins** — not present in legacy.
13. **Searchable admin-facing Activity Log UI** — the data is captured in legacy but never surfaced; Edu-Core keeps capturing it and adds a simple filterable view for `ADMIN`.
14. **Notification hooks** (payment due reminders, upcoming lesson reminders) — infrastructure hook point only in the initial build (Milestone 12); actual channel (SMS/WhatsApp/email) is a separate integration decision.

## Reporting
15. **CSV/PDF export** for reports — a natural extension once aggregation pipelines exist, not present in legacy.
16. **Date-range presets** (this month, last month, this term) on report filters instead of only explicit month/year pickers.

Each of these should be scoped as a distinct, optional backlog item (see `12_BACKLOG.md`) rather than assumed — the core mandate remains preserving legacy functionality first; these are the deliberate, named exceptions where "significantly improving the codebase" extends to product surface, not just code quality.
