# 15 — Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Single-node MongoDB replica set is a single point of failure (no automatic failover) | Medium | High | Nightly off-box backups, documented/tested restore procedure, monitor disk and `mongod` process health; accept as a cost of the stated single-VPS deployment target, revisit if uptime SLAs tighten |
| Single VPS hosts both API and DB — resource contention under load | Medium | Medium | Monitor CPU/memory; PM2 cluster mode uses available cores; vertical scale the VPS before considering horizontal split |
| In-memory rate limiting doesn't share state across multiple Node instances | Low (single instance today) | Medium (if scaled) | Documented scaling trigger: move to a Mongo-backed or Redis-backed rate-limit store if/when horizontal scaling is introduced |
| Data migration from Postgres introduces silent field-mapping errors (e.g. `availableHours` string parsing) | Medium | High (financial/scheduling data corruption) | Mandatory reconciliation pass and parallel-run window for Payroll before cutover (`07_MIGRATION_PLAN.md` §3) |
| Two parallel compensation models (`PayrollRecord` vs `TeacherSalary`) go live without reconciliation | Medium | High (double-pay or missed-pay risk) | Blocking product decision required before Milestone 9/10 go live (`06_REFACTORING_PLAN.md` §6) |
| Floating-point rounding drift in commission/payroll math over many lessons | Low-Medium | Medium (financial discrepancies) | Consider integer minor-unit (cents/fils) storage for money fields instead of floats — recommended follow-up, not yet adopted from legacy which uses floats throughout |
| Cross-origin cookie misconfiguration (`SameSite`/`Secure`) breaks refresh flow silently in production only | Medium | Medium | Explicit deployment checklist item (`09_DEPLOYMENT.md`), tested against the actual Vercel production domain before go-live, not just localhost |
| Arabic/RTL rendering regressions as new shared components are added | Medium | Low-Medium | RTL verified as part of the Shared UI System milestone acceptance criteria, not treated as an afterthought pass at the end |
| Legacy conflict-detection logic (±24h blanket window) is looser than true overlap — if copied as-is it under- or over-blocks legitimate bookings | Medium | Medium | Deliberately upgraded to true time-overlap detection in Edu-Core (`06_REFACTORING_PLAN.md` §4), not a blind port |
| `activitylogs` grows unbounded over time with no archival strategy | Low near-term, Medium long-term | Low-Medium (storage growth, slower queries) | Add a TTL or periodic archival job once volume data is observed in production; not needed at launch |
| File uploads (CV, certificates) without validation become an attack vector or storage risk | Low if built per spec | Medium | Enforced at build time per `08_SECURITY.md` §4 (type/size allow-list, stored outside web root) |
| Business requirement drift discovered mid-build (e.g. student self-login needed sooner than planned) | Medium | Medium | Optional `userId` on `Student` designed in from the start (`03_DATABASE_DESIGN.md`) so this doesn't require a schema migration later |
