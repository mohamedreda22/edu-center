import Attendance from './attendance.model.js';
import Lesson from './lesson.model.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';

export const markAttendance = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { studentId, status, notes } = req.body;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new NotFoundError('الحصة غير موجودة');

  const attendance = await Attendance.findOneAndUpdate(
    { lessonId, studentId },
    { status, notes, markedAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: attendance });
});

export const getLessonAttendance = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const attendance = await Attendance.find({ lessonId }).populate('studentId', 'firstName lastName');
  res.status(200).json({ success: true, data: attendance });
});
