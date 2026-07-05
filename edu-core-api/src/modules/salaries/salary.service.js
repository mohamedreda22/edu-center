import TeacherSalary from './teacherSalary.model.js';
import Teacher from '../teachers/teacher.model.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { CompensationType } from '../../shared/constants/enums.js';

export const createSalary = async (salaryData) => {
  const teacher = await Teacher.findById(salaryData.teacherId);
  if (!teacher) throw new NotFoundError('المعلم غير موجود');

  // Enforce reconciliation: reject Salaries entry for PER_LESSON teachers
  if (teacher.compensationType === CompensationType.PER_LESSON) {
    throw new ValidationError(
      'لا يمكن إضافة سجل راتب يدوي لمعلم بنظام العمولة (حسب الحصة). يرجى تغيير نظام التعويض في ملف المعلم أولاً.'
    );
  }

  return TeacherSalary.create(salaryData);
};

export const getAllSalaries = async (query = {}) => {
  const { teacherId, month, year } = query;
  const filter = {};
  if (teacherId) filter.teacherId = teacherId;
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  return TeacherSalary.find(filter)
    .populate('teacherId')
    .sort({ year: -1, month: -1 });
};

export const updateSalary = async (id, updateData) => {
  const salary = await TeacherSalary.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!salary) throw new NotFoundError('سجل الراتب غير موجود');
  return salary;
};

export const deleteSalary = async (id) => {
  const salary = await TeacherSalary.findByIdAndDelete(id);
  if (!salary) throw new NotFoundError('سجل الراتب غير موجود');
  return salary;
};
