# 17 — Production Readiness Checklist

## Security
- [ ] `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` set to strong random values (32+ bytes); process refuses to boot without them
- [ ] Refresh token rotation + reuse detection verified with a manual replay test
- [ ] Logout-all-devices verified (`tokenVersion` bump invalidates outstanding access tokens)
- [ ] RBAC verified per role for every mutating endpoint (test matrix, not spot checks)
- [ ] Helmet CSP, CORS allow-list, rate limiting confirmed active in the deployed environment (not just locally)
- [ ] File upload type/size validation confirmed server-side (not only client-side)
- [ ] No `console.log` of sensitive data (tokens, passwords, PII) anywhere in the codebase

## Data Integrity
- [ ] MongoDB replica set initialized and confirmed transactional writes succeed
- [ ] Atomic counters verified under concurrent load (simple load test creating students in parallel)
- [ ] Unique compound indexes confirmed present (`payrollrecords`, `teachersalaries` on `teacherId/month/year`)
- [ ] Compensation-type reconciliation decision implemented and enforced, not just documented

## Performance
- [ ] Indexes from `03_DATABASE_DESIGN.md` present and confirmed via `explain()` on the hot queries (lesson lookups, report aggregations)
- [ ] Frontend route-level code splitting confirmed (check bundle analyzer output)
- [ ] Image assets (avatars) optimized/resized on upload, not served at original resolution

## Reliability
- [ ] `/health` endpoint live and monitored
- [ ] Nightly backup job running, off-box copy confirmed, restore drill performed at least once
- [ ] PM2 configured to restart on crash and on VPS reboot

## Observability
- [ ] Winston logs writing to rotating files, log level appropriate for production (`info`, not `debug`)
- [ ] Correlation IDs present on requests and propagated into error responses
- [ ] Activity log capturing all financial mutations end-to-end (spot-checked against the module list in `05_FEATURE_INVENTORY.md`)

## Deployment
- [ ] Environment variables set correctly in both Vercel and the VPS process manager
- [ ] CORS origin matches actual production frontend domain
- [ ] TLS valid on the API domain, auto-renewal confirmed
- [ ] Rollback plan documented and understood by whoever is on call for go-live

## Data Migration (only if live legacy data is being carried over)
- [ ] Reconciliation totals (lesson counts, revenue sums, payroll totals) match between legacy and Edu-Core
- [ ] Parallel-run verification completed for at least one historical payroll month
- [ ] Legacy system retained read-only for the agreed retention window
