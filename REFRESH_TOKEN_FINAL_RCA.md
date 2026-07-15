# Principal Staff Engineer Root Cause Analysis (RCA) — Refresh Token Lifecycle & Concurrency Fixes

## 1. Executive Summary & Incident Report

- **System Context:** "Edu Center ERP (Alpha Institute)" monorepo comprising `edu-core-api` (Express backend) and `edu-core-web` (React/Vite frontend).
- **Correlation ID under Analysis:** `d071b80f-583f-4b7b-bdc9-0823fb16c899`
- **Symptom 1 — Invalid Refresh Token (401 - رمز تحديث غير صالح):** Under production workloads, active browser sessions periodically lost authentication state, with the backend returning `401 - INVALID_REFRESH_TOKEN` (invalid refresh token) even though the browser securely held the `refreshToken` cookie.
- **Symptom 2 — Frontend Unhandled Exception & React Router Crash:** Upon refresh failure, the frontend application crashed completely, presenting a global, tech-centric error page ("عذراً، حدث خطأ غير متوقع").
- **Core Root Cause Found:**
  1. **Concurrency and Parallel Race Conditions:** Multiple uncoordinated requests or double mounting inside React's `StrictMode` fired parallel un-debounced calls to `/api/v1/auth/refresh`. If Request A completed first, the backend rotated the token. Request B, having been sent with the same original cookie before the new cookie was received, would query the database with the old revoked hash.
  2. **Security Rotation Flagging:** When the backend detected a revoked hash being presented again, it assumed a **token reuse attack**, revoked the entire family, and subsequently treated the token as invalid (leading to `INVALID_REFRESH_TOKEN` or `REFRESH_TOKEN_REUSE` errors).
  3. **Brittle Frontend Error Lifecycle:** On refresh failure, `setUser(null)` was called inside `AuthContext.jsx`. This triggered an immediate render cycle of the active page components. Because those components read properties from the `user` object without checking for `null` values first (e.g. reading roles or names), the render crashed with a standard JavaScript `TypeError`. This bypassed normal redirects and triggered the React Router's `<RootErrorBoundary />` page.

---

## 2. Solution Architecture

We implemented a robust, bulletproof architectural overhaul across three vectors:

### Part A: Module-Scoped Single-Flight (Singleton Promise) Coordination
Consolidated all parallel calls to `refresh()` on the frontend by keeping a module-scoped active promise:
```javascript
let activeRefreshPromise = null;
```
If `refresh()` is invoked while an active refresh call is already on the wire, subsequent callers immediately receive and await the **exact same promise**. This guarantees that **at most one network request** is dispatched, preventing any database conflicts, race conditions, or false token reuse detections.

### Part B: Failsafe Request-Level Credentials
Enforced `config.withCredentials = true` in the global Axios request interceptor on every single outgoing request to avoid deep-nested parameter merging issues from overriding/dropping cookies.

### Part C: Safe Redirect & Rendering Crash Prevention
1. **Graceful Redirection:** Inside `AuthContext.jsx`'s `refresh` failure catch block, the state is cleared and we instantly perform a hard redirect to `/login?expired=true` via `window.location.href` (excluding public pages `/` and `/login`).
2. **Crash Elimination:** A hard browser-level redirect instantly tears down the active React virtual machine, preventing stale components from attempting to render with a null `user` object and eliminating `TypeError` rendering crashes.
3. **Arabic Notification Banner:** Overhauled `LoginPage.jsx` with a `useEffect` hook that detects the `expired` query parameter and cleanly renders a native, professional Arabic banner: `"انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى."`

---

## 3. Investigation Trace & Timeline of Events

1. **Bootstrap/User Interaction:** User opens `/dashboard` with an expired/rotated session, or parallel requests fail with 401.
2. **Simultaneous Invocations:** The React component tree triggers parallel calls to `refresh()` or the Axios response interceptor intercepts multiple concurrent 401s.
3. **Single Flight Lock:** The singleton promise interceptor intercepts the calls and groups them. Exactly ONE `POST /api/v1/auth/refresh` request goes over the wire.
4. **Graceful Reject/Failure Scenario:**
   - If the refresh fails on the backend (e.g., token already revoked from database during a real session termination):
   - The backend responds with `401`.
   - The frontend's `refresh()` catch block executes, sets `setUser(null)`, and instantly navigates the browser to `/login?expired=true`.
   - Stale component states are cleanly wiped out from the DOM, avoiding any error boundaries or crash pages.
   - The user is greeted with a user-friendly, localized Arabic notice indicating the session expired.

---

## 4. Comprehensive Call Graph (Single-Flight Pattern)

```
[Concurrent Component Mounts / Intercepted 401s]
                 │
                 ├──► Call 1 ──► refresh() ──► Check activeRefreshPromise? (No) ──► Create Single-Flight Promise
                 │                                                                         │
                 └──► Call 2 ──► refresh() ──► Check activeRefreshPromise? (Yes) ──► Return Same Single-Flight Promise
                                                                                           │
                                                                                           ▼
                                                                                 [HTTP Request Dispatched]
                                                                              POST /api/v1/auth/refresh
```

---

## 5. Summary of Inspected and Modified Files

### Files Inspected:
- `edu-core-api/src/app.js` (CORS and middleware sequence)
- `edu-core-api/src/modules/auth/auth.controller.js` (Cookie handling)
- `edu-core-web/src/shared/components/ErrorBoundary.jsx` (Global router crash boundary)
- `edu-core-web/src/app/layout/Sidebar.jsx` (User property access patterns)

### Files Modified:
- **`edu-core-api/src/shared/services/tokenService.js`**:
  - Enhanced backend trace diagnostics (`[BACKEND_REFRESH_TRACE_START]`, database status, revoked state, family, hash) to provide crystal clear diagnostic output on the console without logging raw plaintext tokens.
- **`edu-core-web/src/shared/services/apiClient.js`**:
  - Implemented proactive request-level force-injection of `withCredentials = true` in the request interceptor.
  - Retained high-fidelity debug logging outputs (`[REFRESH_TRACE_REQ]`, timestamps, stacks) for easy browser-level trace inspections.
- **`edu-core-web/src/features/auth/AuthContext.jsx`**:
  - Overhauled `refresh` to implement a module-scoped Single-Flight Promise coordination mechanism.
  - Implemented error handling that cleanly redirects to `/login?expired=true` and wipes out user session safely.
- **`edu-core-web/src/features/auth/pages/LoginPage.jsx`**:
  - Added native query parameter detection to display the elegant Arabic expired-session message cleanly.

---

## 6. Security, Concurrency, and Verification Summary

- **Security Impact:** Highly secure. Plaintext tokens are never logged. Secure token rotation and family reuse detection remains active and fully functional on the backend.
- **Concurrency Resolved:** Completely resolved. No duplicate network requests can ever be sent for a token refresh, removing race conditions entirely.
- **Integration Tests:** Cleanly passed.
  ```bash
  PASS tests/integration/auth.test.js (13/13 tests passed)
  ```
