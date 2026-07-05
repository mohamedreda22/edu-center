import mongoose from 'mongoose';
import { LessonStatus } from '../../shared/constants/enums.js';

const lessonSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'يجب تحديد الطالب'],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'يجب تحديد المعلم'],
    },
    title: {
      type: String,
      required: [true, 'عنوان الحصة مطلوب'],
    },
    description: String,
    dayOfWeek: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    durationHours: {
      type: Number,
      default: 1,
      min: 0.5,
    },
    lessonDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LessonStatus),
      default: LessonStatus.SCHEDULED,
    },
    notes: String,
    lessonPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    educationalLevel: String,
    // Financial snapshot
    teacherPercentage: Number,
    institutePercentage: Number,
    teacherEarnings: Number,
    instituteRevenue: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes for conflict detection and reports
lessonSchema.index({ teacherId: 1, lessonDate: 1 });
lessonSchema.index({ studentId: 1, lessonDate: 1 });
lessonSchema.index({ status: 1 });
lessonSchema.index({ lessonDate: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
