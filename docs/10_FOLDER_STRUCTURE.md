# 10 — Folder Structure

## Backend (`edu-core-api/`)

```
edu-core-api/
  src/
    config/
      env.js               # Zod-validated env loader
      db.js                 # Mongo connection + replica-set check
      constants.js
    shared/
      constants/
        enums.js            # single source of truth for all enums
      errors/
        AppError.js
        ValidationError.js
        AuthError.js
        ForbiddenError.js
        NotFoundError.js
        ConflictError.js
      middlewares/
        authenticate.js
        authorize.js
        validate.js
        errorHandler.js
        rateLimiter.js
        requestLogger.js
      services/
        auditLogger.service.js
        tokenService.js       # sign/verify/rotate access+refresh
        commissionCalculator.js
      utils/
        withTransaction.js
        atomicCounter.js
        pagination.js
        asyncHandler.js
      types/                  # JSDoc typedefs if not using TS
    modules/
      auth/
        auth.controller.js
        auth.service.js
        auth.routes.js
        auth.validation.js
        refreshToken.model.js
      users/
        user.model.js
        user.repository.js
      students/
        student.model.js
        student.repository.js
        student.service.js
        student.controller.js
        student.routes.js
        student.validation.js
      teachers/
        teacher.model.js
        teacher.repository.js
        teacher.service.js
        teacher.controller.js
        teacher.routes.js
        teacher.validation.js
      lessons/
        lesson.model.js
        lesson.repository.js
        lesson.service.js
        lesson.controller.js
        lesson.routes.js
        lesson.validation.js
      payments/
        payment.model.js
        payment.repository.js
        payment.service.js
        payment.controller.js
        payment.routes.js
        payment.validation.js
      payroll/
        payrollRecord.model.js
        payrollTransaction.model.js
        payroll.repository.js
        payroll.service.js
        payroll.controller.js
        payroll.routes.js
      salaries/
        teacherSalary.model.js
        salary.repository.js
        salary.service.js
        salary.controller.js
        salary.routes.js
        salary.validation.js
      reports/
        reports.service.js
        reports.controller.js
        reports.routes.js
      activity-log/
        activityLog.model.js
        activityLog.repository.js
    app.js                    # express app, middleware wiring
    server.js                 # http server bootstrap
  tests/
    unit/
    integration/
  .env.example
  package.json
```

## Frontend (`edu-core-web/`)

```
edu-core-web/
  src/
    app/
      routes.jsx               # React Router route tree, lazy-loaded per feature
      providers.jsx             # QueryClientProvider, ThemeProvider, AuthProvider
      layout/
        AppShell.jsx
        Sidebar.jsx
        Navbar.jsx
    features/
      auth/
        pages/ (LoginPage)
        hooks/ (useLogin, useAuthSession)
        services/ (authApi.js)
        validations/ (loginSchema.js)
      students/
        pages/ (StudentsListPage, StudentDetailPage)
        components/ (StudentFormDialog, StudentTable)
        hooks/ (useStudents, useCreateStudent, useUpdateStudent)
        services/ (studentsApi.js)
        validations/ (studentSchema.js)
        types/
      teachers/            # same shape as students
      scheduling/           # lessons + attendance
        pages/ (SchedulePage, AttendancePage)
        components/ (WeekScheduleGrid, LessonFormDialog)
        hooks/
        services/
        validations/
      payments/
      payroll/
      salaries/
      reports/
      dashboard/
    shared/
      components/            # design system, see 04_UI_COMPONENTS.md
        DataTable/
        FormDialog/
        StatusBadge/
        SearchFilterBar/
        StatCard/
        EmptyState/
        ErrorState/
      hooks/
        useDebouncedValue.js
        usePagination.js
      services/
        apiClient.js          # axios instance + interceptors
        queryClient.js
      utils/
        money.js
        date.js
      constants/
        enums.js              # mirrors backend enums.js by convention
      types/
    styles/
      globals.css
  index.html
  vite.config.js
  .env.example
  package.json
```
