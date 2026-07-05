import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Format date for RTL/Arabic display
 * @param {Date|string|number} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  return format(d, formatStr, { locale: ar });
};

/**
 * Get relative time string (e.g., "منذ يومين")
 * @param {Date|string|number} date
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) {
    return '';
  }
  // implementation using date-fns formatDistanceToNow
  return formatDate(date); // Placeholder for now
};
