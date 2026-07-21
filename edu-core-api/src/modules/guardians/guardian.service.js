import Guardian from './guardian.model.js';
import { AppError } from '../../shared/errors/AppError.js';
import Student from '../students/student.model.js';

export const GuardianService = {
  /**
   * Create a new guardian
   */
  createGuardian: async (data, tenantId = null) => {
    const exists = await Guardian.findOne({ phone: data.phone });
    if (exists) {
      throw new AppError('رقم هاتف ولي الأمر هذا مسجل مسبقاً', 400);
    }
    return Guardian.create({ ...data, tenantId });
  },

  /**
   * Get all guardians
   */
  getGuardians: async (filter = {}) => {
    return Guardian.find(filter).populate('students').sort({ lastName: 1, firstName: 1 });
  },

  /**
   * Get guardian by ID
   */
  getGuardianById: async (id) => {
    const guardian = await Guardian.findById(id).populate('students');
    if (!guardian) {
      throw new AppError('ولي الأمر غير موجود', 404);
    }
    return guardian;
  },

  /**
   * Update guardian details
   */
  updateGuardian: async (id, data) => {
    const guardian = await Guardian.findById(id);
    if (!guardian) {
      throw new AppError('ولي الأمر غير موجود', 404);
    }

    if (data.phone && data.phone !== guardian.phone) {
      const exists = await Guardian.findOne({ phone: data.phone, _id: { $ne: id } });
      if (exists) {
        throw new AppError('رقم الهاتف مسجل لولي أمر آخر بالفعل', 400);
      }
    }

    return Guardian.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('students');
  },

  /**
   * Delete guardian
   */
  deleteGuardian: async (id) => {
    const guardian = await Guardian.findById(id);
    if (!guardian) {
      throw new AppError('ولي الأمر غير موجود', 404);
    }

    guardian.isDeleted = true;
    guardian.deletedAt = new Date();
    await guardian.save();
    return guardian;
  },

  /**
   * Link a student to a guardian
   */
  linkStudentToGuardian: async (guardianId, studentId) => {
    const guardian = await Guardian.findById(guardianId);
    if (!guardian) {
      throw new AppError('ولي الأمر غير موجود', 404);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('الطالب غير موجود', 404);
    }

    if (!guardian.students.includes(studentId)) {
      guardian.students.push(studentId);
      await guardian.save();
    }

    return guardian;
  },

  /**
   * Automated synchronization hook:
   * Called when a student is created or updated, ensuring matching Guardian exists & is linked.
   */
  syncStudentWithGuardian: async (student) => {
    const tenantId = student.tenantId || null;
    const parentPhone = student.parentPhone;

    if (!parentPhone) return;

    // Find if guardian exists with this phone
    let guardian = await Guardian.findOne({ phone: parentPhone });

    if (!guardian) {
      // Split parent name into first and last name safely
      const nameParts = student.parentName ? student.parentName.trim().split(/\s+/) : ['ولي', 'أمر'];
      const firstName = nameParts[0] || 'ولي';
      const lastName = nameParts.slice(1).join(' ') || 'أمر';

      guardian = await Guardian.create({
        firstName,
        lastName,
        phone: parentPhone,
        whatsapp: student.whatsapp || parentPhone,
        tenantId,
        students: [student._id],
      });
    } else {
      if (!guardian.students.includes(student._id)) {
        guardian.students.push(student._id);
        await guardian.save();
      }
    }

    return guardian;
  },
};

export default GuardianService;
