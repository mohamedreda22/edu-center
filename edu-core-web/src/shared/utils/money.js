/**
 * Money utilities for handling monetary values as integer minor units (fils).
 * 1 KWD = 1000 fils.
 */

/**
 * Converts a decimal KWD amount to fils (integer).
 */
export const toFils = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }
  return Math.round(parseFloat(amount) * 1000);
};

/**
 * Converts fils (integer) to a decimal KWD amount.
 */
export const toKWD = (fils) => {
  if (fils === null || fils === undefined) {
    return 0;
  }
  return fils / 1000;
};

/**
 * Format number as currency (KWD by default)
 * @param {number} amount - Amount in KWD (not fils)
 * @param {string} locale
 * @returns {string}
 */
export const formatCurrency = (amount, locale = 'ar-KW') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KWD',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 3,
  }).format(amount);
};

/**
 * Format money (from fils) with consistent display
 * @param {number} fils - Amount in fils
 * @returns {string}
 */
export const formatMoney = (fils) => {
  const kwd = toKWD(fils);
  return formatCurrency(kwd, 'ar-KW');
};
