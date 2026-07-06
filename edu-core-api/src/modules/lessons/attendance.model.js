import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'يجب تحديد الحصة'],
    },
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
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    absenceReason: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
attendanceSchema.index({ lessonId: 1 });
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ teacherId: 1 });
attendanceSchema.index({ createdAt: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
