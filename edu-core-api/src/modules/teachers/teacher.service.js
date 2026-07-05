import Teacher from './teacher.model.js';
import { generateCode } from '../../shared/utils/atomicCounter.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';

/**
 * Create a new teacher
 */
export const createTeacher = async (teacherData) => {
  const employeeCode = await generateCode('employeeCode', 'TCH');
  const teacher = await Teacher.create({
    ...teacherData,
    employeeCode,
  });
  return teacher;
};

/**
 * Get all teachers with pagination and filtering
 */
export const getAllTeachers = async (query = {}) => {
  const { page = 1, limit = 10, search, isActive, department } = query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (department) filter.department = department;

  if (search) {
    // Basic search for now, could be improved with text index
    filter.$or = [
      { employeeCode: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ];
  }

  const [teachers, total] = await Promise.all([
    Teacher.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Teacher.countDocuments(filter),
  ]);

  return {
    teachers,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get teacher by ID
 */
export const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id).populate(
    'userId',
    'firstName lastName email phone'
  );
  if (!teacher) {
    throw new NotFoundError('المعلم غير موجود');
  }
  return teacher;
};

/**
 * Update teacher
 */
export const updateTeacher = async (id, updateData) => {
  const teacher = await Teacher.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!teacher) {
    throw new NotFoundError('المعلم غير موجود');
  }
  return teacher;
};

/**
 * Soft delete teacher
 */
export const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    isActive: false,
  });
  if (!teacher) {
    throw new NotFoundError('المعلم غير موجود');
  }
  return teacher;
};
