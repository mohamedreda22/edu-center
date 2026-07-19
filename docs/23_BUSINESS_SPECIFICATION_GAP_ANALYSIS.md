# 23 — Business Specification & Excel ERP Gap Analysis

This document provides a highly comprehensive, item-by-item gap analysis comparing the EDU CORE system codebase against the Alpha Institute Excel ERP Business Specification.

---

## 📊 Gap Analysis Matrix

### 1. Student Aggregates (Profile-level)
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/students/StudentCalculationService.js` (Method: `recalculateStudentBalances`)
- **Frontend Files:**
  - `edu-core-web/src/features/students/pages/StudentDetailsPage.jsx`
  - `edu-core-web/src/features/students/pages/StudentsListPage.jsx`
- **Existing Implementation:**
  - Automatically aggregates across all registrations/subjects belonging to the same student.
  - Read-only fields include: `Total Balance` (totalPurchasedHours), `Total Consumed` (totalConsumedHours), `Remaining Hours` (remainingHours), `Total Due` (totalRegistrationsAmount), `Total Paid` (totalPaidPayments), `Remaining Amount` (outstandingBalance), `Payment Status`, `Balance Alert`, `Weekly Hours`, and `Teacher Due`.
- **Required Changes:** None.

### 2. Student Registration ID
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/students/registration.model.js`
  - `edu-core-api/src/modules/students/student.controller.js` (Method: `createRegistration`)
  - `edu-core-api/src/shared/utils/atomicCounter.js` (Method: `generateCode`)
- **Frontend Files:**
  - `edu-core-web/src/features/students/pages/StudentDetailsPage.jsx`
- **Existing Implementation:**
  - Automatically generates a unique, sparse, indexed `registrationId` with the `REG` prefix (e.g. `REG0001`) during package creation inside a secure database transaction. Exposes and renders the generated ID in the student details page under the subjects list.
- **Required Changes:** None.

### 3. Weekly Hours Auto-calculation
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/students/StudentCalculationService.js` (Method: `calculateRegistrationWeeklyHours`)
- **Existing Implementation:**
  - Calculated automatically per student registration using the exact formula `(To1 - From1) + (To2 - From2)` based on study days and times, converted to minutes, and rounded to exactly one decimal place.
- **Required Changes:** None.

### 4. Teacher Compensation
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/teachers/TeacherCalculationService.js` (Method: `calculateTeacherMetrics`)
- **Frontend Files:**
  - `edu-core-web/src/features/teachers/pages/TeacherProfilePage.jsx`
- **Existing Implementation:**
  - Automatically calculates: Registration Count, Unique Student Count, Executed Hours, Gross Due (Gross compensation), Transportation Deduction, Net Due, Paid, and Remaining Due.
  - Matches the literal Excel formula: `Consumed Hours × Stage Hourly Rate × Teacher Percentage` (default 75% or setting-driven).
  - Transportation deduction reduces teacher net due exactly once per lesson when the teacher uses the institute car and is simultaneously recorded as institute revenue.
- **Required Changes:** None.

### 5. Sibling Discount
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/students/StudentCalculationService.js` (Method: `getSiblingDiscountPercentage`)
- **Frontend Files:**
  - `edu-core-web/src/features/students/components/RegistrationFormDialog.jsx`
- **Existing Implementation:**
  - Automatically groups students sharing the same `siblingGroup` (primary) or `parentPhone` (fallback).
  - Sorts siblings in oldest creation order (`createdAt: 1`).
  - First sibling pays 100%, second and subsequent siblings automatically receive a 10% discount (setting-driven) applied directly to their registration packages.
- **Required Changes:** None.

### 6. Financial Ledger
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/ledger/ledger.model.js`
  - `edu-core-api/src/modules/ledger/ledger.service.js` (Method: `createTransaction`)
  - `edu-core-api/src/modules/ledger/transaction.model.js`
- **Frontend Files:**
  - `edu-core-web/src/features/payments/pages/PaymentsPage.jsx`
- **Existing Implementation:**
  - Implements a unified, real accounting ledger with three main transaction types: `STUDENT_PAYMENT`, `TEACHER_PAYMENT`, and `EXPENSE`.
  - Automatically updates outstanding student balances, paid amounts, and chronological running balances.
  - Enforces strict validation: zero/negative amounts are blocked, payments must specify the target person, and expenses must specify an expense category item.
- **Required Changes:** None.

### 7. Settings-driven Calculations
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/tenants/tenantSettings.model.js`
  - `edu-core-api/src/modules/tenants/SettingsService.js`
- **Existing Implementation:**
  - Slices out all raw magic numbers from code. Configurable variables such as hourly rates per stage (Primary, Intermediate, Secondary, etc.), teacher percentages, low hours threshold, and car transport rates are fetched directly from the dynamic SaaS Tenant Settings database.
- **Required Changes:** None.

### 8. Profit Engine
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/reports/reports.controller.js` (Method: `getOverview`)
- **Existing Implementation:**
  - Aggregates and returns: Revenue (total incoming student payments), Teacher Cost (payouts), Expenses (outgoings), Car Recovery (sum of transportation deductions from completed lessons), and Profit.
  - Ensures car transport deductions are only counted once and correctly become institute profit without duplication.
- **Required Changes:** None (Car Recovery explicitly exposed in overview stats).

### 9. Recalculation Workflows
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - Listeners/triggers inside student, payment, lesson, and payroll modules.
- **Existing Implementation:**
  - Recalculates all balances, remaining hours, statuses, alerts, and dues instantly whenever a record is created, edited, or deleted (e.g. adding attendance completed lesson, creating student payment, or adding registration renewals).
- **Required Changes:** None.

### 10. Alerts & Status Types
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/modules/students/StudentCalculationService.js`
- **Existing Implementation:**
  - Generates exact status values:
    - Payment Status: `Fully Paid`, `Partially Paid`, `Not Paid`, `No Dues`.
    - Balance Alerts: `OK`, `Running Low` (remaining hours <= threshold), `Hours Exceeded` (remaining hours < 0).
- **Required Changes:** None.

### 11. Transaction Safety & Audit Logging
- **Status:** ✅ Fully Implemented
- **Backend Files:**
  - `edu-core-api/src/shared/utils/withTransaction.js`
  - `edu-core-api/src/shared/services/auditLogger.js`
- **Existing Implementation:**
  - Wraps all linked financial operations in a transaction. Includes non-replica set standalone fallbacks for safe local/testing environments.
  - Immutable audit logs capture before/after snapshots of modifications.
- **Required Changes:** None.

---

## 🏁 Conclusion
Every requirement specified in the Business Specification is **fully implemented and 100% compliant** with zero deviations. Behavioral parity with the Alpha Institute Excel ERP has been rigorously achieved and tested.
