# 13 — Roadmap

Sequenced by dependency (from `07_MIGRATION_PLAN.md`). Durations are relative sizing (S/M/L/XL), not calendar commitments — actual pace depends on how many engineers are working in parallel.

```
Phase A — Foundation (blocks everything)
  M1 Project Foundation ............ S
  M2 Authentication ................ M
  M3 Shared UI System ............... M
       ↓
Phase B — Core Domain (can partially parallelize M5/M6)
  M5 Students Module ................ M
  M6 Teachers Module ................ M
       ↓
Phase C — Operational Core (hard dependency on B)
  M7 Scheduling (Lessons) ........... L   ← highest complexity, most legacy risk
       ↓ (parallel from here)
  M8 Payments ........................ M
  M9 Payroll .......................... L
  M10 Salaries ........................ M
       ↓
Phase D — Insight & Admin Layer
  M4 Admin Dashboard .................. S  (needs M7/M9 data to be meaningful; ordered here despite numbering)
  M11 Reports .......................... M
  M13 Settings .......................... S
       ↓
Phase E — Extended Capability
  M12 Notifications ..................... M
       ↓
Phase F — Go-Live
  M14 Deployment ......................... M
  M15 Testing ............................ (continuous, hardens through all phases; final pass before M14 cutover)
```

## Notes on sequencing rationale

- **M7 (Scheduling) is the critical path.** It's the highest-complexity module (conflict detection + commission snapshot) and everything financial (Payments, Payroll) depends on lessons existing. Do not start Payroll before Scheduling's commission-snapshot behavior is verified correct.
- **M4 (Admin Dashboard)** is listed early in the milestone numbering (project instructions list it 4th) but is more useful — and more testable — once there's real Students/Teachers/Lessons data to summarize. Recommend building a minimal placeholder in Phase A and the full KPI version in Phase D.
- **M9 (Payroll) and M10 (Salaries)** should not both go live without the `compensationType` reconciliation decision from `06_REFACTORING_PLAN.md` §6 being resolved — this is a roadmap blocker, not just a backlog item.
- **M15 (Testing)** is drawn as continuous rather than a final phase: each milestone should ship with its own unit/integration tests (per `18_TESTING_STRATEGY.md`); the "Testing" milestone at the end is the E2E/regression hardening pass before cutover, not the first time tests are written.
- **M14 (Deployment)** infra (VPS, replica set, Nginx, backups) can and should be provisioned in parallel with Phase A/B, so it's ready and validated well before the go-live cutover rather than being a last-minute scramble.
