/**
 * Backward compatibility facade. Centralizes and forwards all student, teacher,
 * and lesson financial calculations to the dedicated, robust Calculation Services.
 */

import { StudentCalculationService } from './StudentCalculationService.js';
import { FinancialCalculationService } from '../ledger/FinancialCalculationService.js';
import { TeacherCalculationService } from '../teachers/TeacherCalculationService.js';

export const getSiblingDiscountPercentage = (studentId, session) => {
  if (session !== undefined) {
    return StudentCalculationService.getSiblingDiscountPercentage(
      studentId,
      session
    );
  }
  return StudentCalculationService.getSiblingDiscountPercentage(studentId);
};

export const recalculateStudentBalances = (studentId, save) => {
  if (save !== undefined) {
    return StudentCalculationService.recalculateStudentBalances(
      studentId,
      save
    );
  }
  return StudentCalculationService.recalculateStudentBalances(studentId);
};

export const calculateRegistrationWeeklyHours = (reg) => {
  return StudentCalculationService.calculateRegistrationWeeklyHours(reg);
};

export const calculateRegistrationTeacherDue = (
  reg,
  studentGrade,
  tenantId,
  session
) => {
  if (session !== undefined) {
    return TeacherCalculationService.calculateRegistrationTeacherDue(
      reg,
      studentGrade,
      tenantId,
      session
    );
  }
  return TeacherCalculationService.calculateRegistrationTeacherDue(
    reg,
    studentGrade,
    tenantId
  );
};

export const calculateLessonEarnings = (lesson) => {
  return FinancialCalculationService.calculateLessonEarnings(lesson);
};
