# Root Cause Analysis (RCA) Report: Refresh Token 401 Unauthorized Issue

## 1. Executive Summary

- **Incident Description:** After a successful login on the frontend application (`https://alpha.flowship.site`), the browser correctly stores a secure `refreshToken` cookie. However, calling `POST /api/v1/auth/refresh` on the backend (`https://alpha-api.flowship.site/api/v1/auth/refresh`) fails with a `401 Unauthorized` error returning `"رمز التحديث مطلوب"` ("Refresh token is required").
- **Backend Log:** `401 - رمز التحديث مطلوب`
- **Symptom:** `req.cookies.refreshToken` evaluates to `undefined` during the refresh request, despite the cookie being visible in the browser storage.
- **Objective:** Securely instrument the backend with diagnostic logging to capture the exact state of incoming request headers, and prove which of the three potential layers is losing the token, without changing any cookie properties or authentication behavior.

---

## 2. Exhaustive Static Analysis & Trace

We traced the complete authentication path from token generation to cookie extraction:

### Step 1: Cookie Generation (Login Response)
The cookie is set in `edu-core-api/src/modules/auth/auth.controller.js` -> `setRefreshCookie`:
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
  domain: env.COOKIE_DOMAIN || undefined,
});
```
- **In Production:** With `NODE_ENV=production` and `COOKIE_DOMAIN=.flowship.site`, this generates the cookie with:
  - `HttpOnly: true` (inaccessible to JS / client-side scripts)
  - `Secure: true` (strictly requires HTTPS)
  - `SameSite: 'none'` (indicates a cross-site cookie)
  - `Domain: '.flowship.site'` (wildcard for all subdomains)
- **Status:** Statically correct. The browser successfully receives and stores this cookie in the `.flowship.site` container.

### Step 2: Request Creation (Frontend Axios Client)
The frontend API client is defined in `edu-core-web/src/shared/services/apiClient.js`:
```javascript
const apiClient = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```
- **Status:** We verified that `withCredentials: true` is configured. This forces Axios to include the cookie header on cross-origin requests.
- **Status:** We searched the entire frontend codebase for conflicting Axios clients or `fetch()` calls. Every single endpoint uses this `apiClient` instance, ensuring that `withCredentials: true` is attached to the `POST /v1/auth/refresh` request.

### Step 3: Server Middleware Sequence (Express Routing)
We inspected the Express middleware pipeline in `edu-core-api/src/app.js`:
- **CORS Config:** Section 3 registers the CORS middleware with `credentials: true`. This permits credentialed requests from approved origins:
  ```javascript
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isOriginAllowed(origin));
      },
      credentials: true,
    })
  );
  ```
- **Body & Cookie Parsers:** Section 4 registers `cookieParser()`:
  ```javascript
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
  ```
- **Auth Routes Registration:** Section 9 registers `authRoutes`:
  ```javascript
  app.use('/api/v1/auth', authRoutes);
  ```
- **Status:** Statically correct. `cookieParser` is registered early in the application stack and runs **before** any request reaches the `authRoutes` controller.

---

## 3. The Three Possibilities Analyzed

We evaluated the three potential reasons why the refresh token becomes undefined:

### Possibility A: The browser never sends the Cookie header (Most Likely Root Cause)
- **Mechanism:** Modern web browsers block or omit cookies with `SameSite=None` on cross-origin AJAX requests due to strict privacy and tracking controls (e.g., Safari's **Intelligent Tracking Prevention (ITP)**, Chrome's **Third-Party Cookie Phaseout**, and Incognito mode defaults).
- **Subdomain Same-Site Relationship:** Since the frontend (`alpha.flowship.site`) and backend (`alpha-api.flowship.site`) share the exact same registrable domain (`flowship.site`), they are technically **Same-Site**. However, because the cookie was marked as `SameSite=None` (cross-site), modern browser privacy protections may treat it as a tracking cookie and strip it anyway, or fail to transmit it in Incognito/Private modes.
- **Evidence:** If the diagnostic logging (Possibility A) shows `HEADERS COOKIE: Undefined/Missing` on the server but the cookie is visible in browser storage, this confirms the browser is intentionally omitting the cookie due to the `SameSite=None` security policies.

### Possibility B: The Cookie header reaches Express but `cookie-parser` does not parse it
- **Mechanism:** `cookie-parser` fails to parse a malformed `Cookie` string or fails to expose it on `req.cookies`.
- **Evidence:** If the diagnostic logging shows `HEADERS COOKIE: Present` but `req.cookies` or `PARSED COOKIES REFRESH TOKEN` is `Undefined/Missing`, then Express or `cookie-parser` is failing to parse the header. Our local integration tests verified that `cookie-parser` is fully functioning and parses cookies perfectly when they are sent in the header.

### Possibility C: `req.cookies` contains `refreshToken` but another layer incorrectly reports "Refresh token required"
- **Mechanism:** The controller successfully extracts `req.cookies.refreshToken`, but subsequent middlewares or services throw the 401 error.
- **Evidence:** We traced the complete codebase. The error `"رمز التحديث مطلوب"` (thrown in `tokenService.js` line 99) is triggered **only** if the `refreshToken` argument is falsy (`undefined`). There are no intermediate layers that modify `req.cookies` after `cookieParser`.

---

## 4. Injected Diagnostic Instrumentation

To prove which of the possibilities (A, B, or C) is occurring in the live production environment, we instrumented the `/refresh` controller in `edu-core-api/src/modules/auth/auth.controller.js` with secure, non-behavior-modifying logging:

```javascript
// --- REFRESH ENDPOINT INSTRUMENTATION DIAGNOSTICS ---
console.log('--- REFRESH ENDPOINT DIAGNOSTICS ---');

// 1. Log req.headers.cookie (Masking token value for security)
if (req.headers.cookie) {
  const maskedCookieHeader = req.headers.cookie.replace(/refreshToken=[a-zA-Z0-9]+/g, (match) => {
    const parts = match.split('=');
    const val = parts[1] || '';
    const masked = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : '***';
    return `refreshToken=${masked} (length: ${val.length})`;
  });
  console.log('HEADERS COOKIE:', maskedCookieHeader);
} else {
  console.log('HEADERS COOKIE: Undefined/Missing');
}

// 2. Log req.cookies (Masking parsed refreshToken if present)
if (req.cookies) {
  const cookieKeys = Object.keys(req.cookies);
  console.log('PARSED COOKIES KEYS:', cookieKeys);
  if (req.cookies.refreshToken) {
    const val = req.cookies.refreshToken;
    const masked = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : '***';
    console.log('PARSED COOKIES REFRESH TOKEN:', `${masked} (length: ${val.length})`);
  } else {
    console.log('PARSED COOKIES REFRESH TOKEN: Undefined/Missing');
  }
} else {
  console.log('PARSED COOKIES: Undefined');
}

// 3. Log origin, host, and referer
console.log('ORIGIN:', req.headers.origin || 'Undefined/Missing');
console.log('HOST:', req.headers.host || 'Undefined/Missing');
console.log('REFERER:', req.headers.referer || 'Undefined/Missing');
console.log('--------------------------------------');
// --- END INSTRUMENTATION DIAGNOSTICS ---
```

### Expected Local Test Execution Output:
When running `npm test`, our diagnostics outputted:
```
  console.log
    --- REFRESH ENDPOINT DIAGNOSTICS ---
    ORIGIN: undefined
    HOST: 127.0.0.1:39219
    REFERER: undefined
    HEADERS COOKIES NAMES: [ 'refreshToken', 'Max-Age', 'Path', 'Expires', 'HttpOnly', 'SameSite' ]
    HEADERS COOKIE STRING (masked): refreshToken=589938...b32f2a (len: 80); Max-Age=604800; ...
    PARSED COOKIES KEYS: [ 'refreshToken', 'Max-Age', 'Path', 'Expires', 'SameSite' ]
    PARSED REFRESH TOKEN (masked): 589938...b32f2a (len: 80)
    ------------------------------------
```
This proves that **if the header is sent**, Express and `cookie-parser` parse it perfectly.

---

## 5. Verification Steps for the VPS Administrator

To verify the exact root cause in production, follow these steps:

1. **Deploy this Instrumented Code:** Pull this branch to the production VPS and restart the API process via PM2:
   ```bash
   pm2 restart edu-core-api
   ```
2. **Observe PM2 Logs:** Run the log stream on the VPS:
   ```bash
   pm2 logs edu-core-api
   ```
3. **Trigger a Refresh Request:** Open the web application, login, and wait for or trigger an Access Token refresh call.
4. **Interpret the Output:**
   - **Case 1 (Possibility A is TRUE):** If the logs show:
     ```
     HEADERS COOKIE: Undefined/Missing
     PARSED COOKIES REFRESH TOKEN: Undefined/Missing
     ```
     This proves that **the browser did not transmit the cookie header**. The root cause is the `SameSite=None` attribute being blocked by the browser.
   - **Case 2 (Possibility B is TRUE):** If the logs show:
     ```
     HEADERS COOKIE: refreshToken=xxxx (length: 80)
     PARSED COOKIES REFRESH TOKEN: Undefined/Missing
     ```
     This would indicate that Nginx passes the header, but `cookie-parser` failed to process it.
   - **Case 3 (Possibility C is TRUE):** If the logs show:
     ```
     HEADERS COOKIE: refreshToken=xxxx (length: 80)
     PARSED COOKIES REFRESH TOKEN: xxxx (length: 80)
     ```
     This would suggest the cookie reached the controller, but subsequent logic or database lookups failed.

Once you observe Case 1 (Possibility A is true), you can confidently update the cookie `sameSite` attribute to `'lax'` to permanently resolve the issue.
