# 18 — Testing Strategy

## 1. Layers & Tools

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest (or Jest) | Pure functions in `shared/services` and `shared/utils` — `commissionCalculator`, `atomicCounter`, conflict-overlap logic, Zod schemas |
| Integration | Vitest/Jest + Supertest + `mongodb-memory-server` (replica-set mode for transaction tests) | Full request→response per module, including transactional writes |
| E2E | Playwright | Critical user journeys end to end against a running frontend+backend |
| Frontend component | React Testing Library | Shared design-system components in isolation (`DataTable`, `FormDialog`, `StatusBadge`) |

## 2. Priority Order (highest financial/correctness risk first)

1. **`commissionCalculator`** — exhaustive unit tests across both commission models, zero-price edge case, rounding behavior.
2. **Lesson conflict detection** — unit tests for exact overlap, adjacent-but-not-overlapping, cross-midnight edge cases.
3. **Payroll recalculation** — integration test simulating a month of mixed COMPLETED/CANCELLED/NO_SHOW lessons, verifying `finalAmount` and the audit diff written to `PayrollTransaction`.
4. **Auth flows** — token issuance, refresh rotation, reuse-detection revocation, logout-all-devices, RBAC denial paths (403s), not just happy paths.
5. **Student/Teacher CRUD** — atomic ID generation under concurrent creation (a real integration test spinning up parallel requests, not just a unit test of the counter logic alone).
6. Remaining CRUD modules (Payments, Salaries) — standard integration coverage.
7. **Reports aggregations** — integration tests comparing pipeline output against a hand-computed expected result for a fixed seeded dataset.

## 3. E2E Critical Journeys (Playwright)

- Login → view dashboard → logout.
- Create a student → create a teacher → book a lesson → mark it completed → verify it appears in that month's payroll.
- Attempt to double-book a teacher at an overlapping time → verify the 409 conflict is surfaced correctly in the UI (not just the API).
- Record a payment against a student → verify status updates reflect correctly in the list and filters.
- RBAC: log in as TEACHER role → verify admin-only actions (delete student, generate payroll) are not accessible in the UI and are rejected if attempted directly against the API.

## 4. Local Test Environment

`mongodb-memory-server` configured in **replica-set mode** for integration tests (not standalone), since transactional code paths would otherwise silently pass tests while failing against a real single-node-without-replica-set misconfiguration — this is the one environment detail most likely to cause "works in tests, fails in review" surprises if skipped.

## 5. Coverage Targets

- `shared/services` and `shared/utils`: 90%+ (this is where financial correctness lives).
- Module services: 80%+ on business logic branches (not chasing 100% on trivial getters).
- Controllers/routes: covered indirectly via integration tests, not unit-tested in isolation (thin controllers have little logic worth isolating).
- Frontend: shared design-system components tested for props/interaction contracts; feature pages covered primarily by E2E, not exhaustive unit tests of composition code.

## 6. CI Gate

Every PR: lint → unit → integration → build. E2E runs on a schedule (nightly) and before any production deploy, not on every commit, to keep PR feedback fast.
