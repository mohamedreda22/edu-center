# 14 — Technical Decisions (ADR-style)

Each entry: decision, alternatives considered, rationale, trade-offs accepted.

## TD-01: MongoDB + Mongoose over PostgreSQL + Prisma

**Decision:** MongoDB, per explicit project requirement, confirmed after review.
**Alternatives considered:** Keep PostgreSQL/Prisma (the legacy DB's actual technology), given the domain's genuinely relational shape (FKs, unique compound constraints, transactional multi-table writes).
**Rationale for override:** explicit business/infrastructure requirement (MongoDB running locally on the Hostinger VPS) takes precedence; this document exists specifically because the analysis (`01_PROJECT_ANALYSIS.md`) flagged the mismatch and the decision was confirmed to proceed with MongoDB regardless.
**Trade-offs accepted:**
- Requires a single-node replica set purely to unlock transactions — an operational step Postgres would not have needed.
- Referential integrity (foreign keys) becomes application-enforced (via services/repositories) rather than database-enforced — Edu-Core mitigates this with strict service-layer validation and `populate()` checks before writes, but this is inherently weaker than a real FK constraint.
- Reporting aggregations (which Prisma's `groupBy` handled adequately) are reimplemented as MongoDB aggregation pipelines — more verbose, but ultimately more powerful and closer to the metal for the read-heavy Reports module.

## TD-02: Separate Frontend/Backend Deployables (Vite SPA + Express API) over Next.js Monolith

**Decision:** Split frontend (Vercel) and backend (Hostinger VPS), per explicit stack requirement.
**Rationale:** matches the stated infrastructure (Vercel for frontend, VPS for backend/DB) and the explicit React 19 + Vite + Express stack.
**Trade-offs accepted:** cross-origin cookie handling (`SameSite=None`, HTTPS mandatory both sides) is required where a Next.js monolith would have had same-origin cookies "for free." No server-side rendering/SEO benefit (acceptable — this is an internal admin ERP, not a public marketing site).

## TD-03: Access Token in Header, Refresh Token in httpOnly Cookie

**Decision:** hybrid token delivery rather than "everything in cookies" or "everything in localStorage."
**Alternatives considered:** both tokens in cookies (simpler, but doubles CSRF surface); both tokens in localStorage (simpler cross-origin story, but exposes both tokens to XSS).
**Rationale:** access token in a header is immune to CSRF and short-lived enough that XSS exposure window is small; refresh token in an httpOnly cookie is inaccessible to any XSS payload, which matters more since it's long-lived.

## TD-04: No External Cache/Queue (Redis) Dependency

**Decision:** in-memory rate limiting and no distributed cache, at least initially.
**Alternatives considered:** Upstash Redis (used by the legacy system for rate limiting).
**Rationale:** the stated deployment target is a single Hostinger VPS with local MongoDB only; introducing a managed external Redis dependency contradicts that self-hosted constraint, and the legacy system's Upstash integration already demonstrated the failure mode of an external dependency being unconfigured in production (see `06_REFACTORING_PLAN.md` §5).
**Trade-offs accepted:** rate limiting state doesn't survive process restarts and won't be shared if the app ever scales to multiple Node instances — documented as a scaling trigger in `15_RISK_ANALYSIS.md`, not ignored.

## TD-05: Feature-Based Frontend Structure over Type-Based (`pages/`, `components/`, `hooks/` at the root)

**Decision:** `features/<domain>/{pages,components,hooks,services,validations,types}`.
**Rationale:** the legacy system's flat `app/dashboard/<module>/page.tsx` structure already groups by domain implicitly; formalizing that as a feature-folder convention (rather than regressing to type-based grouping) keeps related code together and matches the project's explicit "Feature-Based Modular Architecture" requirement.

## TD-06: Shared Enums Defined Once, Imported Everywhere

**Decision:** a single `enums.js` per side (backend `shared/constants/enums.js`, frontend `shared/constants/enums.js`), manually kept in sync since the two apps are separately deployed.
**Alternatives considered:** a shared npm package/monorepo for true single-source enums.
**Rationale:** a monorepo/shared-package setup adds real build/tooling complexity (versioning, publishing or workspace linking across a Vercel + VPS split deployment) that isn't justified at this project's current size; the discipline of "define once per side, never inline a string literal for an enum value" directly prevents a repeat of the legacy `PARTIALLY_PAID` mismatch bug without that overhead.
**Revisit trigger:** if the enum set grows large or drifts are found in practice, promoting to a shared package becomes worth the tooling cost.

## TD-07: Soft Delete on Master Data Only, Never on Financial/Audit Collections

**Decision:** `deletedAt` on `users`, `students`, `teachers`; financial and audit collections (`lessons`, `payments`, `payrollrecords`, `payrolltransactions`, `activitylogs`) are never deleted, only status-transitioned (e.g. `CANCELLED`).
**Rationale:** financial history must remain immutable for audit purposes; master data (a student who leaves the institute) legitimately needs to disappear from active lists without losing historical linkage from past lessons/payments.
