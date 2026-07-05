import Student from './student.model.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { generateCode } from '../../shared/utils/atomicCounter.js';

/**
 * Create a new student
 */
export const createStudent = async (studentData) => {
  const studentCode = await generateCode('studentCode', 'STD');
  const student = await Student.create({
    ...studentData,
    studentCode,
  });
  return student;
};

/**
 * Get all students with pagination and filtering
 */
export const getAllStudents = async (query = {}) => {
  const { page = 1, limit = 10, search, status, grade } = query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (grade) {
    filter.grade = grade;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Student.countDocuments(filter),
  ]);

  return {
    students,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get student by ID
 */
export const getStudentById = async (id) => {
  const student = await Student.findById(id).populate(
    'userId',
    'firstName lastName email'
  );
  if (!student) {
    throw new NotFoundError('الطالب غير موجود');
  }
  return student;
};

/**
 * Update student
 */
export const updateStudent = async (id, updateData) => {
  const student = await Student.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!student) {
    throw new NotFoundError('الطالب غير موجود');
  }
  return student;
};

/**
 * Soft delete student
 */
export const deleteStudent = async (id) => {
  const student = await Student.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    status: 'WITHDRAWN',
  });
  if (!student) {
    throw new NotFoundError('الطالب غير موجود');
  }
  return student;
};
