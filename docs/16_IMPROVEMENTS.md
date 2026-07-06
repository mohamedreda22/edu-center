# 16 — Recommended Improvements (Beyond Parity)

These go beyond "preserve legacy functionality" — flagged separately so they can be consciously accepted, deferred, or rejected rather than silently bundled into the rebuild.

## Data & Domain
1. **Optional student self-login.** [IMPLEMENTED] Decoupled `Student` from a mandatory placeholder `User`.
2. **True time-overlap conflict detection** [IMPLEMENTED] for lessons, replacing the legacy's blanket ±24h block.
3. **Structured teacher availability** [IMPLEMENTED] (days + time slots as real sub-documents).
4. **Reconcile the two compensation models** [IMPLEMENTED] with an explicit `compensationType` field.
5. **Money as integer minor units** [IMPLEMENTED] (fils), eliminating rounding drift risk.
6. **Dedicated Attendance collection** [IMPLEMENTED] — Attendance is now its own collection referencing the lesson, supporting history and notes.

## User Experience
7. **Loading/empty/error states everywhere**, [IMPLEMENTED] standardized (`04_UI_COMPONENTS.md`).
8. **Confirm-before-destroy dialogs** [IMPLEMENTED] for delete/cancel actions.
9. **Role-specific dashboards** [IMPLEMENTED] — Admin sees KPIs; Teachers see their own upcoming schedule.
10. **Dark mode**, [IMPLEMENTED] via CSS variable theming.

## Security & Operations
11. **Multi-device session management UI** [IMPLEMENTED] — Sessions view in Settings with per-device revocation.
12. **Account lockout after repeated failed logins** [IMPLEMENTED] with exponential backoff.
13. **Searchable admin-facing Activity Log UI** [IMPLEMENTED] filterable view for `ADMIN`.
14. **Notification hooks** [IMPLEMENTED] production-ready architecture with Email and WhatsApp adapters.

## Reporting
15. **CSV export** [IMPLEMENTED] for reports.
16. **Date-range presets** [PLANNED/PARTIAL] on report filters.

Each of these should be scoped as a distinct, optional backlog item (see `12_BACKLOG.md`) rather than assumed — the core mandate remains preserving legacy functionality first; these are the deliberate, named exceptions where "significantly improving the codebase" extends to product surface, not just code quality.
