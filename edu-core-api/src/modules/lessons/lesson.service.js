import Lesson from './lesson.model.js';
import Teacher from '../teachers/teacher.model.js';
import PayrollTransaction from '../payroll/payrollTransaction.model.js';
import { calculateCommission } from '../../shared/services/commissionCalculator.js';
import { withTransaction } from '../../shared/utils/withTransaction.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { notificationService } from '../../shared/services/notification.service.js';

/**
 * Check for scheduling conflicts
 * Returns true if conflict exists
 */
const checkConflict = async (
  entityId,
  entityType,
  lessonDate,
  startTime,
  endTime,
  excludeLessonId = null
) => {
  const query = {
    lessonDate: new Date(lessonDate),
    _id: { $ne: excludeLessonId },
    status: { $ne: 'CANCELLED' },
    $or: [
      // Starts during another lesson
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // Ends during another lesson
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // Wraps around another lesson
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };

  if (entityType === 'teacher') query.teacherId = entityId;
  else query.studentId = entityId;

  const conflict = await Lesson.findOne(query);
  return conflict;
};

/**
 * Create a new lesson
 */
export const createLesson = async (lessonData, userId) => {
  return withTransaction(async (session) => {
    const {
      teacherId,
      studentId,
      lessonDate,
      startTime,
      endTime,
      lessonPrice,
    } = lessonData;

    // 1. Check teacher conflict
    const teacherConflict = await checkConflict(
      teacherId,
      'teacher',
      lessonDate,
      startTime,
      endTime
    );
    if (teacherConflict) {
      throw new ConflictError('المعلم لديه حصة أخرى في هذا الوقت');
    }

    // 2. Check student conflict
    const studentConflict = await checkConflict(
      studentId,
      'student',
      lessonDate,
      startTime,
      endTime
    );
    if (studentConflict) {
      throw new ConflictError('الطالب لديه حصة أخرى في هذا الوقت');
    }

    // 3. Get teacher for commission split
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) throw new NotFoundError('المعلم غير موجود');

    const { teacherEarnings, instituteRevenue } = calculateCommission({
      lessonPrice,
      teacherPercentage: teacher.teacherPercentage,
    });

    // 4. Create lesson
    const [lesson] = await Lesson.create(
      [
        {
          ...lessonData,
          teacherPercentage: teacher.teacherPercentage,
          institutePercentage: teacher.institutePercentage,
          teacherEarnings,
          instituteRevenue,
        },
      ],
      { session }
    );

    // 5. Write audit transaction
    await PayrollTransaction.create(
      [
        {
          lessonId: lesson._id,
          teacherId,
          userId,
          lessonPrice,
          teacherPercentage: teacher.teacherPercentage,
          institutePercentage: teacher.institutePercentage,
          teacherEarnings,
          instituteRevenue,
          action: 'CREATE',
          newValue: lesson.toObject(),
        },
      ],
      { session }
    );

    // 6. Hook point: Notification
    notificationService.notify({
      userId: teacher.userId,
      title: 'حصة جديدة',
      message: `تم حجز حصة جديدة لك في تاريخ ${lesson.lessonDate.toLocaleDateString('ar-KW')} الساعة ${lesson.startTime}`,
      type: 'LESSON_BOOKED',
    });

    return lesson;
  });
};

/**
 * Get all lessons
 */
export const getAllLessons = async (query = {}) => {
  const { teacherId, studentId, date, status } = query;
  const filter = {};
  if (teacherId) filter.teacherId = teacherId;
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    filter.lessonDate = { $gte: startOfDay, $lte: endOfDay };
  }

  return Lesson.find(filter)
    .populate('teacherId')
    .populate('studentId')
    .sort({ lessonDate: 1, startTime: 1 });
};

/**
 * Update lesson status (Attendance)
 */
export const updateLessonStatus = async (id, status, notes, userId) => {
  return withTransaction(async (session) => {
    const lesson = await Lesson.findById(id);
    if (!lesson) throw new NotFoundError('الحصة غير موجودة');

    const previousValue = lesson.toObject();
    lesson.status = status;
    if (notes) lesson.notes = notes;
    await lesson.save({ session });

    await PayrollTransaction.create(
      [
        {
          lessonId: lesson._id,
          teacherId: lesson.teacherId,
          userId,
          action: 'UPDATE',
          previousValue,
          newValue: lesson.toObject(),
        },
      ],
      { session }
    );

    return lesson;
  });
};
