# 03 — Database Design (MongoDB)

## 0. Infrastructure Prerequisite

MongoDB transactions (used throughout — see below) require a **replica set**, including for a single self-hosted node. Deployment must run:

```js
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] })
```

before the API connects. This is called out again in `09_DEPLOYMENT.md` — flagging it here because it directly shapes which operations below are safe to implement as true atomic transactions vs. which need compensating-action patterns.

## 1. Design Philosophy: Embed vs. Reference

The legacy domain is genuinely relational (this was the point raised before the MongoDB decision was confirmed). The mapping below **references** by default and only embeds where the sub-data is (a) bounded, (b) always read together with the parent, and (c) never queried independently.

| Relationship | Decision | Reason |
|---|---|---|
| User ↔ Student/Teacher profile | **Reference** (`userId`) | Independent lifecycle (a user's login credentials shouldn't be tied to profile document size/growth) |
| Student → Lessons | **Reference** | Lessons are queried independently (by teacher, by date, by status) far more often than "give me all of a student's lessons embedded" |
| Student → Payments | **Reference** | Same reasoning; payments are queried by status/due-date across students |
| Lesson → Payroll snapshot fields | **Embed** (denormalized fields on Lesson itself) | `teacherPercentage`, `institutePercentage`, `teacherEarnings`, `instituteRevenue` are a point-in-time snapshot, not a relationship — this preserves the legacy system's historically-correct behavior (a teacher's later rate change never rewrites old lessons) |
| PayrollRecord → PayrollTransaction | **Reference** | Transaction log must remain independently queryable/paginated and grows unbounded over time — embedding would blow past MongoDB's 16MB document limit for active teachers |
| Teacher → availability | **Embed as structured sub-document** (fixing the legacy "JSON-as-string" anti-pattern) | Always read with the teacher, small, bounded, no independent queries needed |

## 2. Collections

### `users`
```js
{
  _id, email: { type: String, unique: true, lowercase: true },
  passwordHash: String,           // bcrypt; null only for not-yet-activated accounts
  firstName, lastName: String,
  phone: { type: String, unique: true },
  role: { type: String, enum: ['ADMIN','RECEPTIONIST','TEACHER','ACCOUNTANT'], default: 'RECEPTIONIST' },
  avatarUrl: String,
  isActive: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 },   // bumped on password change / "logout all devices"
  deletedAt: { type: Date, default: null },      // soft delete
  timestamps: true
}
```
Indexes: `{ email: 1 }` unique, `{ phone: 1 }` unique, `{ role: 1 }`.

**Improvement over legacy:** students no longer get a synthetic placeholder `User` unless they actually need portal access. See `16_IMPROVEMENTS.md` — `Student.userId` becomes optional/nullable, decoupling "is a student record" from "has a login."

### `refreshtokens` (new — did not exist in legacy)
```js
{
  _id, userId: ObjectId (ref: users), tokenHash: String,
  family: String,           // rotation family id, for reuse-detection
  userAgent, ipAddress: String,
  expiresAt: Date, revokedAt: Date,
  timestamps: true
}
```
Indexes: `{ userId: 1 }`, `{ expiresAt: 1 }` (TTL index — auto-expires), `{ tokenHash: 1 }` unique.
Enables true multi-device session tracking and "logout everywhere" (delete all by `userId`), which the legacy system never had.

### `students`
```js
{
  _id, userId: ObjectId (ref: users, nullable),
  studentCode: { type: String, unique: true },   // see ID-generation fix below
  parentName, parentPhone, whatsapp: String,
  area, address: String,
  googleMapsUrl: String,
  school: String,
  grade: { type: String, enum: EDUCATIONAL_LEVELS },   // تأسيس / ابتدائي / ثانوي / ...
  subjects: [String],                                    // array, not comma-string (fix)
  preferredTeacherGender: { type: String, enum: ['MALE','FEMALE'] },
  preferredSchedule: String,
  notes: String,
  dateOfBirth: Date,
  enrollmentDate: Date,
  status: { type: String, enum: ['ACTIVE','INACTIVE','WITHDRAWN'], default: 'ACTIVE' },
  monthlyFee: { type: Number, default: 0, min: 0 },
  avatarUrl: String,
  deletedAt: Date,
  timestamps: true
}
```
Indexes: `{ studentCode: 1 }` unique, `{ status: 1 }`, text index on `{ 'searchBlob': 'text' }` (a maintained concatenation of name/phone/parentName/area/school for the search feature — replaces legacy's fragile multi-field `OR` + `contains` scan), `{ grade: 1 }`.

**ID generation fix:** `studentCode` is generated via an atomic `findOneAndUpdate` on a dedicated `counters` collection (`{ _id: 'studentCode', seq: Number }`, `$inc: { seq: 1 }`), not `count()+1`. This eliminates the legacy race condition entirely.

### `teachers`
```js
{
  _id, userId: ObjectId (ref: users),
  employeeCode: { type: String, unique: true },   // same atomic-counter pattern
  whatsapp, civilId: String,
  subjects: [String], gradesTaught: [String],
  gender: { type: String, enum: ['MALE','FEMALE'] },
  nationality: String,
  experienceYears: { type: Number, default: 0 },
  address, googleMapsUrl: String,
  availability: {                          // structured, replacing legacy's raw strings
    days: [{ type: String, enum: WEEKDAYS }],
    slots: [{ start: String, end: String }]   // "HH:mm" validated by regex
  },
  ownsCar: Boolean, transportationAvailable: Boolean, usesInstituteCar: Boolean,
  hourlyRate: { type: Number, default: 0, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
  commissionModel: { type: String, enum: ['SEVENTY_THIRTY','SIXTYFIVE_THIRTYFIVE'], default: 'SEVENTY_THIRTY' },
  teacherPercentage: { type: Number, default: 0.7 },
  institutePercentage: { type: Number, default: 0.3 },
  cvUrl, certificatesUrl: String,
  department: String, hireDate: Date, bio: String, avatarUrl: String,
  isActive: { type: Boolean, default: true },
  deletedAt: Date,
  timestamps: true
}
```
Indexes: `{ employeeCode: 1 }` unique, `{ isActive: 1 }`, `{ 'availability.days': 1 }`.

### `lessons`
```js
{
  _id, studentId: ObjectId (ref: students), teacherId: ObjectId (ref: teachers),
  title: String,                 // subject
  description: String,
  dayOfWeek: String,
  startTime: String, endTime: String,     // "HH:mm"
  durationHours: { type: Number, default: 1, min: 0.5 },
  lessonDate: Date,
  status: { type: String, enum: ['SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'], default: 'SCHEDULED' },
  notes: String,
  lessonPrice: { type: Number, default: 0, min: 0 },
  educationalLevel: String,
  // financial snapshot — embedded intentionally, see decision table above
  teacherPercentage: Number, institutePercentage: Number,
  teacherEarnings: Number, instituteRevenue: Number,
  timestamps: true
}
```
Indexes: `{ teacherId: 1, lessonDate: 1 }`, `{ studentId: 1, lessonDate: 1 }`, `{ status: 1 }`, `{ lessonDate: 1 }` (for the reports date-range queries).

**Conflict detection query** (replacing the legacy's ±24h heuristic, tightened to actual time-overlap): a compound index on `{ teacherId: 1, lessonDate: 1 }` and `{ studentId: 1, lessonDate: 1 }` supports an efficient overlap check comparing `startTime`/`endTime` on same-day documents — see `16_IMPROVEMENTS.md` for why exact overlap detection is a recommended upgrade over the legacy's blanket 24-hour block.

### `payments`
```js
{
  _id, studentId: ObjectId (ref: students), lessonId: ObjectId (ref: lessons, nullable),
  amount: { type: Number, required: true, min: 0 },
  dueDate: Date, paidDate: Date,
  status: { type: String, enum: ['PENDING','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED'], default: 'PENDING' },
  paymentMethod, transactionRef, notes: String,
  timestamps: true
}
```
`PARTIALLY_PAID` is included in the enum this time — fixing the legacy discrepancy between validator and schema (see `01_PROJECT_ANALYSIS.md` §3).
Indexes: `{ studentId: 1 }`, `{ status: 1 }`, `{ dueDate: 1 }`.

### `payrollrecords`
```js
{
  _id, teacherId: ObjectId (ref: teachers), month: Number, year: Number,
  completedLessons: Number, totalLessonValue: Number,
  teacherEarnings: Number, instituteRevenue: Number,
  transportDeductions: Number, finalAmount: Number,
  paid: { type: Boolean, default: false }, paidDate: Date,
  notes: String, timestamps: true
}
```
Index: `{ teacherId: 1, month: 1, year: 1 }` **unique compound** (direct port of the legacy unique constraint).

### `payrolltransactions`
```js
{
  _id, lessonId: ObjectId (ref: lessons), payrollRecordId: ObjectId (ref: payrollrecords, nullable),
  teacherId: ObjectId (ref: teachers), userId: ObjectId (ref: users, nullable),
  lessonPrice, teacherPercentage, institutePercentage,
  teacherEarnings, instituteRevenue, transportDeduction: Number,
  action: { type: String, enum: ['CREATE','UPDATE','RECALCULATE'], default: 'CREATE' },
  previousValue: Object, newValue: Object,
  timestamps: true
}
```
Indexes: `{ lessonId: 1 }`, `{ teacherId: 1 }`, `{ payrollRecordId: 1 }`.

### `teachersalaries`
```js
{
  _id, teacherId: ObjectId (ref: teachers), month: Number, year: Number,
  lessonsCount: Number, hoursWorked: Number, hourlyRate: Number,
  transportationAllowance: Number, bonuses: Number, deductions: Number,
  totalSalary: Number, paid: Boolean, paidDate: Date, notes: String,
  timestamps: true
}
```
Index: `{ teacherId: 1, month: 1, year: 1 }` unique compound.

> **Product decision needed (flagged, not silently resolved):** the legacy system has two parallel compensation models (`payrollrecords` computed from lessons, `teachersalaries` entered manually by hours). Edu-Core preserves both collections for parity, but recommends clarifying with the business which one is authoritative per teacher, or scoping `teachersalaries` to a specific teacher type (e.g. hourly/fixed-salary staff vs. commission-based teachers). See `06_REFACTORING_PLAN.md`.

### `activitylogs`
```js
{
  _id, userId: ObjectId (ref: users), action: String,
  entityType: String, entityId: ObjectId,
  metadata: Object, ipAddress: String, userAgent: String,
  timestamps: true    // createdAt only needed; updatedAt disabled
}
```
Indexes: `{ userId: 1 }`, `{ entityType: 1, entityId: 1 }`, `{ createdAt: -1 }` (recent-activity feed).
Consider a TTL or archival job once volume grows — flagged in `15_RISK_ANALYSIS.md`.

### `counters` (new — supports atomic ID generation)
```js
{ _id: String, seq: Number }
```

## 3. Transactions — where they are mandatory

| Operation | Documents touched atomically |
|---|---|
| Create student (with login) | `users` + `students` |
| Book lesson | `lessons` + `payrolltransactions` (+ conflict check reads) |
| Update lesson status → COMPLETED/CANCELLED | `lessons` + `payrolltransactions` (adjustment entry) |
| Recalculate payroll | `payrollrecords` (upsert) + `payrolltransactions` |
| Record payment | `payments` (+ optional `lessons` status touch if fully linked) |

All implemented via Mongoose sessions (`session.startTransaction()` / `commitTransaction()` / `abortTransaction()`), wrapped in a small `withTransaction(fn)` utility in `shared/utils/` so services never repeat the boilerplate.

## 4. Validation, Enums, Timestamps, Soft Delete — conventions

- Every schema declares `{ timestamps: true }`.
- Enums are defined once in `shared/constants/enums.js` and imported into both Mongoose schemas and Zod validators to guarantee they never drift apart (directly preventing a repeat of the legacy `PARTIALLY_PAID` mismatch).
- Soft delete via `deletedAt: Date | null` on `users`, `students`, `teachers` (financial and audit collections are never soft-deleted — they are immutable history by design). A Mongoose query middleware (`pre('find')`) automatically excludes soft-deleted docs unless a query explicitly opts in with `.withDeleted()`.

## 5. Aggregation Pipelines (Reports module)

The legacy `reports` endpoint pulled full matching lesson documents into Node and reduced them manually in JavaScript. Edu-Core replaces this with native MongoDB aggregation, e.g. "by teacher":

```js
Lesson.aggregate([
  { $match: { lessonDate: { $gte: start, $lt: end }, status: 'COMPLETED' } },
  { $group: {
      _id: '$teacherId',
      totalLessons: { $sum: 1 },
      grossValue: { $sum: '$lessonPrice' },
      teacherShare: { $sum: '$teacherEarnings' },
      instituteShare: { $sum: '$instituteRevenue' },
  }},
  { $lookup: { from: 'teachers', localField: '_id', foreignField: '_id', as: 'teacher' } },
  { $unwind: '$teacher' },
]);
```
This scales far better than the legacy approach as lesson volume grows, and is the pattern for `by_subject`, `by_level`, and the dashboard `overview` aggregation.
