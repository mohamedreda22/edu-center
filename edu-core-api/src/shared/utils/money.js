/**
 * Money utilities for handling monetary values as integer minor units (fils).
 * 1 KWD = 1000 fils.
 */

/**
 * Converts a decimal KWD amount to fils (integer).
 * @param {number|string} amount - The amount in KWD (e.g., 10.500)
 * @returns {number} - The amount in fils (e.g., 10500)
 */
export const toFils = (amount) => {
  if (amount === null || amount === undefined) {
    return 0;
  }
  // Using Math.round to avoid floating point precision issues during multiplication
  return Math.round(parseFloat(amount) * 1000);
};

/**
 * Converts fils (integer) to a decimal KWD amount.
 * @param {number} fils - The amount in fils (e.g., 10500)
 * @returns {number} - The amount in KWD (e.g., 10.5)
 */
export const toKWD = (fils) => {
  if (fils === null || fils === undefined) {
    return 0;
  }
  return fils / 1000;
};

/**
 * Formats fils into a displayable KWD string.
 * @param {number} fils - The amount in fils
 * @param {string} locale - The locale for formatting
 * @returns {string} - Formatted string (e.g., "10.500 KD")
 */
export const formatFils = (fils, locale = 'en-KW') => {
  const kwd = toKWD(fils);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
  }).format(kwd);
};

/**
 * Safe addition for multiple fils amounts.
 */
export const addFils = (...amounts) => {
  return amounts.reduce((sum, val) => sum + (val || 0), 0);
};

/**
 * Safe subtraction for fils amounts.
 */
export const subtractFils = (base, ...toSubtract) => {
  return toSubtract.reduce((result, val) => result - (val || 0), base || 0);
};

/**
 * Safe multiplication for fils (e.g., for percentages).
 * Rounds to the nearest integer fil.
 */
export const multiplyFils = (fils, factor) => {
  return Math.round((fils || 0) * factor);
};
