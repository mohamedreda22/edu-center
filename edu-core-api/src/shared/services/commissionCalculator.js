import { multiplyFils, subtractFils } from '../utils/money.js';

/**
 * Calculate teacher earnings and institute revenue based on lesson price and teacher percentage.
 * Uses integer math (fils) to prevent floating point drift.
 *
 * @param {Object} params
 * @param {number} params.lessonPrice - Total price of the lesson in FILS
 * @param {number} params.teacherPercentage - Teacher's share (e.g., 0.7 for 70%)
 * @returns {Object} { teacherEarnings, instituteRevenue } (in FILS)
 */
export const calculateCommission = ({ lessonPrice, teacherPercentage }) => {
  if (!lessonPrice || lessonPrice <= 0) {
    return { teacherEarnings: 0, instituteRevenue: 0 };
  }

  // Ensure percentage is between 0 and 1
  const tPercent = Math.max(0, Math.min(1, teacherPercentage));

  const teacherEarnings = multiplyFils(lessonPrice, tPercent);
  const instituteRevenue = subtractFils(lessonPrice, teacherEarnings);

  return {
    teacherEarnings,
    instituteRevenue,
  };
};
