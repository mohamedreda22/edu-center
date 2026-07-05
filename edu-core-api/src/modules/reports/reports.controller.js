import Lesson from '../lessons/lesson.model.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { UserRole } from '../../shared/constants/enums.js';

/**
 * @desc    Get dashboard overview stats
 * @route   GET /api/v1/reports/overview
 * @access  Private (Admin, Accountant, Receptionist)
 */
export const getOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // 1. Basic counts (real-time)
  const [totalStudents, totalTeachers, activeLessons] = await Promise.all([
    import('../students/student.model.js').then((m) =>
      m.default.countDocuments({ status: 'ACTIVE' })
    ),
    import('../teachers/teacher.model.js').then((m) =>
      m.default.countDocuments({ isActive: true })
    ),
    Lesson.countDocuments({ status: 'SCHEDULED' }),
  ]);

  // 2. Revenue aggregation (current month)
  const revenueData = await Lesson.aggregate([
    {
      $match: {
        lessonDate: { $gte: startOfMonth, $lte: endOfMonth },
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$lessonPrice' },
        instituteShare: { $sum: '$instituteRevenue' },
        teacherShare: { $sum: '$teacherEarnings' },
      },
    },
  ]);

  const stats = {
    totalStudents,
    activeLessons,
  };

  // Role-based visibility
  if (
    req.user.role === UserRole.ADMIN ||
    req.user.role === UserRole.ACCOUNTANT
  ) {
    stats.totalTeachers = totalTeachers;
    stats.monthlyRevenue = revenueData[0]?.totalRevenue || 0;
    stats.instituteShare = revenueData[0]?.instituteShare || 0;
    stats.revenueTrend = 'up'; // Mock trend for now
    stats.revenueTrendValue = '+15% من الشهر الماضي';
  }

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get report by teacher
 * @route   GET /api/v1/reports/by-teacher
 */
export const getByTeacherReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const report = await Lesson.aggregate([
    {
      $match: {
        lessonDate: { $gte: start, $lte: end },
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: '$teacherId',
        totalLessons: { $sum: 1 },
        grossValue: { $sum: '$lessonPrice' },
        teacherShare: { $sum: '$teacherEarnings' },
        instituteShare: { $sum: '$instituteRevenue' },
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    { $unwind: '$teacher' },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher.userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        teacherName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        totalLessons: 1,
        grossValue: 1,
        teacherShare: 1,
        instituteShare: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: report,
  });
});

/**
 * @desc    Get report by subject
 */
export const getBySubjectReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const report = await Lesson.aggregate([
    {
      $match: {
        lessonDate: { $gte: start, $lte: end },
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: '$subject',
        totalLessons: { $sum: 1 },
        grossValue: { $sum: '$lessonPrice' },
      },
    },
    { $sort: { grossValue: -1 } }
  ]);

  res.status(200).json({ success: true, data: report });
});

/**
 * @desc    Get report by level (grade)
 */
export const getByLevelReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const report = await Lesson.aggregate([
    {
      $match: {
        lessonDate: { $gte: start, $lte: end },
        status: 'COMPLETED',
      },
    },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $group: {
        _id: '$student.grade',
        totalLessons: { $sum: 1 },
        grossValue: { $sum: '$lessonPrice' },
      },
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({ success: true, data: report });
});

/**
 * @desc    Export report as CSV
 */
export const exportCSV = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  let csv = 'Teacher,Lessons,Gross,Teacher Share,Institute Share\n';

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const report = await Lesson.aggregate([
    {
      $match: {
        lessonDate: { $gte: start, $lte: end },
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: '$teacherId',
        totalLessons: { $sum: 1 },
        grossValue: { $sum: '$lessonPrice' },
        teacherShare: { $sum: '$teacherEarnings' },
        instituteShare: { $sum: '$instituteRevenue' },
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    { $unwind: '$teacher' },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher.userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ]);

  report.forEach(row => {
    const name = `${row.user.firstName} ${row.user.lastName}`;
    csv += `${name},${row.totalLessons},${row.grossValue},${row.teacherShare},${row.instituteShare}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=report-${month}-${year}.csv`);
  res.status(200).send(csv);
});

/**
 * @desc    Export report as PDF (Mock)
 */
export const exportPDF = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PDF export triggered. In a production environment, this would generate a PDF stream using a library like PDFKit or Puppeteer.'
  });
});
