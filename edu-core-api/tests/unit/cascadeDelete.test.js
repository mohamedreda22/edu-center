process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';

import Lesson from '../../src/modules/lessons/lesson.model.js';
import Payment from '../../src/modules/payments/payment.model.js';
import PayrollRecord from '../../src/modules/payroll/payrollRecord.model.js';
import StudentRegistration from '../../src/modules/students/registration.model.js';
import Student from '../../src/modules/students/student.model.js';
import Teacher from '../../src/modules/teachers/teacher.model.js';
import { runWithTenant } from '../../src/shared/utils/tenantContext.js';
import { connectDB, closeDB, clearDB } from '../integration/setup.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Cascade Soft Delete Engine Suite', () => {
  it('should automatically cascade soft deletion from Student to child registrations, payments, and lessons', async () => {
    const tenantId = new mongoose.Types.ObjectId();

    await runWithTenant(tenantId, null, async () => {
      // 1. Create student
      const student = await Student.create({
        studentCode: 'STD_CASC001',
        parentName: 'Parent Cascade',
        parentPhone: '96511111',
        address: 'Addr',
        grade: 'ابتدائي',
      });

      // 2. Create child registration
      const reg = await StudentRegistration.create({
        studentId: student._id,
        subject: 'Math',
        purchasedHours: 10,
        consumedHours: 0,
        pricePerHour: 10000,
        totalAmount: 100000,
        registrationDate: new Date(),
        status: 'ACTIVE',
      });

      // 3. Create child payment
      const payment = await Payment.create({
        studentId: student._id,
        amount: 100000,
        status: 'PENDING',
        dueDate: new Date(),
      });

      // 4. Create child lesson
      const lesson = await Lesson.create({
        studentId: student._id,
        teacherId: new mongoose.Types.ObjectId(),
        title: 'Math Lesson 1',
        dayOfWeek: 'Monday',
        lessonPrice: 15000,
        lessonDate: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        subject: 'Math',
        status: 'SCHEDULED',
      });

      // Assert children are initially active
      expect(reg.deletedAt).toBeNull();
      expect(payment.deletedAt).toBeNull();
      expect(lesson.deletedAt).toBeNull();

      // 5. Soft-delete the parent student document
      student.deletedAt = new Date();
      await student.save();

      // Verify cascading on child documents using setOptions({ withDeleted: true })
      const deletedReg = await StudentRegistration.findById(reg._id).setOptions(
        { withDeleted: true }
      );
      const deletedPayment = await Payment.findById(payment._id).setOptions({
        withDeleted: true,
      });
      const deletedLesson = await Lesson.findById(lesson._id).setOptions({
        withDeleted: true,
      });

      expect(deletedReg.deletedAt).not.toBeNull();
      expect(deletedReg.isDeleted).toBe(true);

      expect(deletedPayment.deletedAt).not.toBeNull();
      expect(deletedPayment.isDeleted).toBe(true);

      expect(deletedLesson.deletedAt).not.toBeNull();
      expect(deletedLesson.isDeleted).toBe(true);
    });
  });

  it('should automatically cascade soft deletion from Teacher to child lessons and payroll records', async () => {
    const tenantId = new mongoose.Types.ObjectId();

    await runWithTenant(tenantId, null, async () => {
      // 1. Create Teacher
      const teacher = await Teacher.create({
        userId: new mongoose.Types.ObjectId(),
        employeeCode: 'TEA_CASC001',
        subjects: ['Math'],
        compensationType: 'HOURLY',
        hourlyRate: 10000,
        isActive: true,
      });

      // 2. Create child lesson
      const lesson = await Lesson.create({
        studentId: new mongoose.Types.ObjectId(),
        teacherId: teacher._id,
        title: 'Advanced Science',
        dayOfWeek: 'Tuesday',
        lessonPrice: 12000,
        lessonDate: new Date(),
        startTime: '14:00',
        endTime: '15:00',
        subject: 'Science',
        status: 'SCHEDULED',
      });

      // 3. Create child payroll record
      const payroll = await PayrollRecord.create({
        teacherId: teacher._id,
        month: 10,
        year: 2026,
        completedLessons: 4,
        totalLessonValue: 40000,
        teacherEarnings: 30000,
        instituteRevenue: 10000,
        finalAmount: 30000,
        status: 'CALCULATED',
      });

      // 4. Soft-delete parent teacher
      teacher.deletedAt = new Date();
      await teacher.save();

      // Verify cascading
      const deletedLesson = await Lesson.findById(lesson._id).setOptions({
        withDeleted: true,
      });
      const deletedPayroll = await PayrollRecord.findById(
        payroll._id
      ).setOptions({ withDeleted: true });

      expect(deletedLesson.deletedAt).not.toBeNull();
      expect(deletedLesson.isDeleted).toBe(true);

      expect(deletedPayroll.deletedAt).not.toBeNull();
      expect(deletedPayroll.isDeleted).toBe(true);
    });
  });

  it('should cascade soft deletion via query-level updates (updateOne / updateMany)', async () => {
    const tenantId = new mongoose.Types.ObjectId();

    await runWithTenant(tenantId, null, async () => {
      // Create student
      const student = await Student.create({
        studentCode: 'STD_CASC002',
        parentName: 'Parent Query Cascade',
        parentPhone: '96522222',
        address: 'Addr',
        grade: 'متوسط',
      });

      // Create child registration
      const reg = await StudentRegistration.create({
        studentId: student._id,
        subject: 'English',
        purchasedHours: 20,
        consumedHours: 0,
        pricePerHour: 8000,
        totalAmount: 160000,
        registrationDate: new Date(),
        status: 'ACTIVE',
      });

      // Soft delete student via query update
      const deleteTime = new Date();
      await Student.updateOne(
        { _id: student._id },
        { $set: { deletedAt: deleteTime, isDeleted: true } }
      );

      // Verify cascading
      const deletedReg = await StudentRegistration.findById(reg._id).setOptions(
        { withDeleted: true }
      );
      expect(deletedReg.deletedAt).not.toBeNull();
      expect(deletedReg.isDeleted).toBe(true);
    });
  });
});
