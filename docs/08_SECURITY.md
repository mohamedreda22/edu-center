# 08 — Security

## 1. Authentication

- **Access token:** short-lived JWT (15 min), signed with `JWT_ACCESS_SECRET`, sent as `Authorization: Bearer` header (not a cookie — avoids CSRF exposure for the token that actually grants API access).
- **Refresh token:** long-lived (7-30 days), signed with `JWT_REFRESH_SECRET`, stored **hashed** in the `refreshtokens` collection, delivered to the client only via an `httpOnly`, `Secure`, `SameSite=None` cookie (cross-origin Vercel↔VPS requires `SameSite=None`, which requires `Secure`, which requires HTTPS on both sides — non-negotiable).
- **Rotation:** every refresh exchange issues a new refresh token and revokes the old one (rotation family tracked via `family` field); reuse of a revoked token revokes the entire family and forces re-login — standard reuse-detection pattern, which the legacy system had no equivalent of at all (it had no refresh tokens).
- **Logout (single device):** deletes the current refresh token document.
- **Logout everywhere:** deletes all `refreshtokens` for the `userId` and increments `users.tokenVersion`; access tokens embed the token version at issuance so any already-issued access token is rejected once the version no longer matches, capping the exposure window to the access token's own short TTL.
- **Password storage:** bcrypt, cost factor 12. No fallback secret allowed — boot fails if `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are unset (directly fixes the legacy hardcoded-fallback vulnerability).

## 2. Authorization (RBAC)

- Roles: `ADMIN`, `RECEPTIONIST`, `TEACHER`, `ACCOUNTANT` (ported from legacy).
- `authorize(...roles)` middleware, applied per-route, e.g. student/teacher/lesson mutations restricted to `ADMIN`/`RECEPTIONIST`; payroll finalization restricted to `ADMIN`/`ACCOUNTANT`.
- No role check is ever implicit — every mutating route explicitly declares its allowed roles (legacy already does this reasonably well; Edu-Core keeps the pattern and applies it uniformly, including to a couple of legacy routes that only checked authentication, not role, on read-heavy endpoints where role scoping may matter, e.g. teacher-scoped visibility of their own schedule only).

## 3. HTTP Hardening

- **Helmet** with a strict Content-Security-Policy (no inline scripts), `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- **CORS**: explicit allow-list containing only the Vercel frontend origin(s), `credentials: true`.
- **Compression**: gzip/brotli via the `compression` middleware.
- **Rate limiting**: `express-rate-limit`, tiered — strict on `/auth/login` and `/auth/refresh` (e.g. 5 requests/minute/IP), looser on general API traffic. In-memory store by default (see `06_REFACTORING_PLAN.md` §5 for why this must never fail open).

## 4. Input Handling

- **Validation**: Zod schemas on every mutating endpoint, mirrored (not shared via package, since frontend/backend are separately deployed) on the frontend for immediate UX feedback — server validation is always the actual security boundary.
- **Sanitization**: strip/escape any HTML in free-text fields (`notes`, `bio`) before storage; MongoDB's parameterized query model already prevents classic NoSQL operator injection as long as request bodies are validated against a strict Zod schema first (never pass raw `req.body` into a Mongoose query).
- **File uploads** (CV, certificates, avatars): allow-listed MIME types, size limits enforced server-side (not just via `accept=` on the `<input>`), stored outside the web root on the VPS with randomized filenames, served via a signed/short-lived URL or an authenticated download route rather than a public static path.

## 5. CSRF

Because the access token lives in an `Authorization` header (not a cookie), CSRF cannot target the primary API surface. The refresh-token cookie is the one cookie-based credential — mitigated by `SameSite=None; Secure` plus binding refresh tokens to the requesting `userAgent`/IP fingerprint as an additional signal (logged, not solely relied upon, since IPs/agents can legitimately change).

## 6. Environment Variables

Validated at boot with a Zod schema (`config/env.js`); missing or malformed required vars crash the process immediately rather than silently defaulting.

Required variables (backend):
```
NODE_ENV
PORT
MONGO_URI
JWT_ACCESS_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN
CORS_ORIGIN
COOKIE_DOMAIN
LOG_LEVEL
```

Frontend (Vite, must be prefixed `VITE_` to be exposed to the client — never put secrets here):
```
VITE_API_BASE_URL
```

`.env` files are gitignored; production values live only in Vercel's project settings (frontend) and the VPS's process manager environment/`.env` file with restrictive filesystem permissions (backend).

## 7. Audit & Monitoring

- Every financial mutation (lesson create/status change, payment status change, payroll recalculation) writes an `activitylogs` document in addition to Winston request logs — kept intentionally separate (operational vs. business audit trail).
- Failed login attempts logged with IP/user-agent; repeated failures against the same account trigger a temporary lockout (new capability, not present in legacy).

## 8. Known Gaps Carried Forward as Explicit Risks (not silently fixed, tracked instead)

See `15_RISK_ANALYSIS.md` for infrastructure-level risks (single VPS, single Mongo node) that are accepted trade-offs of the stated deployment target rather than code-level security gaps.
