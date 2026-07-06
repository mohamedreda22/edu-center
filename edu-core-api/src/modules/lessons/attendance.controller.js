import Attendance from './attendance.model.js';
import Lesson from './lesson.model.js';
import { updateLessonStatus } from './lesson.service.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

/**
 * @desc    Mark attendance for a lesson
 * @route   POST /api/v1/lessons/:lessonId/attendance
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { status, notes, absenceReason, checkInTime } = req.body;
  const recordedBy = req.user.id;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new NotFoundError('الحصة غير موجودة');
  }

  const attendance = await Attendance.findOneAndUpdate(
    { lessonId },
    {
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      status,
      notes,
      absenceReason,
      checkInTime,
      recordedBy,
    },
    { upsert: true, new: true, runValidators: true }
  );

  // Sync lesson status
  const lessonStatus =
    status === 'PRESENT' || status === 'LATE' ? 'COMPLETED' : 'CANCELLED';
  await updateLessonStatus(lessonId, lessonStatus, notes, recordedBy);

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

/**
 * @desc    Get attendance record for a lesson
 * @route   GET /api/v1/lessons/:lessonId/attendance
 */
export const getLessonAttendance = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const attendance = await Attendance.findOne({ lessonId })
    .populate('studentId', 'parentName studentCode')
    .populate('recordedBy', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

/**
 * @desc    Get student attendance history
 * @route   GET /api/v1/students/:studentId/attendance
 */
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const attendance = await Attendance.find({ studentId })
    .populate('lessonId', 'title lessonDate startTime')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: attendance,
  });
});
