/**
 * Format number as currency (KWD by default)
 * @param {number} amount
 * @param {string} locale
 * @returns {string}
 */
export const formatCurrency = (amount, locale = 'ar-KW') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KWD',
    currencyDisplay: 'symbol',
  }).format(amount);
};

/**
 * Format money with consistent display
 * @param {number} amount
 * @returns {string}
 */
export const formatMoney = (amount) => {
  return formatCurrency(amount, 'ar-KW');
};
