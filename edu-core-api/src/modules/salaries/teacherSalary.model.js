import mongoose from 'mongoose';

const teacherSalarySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    lessonsCount: {
      type: Number,
      default: 0,
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    transportationAllowance: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    totalSalary: {
      type: Number,
      required: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

teacherSalarySchema.index(
  { teacherId: 1, month: 1, year: 1 },
  { unique: true }
);

const TeacherSalary = mongoose.model('TeacherSalary', teacherSalarySchema);

export default TeacherSalary;
