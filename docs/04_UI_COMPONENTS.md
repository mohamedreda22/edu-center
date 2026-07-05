# 04 — UI Component Extraction & Design System

The legacy `components/ui/` folder is effectively empty — shadcn/ui was declared as a dependency but never actually adopted; every dashboard page hand-rolls its own markup for tables, modals, badges, etc. inline. This document extracts the **patterns actually used** across the 8 dashboard pages so Edu-Core can build them once, properly, as a real shared design system.

## 1. Inventory of Patterns Found in Legacy Pages

| Pattern | Where observed | Notes |
|---|---|---|
| Data table with pagination | students, teachers, payments | Server-side pagination params (`page`, `limit`) already exist in the API — reuse the contract |
| Search + filter bar | students (multi-field search), teachers, lessons/schedule | Legacy does per-field `contains` search; Edu-Core replaces with a maintained text index (see `03_DATABASE_DESIGN.md`) |
| Status badges | students (ACTIVE/INACTIVE/WITHDRAWN), lessons (SCHEDULED/COMPLETED/CANCELLED/NO_SHOW), payments (PENDING/PAID/OVERDUE) | Needs a single `<StatusBadge status={} domain={} />` mapping colors per domain |
| Create/Edit modal forms | every module | Currently duplicated per page; becomes one `<FormDialog>` + React Hook Form + Zod resolver, reused per feature |
| Inline editable notes | attendance page | Debounced textarea pattern |
| Conflict/validation toast errors | lessons (409 conflict), all forms | Needs a single toast/notification system |
| Stat cards (KPI tiles) | dashboard overview | 4-6 tiles: totals, revenue, active counts |
| Calendar/day-based schedule view | schedule page | Custom-built; a strong candidate for a dedicated `<WeekScheduleGrid>` shared component |
| Financial summary widgets | payroll, salaries, reports | Numbers + small breakdown tables |
| Loading / empty / error states | inconsistent — some pages show nothing while loading | Standardized across Edu-Core |

## 2. Design System Component List (shadcn/ui primitives + Edu-Core compositions)

**Primitives (from shadcn/ui, themed for RTL + dark mode):**
Button, Input, Textarea, Select, Checkbox, Switch, Badge, Card, Dialog, Drawer, Tabs, Tooltip, Popover, Avatar, Separator, Skeleton (loading), Toast/Sonner.

**Edu-Core compositions (built on top, one per concern, each in `shared/components/`):**

| Component | Purpose | Replaces (legacy) |
|---|---|---|
| `DataTable` | Sortable, paginated table with column config, row actions | Hand-rolled tables in students/teachers/payments pages |
| `SearchFilterBar` | Debounced search input + filter dropdowns, syncs to URL query params | Inline filter state per page |
| `StatusBadge` | Color-coded badge per domain enum (student status, lesson status, payment status) | Inline conditional `className` strings |
| `FormDialog` | Dialog wrapping a React Hook Form instance, standard footer (Cancel/Save), loading state on submit | Per-page modal + form duplication |
| `ConfirmDialog` | Generic "are you sure?" for destructive actions (delete, cancel lesson) | Missing entirely in legacy (no confirm before actions found) |
| `StatCard` | KPI tile: label, value, delta/icon | Dashboard overview inline divs |
| `WeekScheduleGrid` | Day/time grid for booking and viewing lessons, conflict-aware | Custom schedule page markup |
| `EmptyState` | Icon + message + optional CTA for zero-result lists | Missing in legacy (blank tables on no data) |
| `ErrorState` | Retry-capable error panel for failed queries | Missing (legacy just `console.error`s and shows nothing) |
| `PageHeader` | Title + breadcrumb + primary action button, consistent across all feature pages | Ad-hoc per page |
| `Sidebar` / `Navbar` | App shell navigation, RTL-aware, role-based menu items | `dashboard/layout.tsx` (thin, to be rebuilt properly) |
| `MoneyDisplay` | Consistent currency formatting (locale-aware, Arabic numerals option) | Raw `.toFixed(2)` scattered across pages |
| `NotesEditor` | Debounced textarea with save indicator | Attendance page's inline notes pattern |

## 3. RTL / Arabic / Accessibility Requirements (derived from legacy content, not assumed)

- All legacy validation messages and several enum values are Arabic — Edu-Core ships **Arabic as the primary locale**, English as secondary, with `dir="rtl"` driven by a locale context (not hardcoded per component).
- Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`) used throughout instead of `ml-`/`mr-` so RTL doesn't require component-level forks.
- Every interactive primitive from shadcn/ui gets keyboard focus states verified (legacy has none evaluated).
- Dark mode: CSS variable-based theme tokens from day one (`--background`, `--foreground`, etc.), since the legacy app has no dark mode and retrofitting it later is far more expensive than designing for it now.

## 4. Loading / Empty / Error State Convention

Every list-fetching feature (students, teachers, lessons, payments, payroll, salaries, reports) uses the same three-state contract from TanStack Query:

```
isLoading  → <Skeleton> rows matching the table shape
isError    → <ErrorState message={error.message} onRetry={refetch} />
data.length === 0 → <EmptyState message="..." action={<Button>Add...</Button>} />
```

This single convention eliminates the inconsistency found across legacy pages (some show nothing while loading, some silently fail).
