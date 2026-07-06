import PayrollRecord from './payrollRecord.model.js';
import PayrollTransaction from './payrollTransaction.model.js';
import { CompensationType } from '../../shared/constants/enums.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import * as auditLogger from '../../shared/services/auditLogger.service.js';
import {
  multiplyFils,
  subtractFils,
  toFils,
} from '../../shared/utils/money.js';
import { withTransaction } from '../../shared/utils/withTransaction.js';
import Lesson from '../lessons/lesson.model.js';
import Teacher from '../teachers/teacher.model.js';

/**
 * Recalculate payroll for a teacher for a specific month/year
 */
export const recalculateForTeacher = async (teacherId, month, year, userId) => {
  return withTransaction(async (session) => {
    // 1. Get Teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new NotFoundError('المعلم غير موجود');
    }

    // Enforce reconciliation: reject Payroll for HOURLY teachers
    if (teacher.compensationType === CompensationType.HOURLY) {
      throw new ValidationError(
        'لا يمكن احتساب كشف رواتب آلي لمعلم بنظام الساعة. يرجى استخدام وحدة رواتب الساعات أو تغيير نظام التعويض في ملف المعلم.'
      );
    }

    // 2. Fetch all COMPLETED lessons for the teacher in that month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const lessons = await Lesson.find({
      teacherId,
      status: 'COMPLETED',
      lessonDate: { $gte: startDate, $lte: endDate },
    }).session(session);

    // 3. Aggregate totals
    const completedLessons = lessons.length;
    let totalLessonValue = 0;
    let teacherEarnings = 0;
    let instituteRevenue = 0;

    lessons.forEach((l) => {
      totalLessonValue += l.lessonPrice;
      teacherEarnings += l.teacherEarnings;
      instituteRevenue += l.instituteRevenue;
    });

    // 4. Calculate transport deduction (only if teacher uses institute car)
    // Business rule: Flat rate per lesson if using institute car
    const TRANSPORT_RATE = toFils(0.5); // Example constant, could be env-driven
    let transportDeductions = 0;
    if (teacher.usesInstituteCar) {
      transportDeductions = multiplyFils(TRANSPORT_RATE, completedLessons);
    }

    const finalAmount = subtractFils(teacherEarnings, transportDeductions);

    // 5. Upsert PayrollRecord
    const payrollRecord = await PayrollRecord.findOneAndUpdate(
      { teacherId, month, year },
      {
        completedLessons,
        totalLessonValue,
        teacherEarnings,
        instituteRevenue,
        transportDeductions,
        finalAmount,
      },
      { upsert: true, new: true, session }
    );

    // 6. Write Audit Transaction
    await PayrollTransaction.create(
      [
        {
          teacherId,
          userId,
          payrollRecordId: payrollRecord._id,
          action: 'RECALCULATE',
          newValue: payrollRecord.toObject(),
        },
      ],
      { session }
    );

    // Activity Log
    await auditLogger.logActivity({
      userId,
      action: 'RECALCULATE_PAYROLL',
      entityType: 'PayrollRecord',
      entityId: payrollRecord._id,
      details: { month, year, finalAmount: payrollRecord.finalAmount },
    });

    return payrollRecord;
  });
};

/**
 * Get all payroll records
 */
export const getAllPayroll = async (query = {}) => {
  const { teacherId, month, year } = query;
  const filter = {};
  if (teacherId) {
    filter.teacherId = teacherId;
  }
  if (month) {
    filter.month = Number(month);
  }
  if (year) {
    filter.year = Number(year);
  }

  return PayrollRecord.find(filter)
    .populate('teacherId')
    .sort({ year: -1, month: -1 });
};

/**
 * Mark payroll as paid
 */
export const markPaid = async (id, userId) => {
  return withTransaction(async (session) => {
    const record = await PayrollRecord.findById(id);
    if (!record) {
      throw new NotFoundError('سجل الراتب غير موجود');
    }

    record.paid = true;
    record.paidDate = new Date();
    await record.save({ session });

    await PayrollTransaction.create(
      [
        {
          teacherId: record.teacherId,
          userId,
          payrollRecordId: record._id,
          action: 'UPDATE',
          newValue: record.toObject(),
        },
      ],
      { session }
    );

    // Activity Log
    await auditLogger.logActivity({
      userId,
      action: 'MARK_PAYROLL_PAID',
      entityType: 'PayrollRecord',
      entityId: record._id,
      details: { month: record.month, year: record.year },
    });

    return record;
  });
};
