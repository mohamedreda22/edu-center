/**
 * Calculate teacher earnings and institute revenue based on lesson price and teacher percentage.
 * Uses integer math (minor units) internally to prevent floating point drift if needed,
 * but for this implementation we use precision rounding to 3 decimal places (KWD standard).
 *
 * @param {Object} params
 * @param {number} params.lessonPrice - Total price of the lesson
 * @param {number} params.teacherPercentage - Teacher's share (e.g., 0.7 for 70%)
 * @returns {Object} { teacherEarnings, instituteRevenue }
 */
export const calculateCommission = ({ lessonPrice, teacherPercentage }) => {
  if (!lessonPrice || lessonPrice <= 0) {
    return { teacherEarnings: 0, instituteRevenue: 0 };
  }

  // Ensure percentage is between 0 and 1
  const tPercent = Math.max(0, Math.min(1, teacherPercentage));

  // Rounds to 3 decimal places (fils)
  const teacherEarnings = Math.round(lessonPrice * tPercent * 1000) / 1000;
  const instituteRevenue =
    Math.round((lessonPrice - teacherEarnings) * 1000) / 1000;

  return {
    teacherEarnings,
    instituteRevenue,
  };
};
