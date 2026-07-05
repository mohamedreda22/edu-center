# 19 — Coding Standards

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (backend modules) | `<name>.<layer>.js` | `lesson.service.js`, `student.controller.js` |
| Files (React components) | `PascalCase.jsx` | `StudentFormDialog.jsx` |
| Files (hooks) | `camelCase.js`, `use` prefix | `useStudents.js` |
| Mongoose models | Singular PascalCase | `Student`, `PayrollRecord` |
| Collections | Plural lowercase (Mongoose default) | `students`, `payrollrecords` |
| REST routes | Plural kebab/lowercase nouns | `/students`, `/payroll-transactions` |
| Enums | SCREAMING_SNAKE_CASE values, defined once in `shared/constants/enums.js` | `SCHEDULED`, `PARTIALLY_PAID` |
| Env vars | SCREAMING_SNAKE_CASE | `JWT_ACCESS_SECRET` |
| Booleans | `is`/`has`/`can` prefix | `isActive`, `hasPaid` |

## File Size & Responsibility

- No React page component exceeds ~150 lines; anything larger is a signal to extract a sub-component or hook (directly reacting to the legacy's 300-460 line pages).
- No service function does more than one clearly named thing; if a function needs an "and" in its description, split it.
- Controllers: parse request → call one service method → shape response. No conditionals beyond simple presence checks.

## Error Handling

- Services throw typed `AppError` subclasses; they never return `{ error: ... }` objects or `null` to signal failure — throw, and let the centralized error middleware translate it to an HTTP response.
- Every `async` route handler wrapped in `asyncHandler` (a thin try/catch-to-`next()` wrapper) so errors always reach the error middleware; no route handler contains a bare `try/catch` that swallows an error into a generic 500.
- Frontend: every TanStack Query hook consumer handles `isError` explicitly via the shared `<ErrorState>` — no silent `console.error`-and-nothing pattern (directly fixing the legacy pattern of `catch (err) { console.error(err); }` with no user-facing feedback).

## Comments & Self-Documentation

- Code should read clearly enough that comments explain **why**, not **what** — e.g., a comment on the transport-deduction line explains the business rule ("flat deduction per completed lesson when teacher uses institute vehicle"), not "loop over lessons."
- Every non-obvious business rule ported from the legacy system gets a comment citing the rule explicitly, since the origin (a specific institute's policy) isn't derivable from the code alone.

## Imports & Dependencies

- No circular imports between modules (`students` must never import from `teachers` and vice versa directly — shared needs go through `shared/`).
- No default exports for services/repositories (named exports only) — makes refactors and grep-based navigation predictable.

## Git & Commits

- Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`), scoped to the module where practical (`feat(lessons): add overlap-based conflict detection`).
- No direct commits to `main`; PRs required, CI must pass (lint + unit + integration) before merge.

## Linting

- ESLint with a strict ruleset: no unused vars, no `any`/implicit-any equivalents, no floating promises, exhaustive-deps for hooks.
- Prettier for formatting, run as a pre-commit hook — no formatting debates in code review.

## Validation Discipline

- Every enum field is validated via `.enum([...])` in Zod and the schema's own `enum:` constraint in Mongoose — both must reference the same `shared/constants/enums.js` values, never a hand-typed string literal (this is the concrete mechanism that prevents a repeat of the legacy `PARTIALLY_PAID` validator/schema mismatch).
