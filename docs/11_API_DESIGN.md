# 11 — API Design

Base path: `/api/v1`. All responses use one consistent envelope.

## 1. Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { /* resource or array */ },
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```
`meta` present only on paginated list endpoints.

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "المعلم لديه حصة في هذا الوقت مسبقاً",
    "details": [ { "field": "startTime", "message": "..." } ]
  }
}
```
`code` is a stable machine-readable string (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`); `message` is user-facing (Arabic by default, matching the legacy system's locale); `details` present only for validation errors.

## 2. Endpoints

### Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/login` | none | rate-limited strictly |
| POST | `/auth/refresh` | refresh cookie | rotates token |
| POST | `/auth/logout` | access token | revokes current refresh token |
| POST | `/auth/logout-all` | access token | revokes all refresh tokens for user |
| GET | `/auth/me` | access token | current session info |

### Students
| Method | Path | Roles |
|---|---|---|
| GET | `/students?page=&limit=&search=&status=` | any authenticated |
| GET | `/students/:id` | any authenticated |
| POST | `/students` | ADMIN, RECEPTIONIST |
| PATCH | `/students/:id` | ADMIN, RECEPTIONIST |
| DELETE | `/students/:id` | ADMIN (soft delete) |

### Teachers
| Method | Path | Roles |
|---|---|---|
| GET | `/teachers?page=&limit=&search=&isActive=` | any authenticated |
| GET | `/teachers/:id` | any authenticated |
| POST | `/teachers` | ADMIN |
| PATCH | `/teachers/:id` | ADMIN |
| DELETE | `/teachers/:id` | ADMIN (soft delete) |

### Lessons
| Method | Path | Roles |
|---|---|---|
| GET | `/lessons?teacherId=&studentId=&date=&status=` | any authenticated (teachers scoped to own lessons — see Security §2) |
| POST | `/lessons` | ADMIN, RECEPTIONIST — returns `409 CONFLICT` on scheduling clash |
| PATCH | `/lessons/:id` | ADMIN, RECEPTIONIST, TEACHER (status/notes only for TEACHER) |
| DELETE | `/lessons/:id` | ADMIN |

### Payments
| Method | Path | Roles |
|---|---|---|
| GET | `/payments?studentId=&status=` | ADMIN, RECEPTIONIST, ACCOUNTANT |
| POST | `/payments` | ADMIN, RECEPTIONIST, ACCOUNTANT |
| PATCH | `/payments/:id` | ADMIN, RECEPTIONIST, ACCOUNTANT |
| DELETE | `/payments/:id` | ADMIN |

### Payroll
| Method | Path | Roles |
|---|---|---|
| GET | `/payroll?teacherId=&month=&year=` | ADMIN, ACCOUNTANT |
| POST | `/payroll/generate` | ADMIN, ACCOUNTANT — triggers `recalculatePayrollForTeacher` |
| PATCH | `/payroll/:id` | ADMIN, ACCOUNTANT (mark paid) |

### Salaries
| Method | Path | Roles |
|---|---|---|
| GET | `/salaries?teacherId=&month=&year=` | ADMIN, ACCOUNTANT |
| POST | `/salaries` | ADMIN, ACCOUNTANT |
| POST | `/salaries/calculate` | ADMIN, ACCOUNTANT |
| PATCH | `/salaries/:id` | ADMIN, ACCOUNTANT |

### Reports
| Method | Path | Roles |
|---|---|---|
| GET | `/reports?type=overview\|by_teacher\|by_subject\|by_level&month=&year=&teacherId=` | ADMIN, ACCOUNTANT |

### Activity Log
| Method | Path | Roles |
|---|---|---|
| GET | `/activity-log?userId=&entityType=&entityId=` | ADMIN |

## 3. Conventions

- Plural nouns for collections, `:id` for a single resource — matches the legacy system's already-reasonable REST shape.
- All list endpoints paginated (`page`, `limit`, default `limit=10`, capped at `limit=100` server-side to prevent abuse).
- All dates in request/response bodies are ISO-8601 strings; the API is timezone-agnostic (stores UTC, frontend formats to local/Arabic display).
- Every mutating endpoint validated by a Zod schema middleware **before** the controller runs.
- HTTP status codes used precisely: `200` (read/update success), `201` (created), `204` (deleted, no body), `400` (validation), `401` (not authenticated), `403` (authenticated but forbidden), `404`, `409` (conflict — scheduling clash, duplicate unique field), `500` (unhandled, logged, never leaks internals).
