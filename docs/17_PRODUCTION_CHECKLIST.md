# 17 — Production Readiness Checklist

## Security
- [x] `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` set to strong random values (32+ bytes); process refuses to boot without them
- [x] Refresh token rotation + reuse detection verified with a manual replay test
- [x] Logout-all-devices verified (`tokenVersion` bump invalidates outstanding access tokens)
- [x] RBAC verified per role for every mutating endpoint (test matrix, not spot checks)
- [x] Helmet CSP, CORS allow-list, rate limiting confirmed active in the deployed environment (not just locally)
- [x] File upload type/size validation confirmed server-side (not only client-side)
- [x] No `console.log` of sensitive data (tokens, passwords, PII) anywhere in the codebase

## Data Integrity
- [x] MongoDB replica set initialized and confirmed transactional writes succeed
- [x] Atomic counters verified under concurrent load (simple load test creating students in parallel)
- [x] Unique compound indexes confirmed present (`payrollrecords`, `teachersalaries` on `teacherId/month/year`)
- [x] Compensation-type reconciliation decision implemented and enforced, not just documented

## Performance
- [x] Indexes from `03_DATABASE_DESIGN.md` present and confirmed via `explain()` on the hot queries (lesson lookups, report aggregations)
- [ ] Frontend route-level code splitting confirmed (check bundle analyzer output)
- [ ] Image assets (avatars) optimized/resized on upload, not served at original resolution

## Reliability
- [x] `/health` endpoint live and monitored
- [ ] Nightly backup job running, off-box copy confirmed, restore drill performed at least once
- [ ] PM2 configured to restart on crash and on VPS reboot

## Observability
- [x] Winston logs writing to rotating files, log level appropriate for production (`info`, not `debug`)
- [ ] Correlation IDs present on requests and propagated into error responses
- [x] Activity log capturing all financial mutations end-to-end (spot-checked against the module list in `05_FEATURE_INVENTORY.md`)

## Deployment
- [x] Environment variables set correctly in both Vercel and the VPS process manager
- [x] CORS origin matches actual production frontend domain
- [ ] TLS valid on the API domain, auto-renewal confirmed
- [ ] Rollback plan documented and understood by whoever is on call for go-live

## Data Migration (only if live legacy data is being carried over)
- [ ] Reconciliation totals (lesson counts, revenue sums, payroll totals) match between legacy and Edu-Core
- [ ] Parallel-run verification completed for at least one historical payroll month
- [ ] Legacy system retained read-only for the agreed retention window
