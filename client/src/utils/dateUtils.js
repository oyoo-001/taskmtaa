/**
 * Date utility functions for Kenyan timezone (EAT - UTC+3)
 */

/**
 * Format a date relative to now (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted relative date
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else if (diffWeek < 4) {
    return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Format date to Kenyan locale
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatKenyanDate = (date, options = {}) => {
  const defaultOptions = {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleString('en-KE', defaultOptions);
};

/**
 * Format date with time in Kenyan timezone
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with time
 */
export const formatKenyanDateTime = (date) => {
  return new Date(date).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get current date/time in Kenyan timezone
 * @returns {Date} Current date in EAT
 */
export const getKenyanNow = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
};

/**
 * Format date to "Posted X ago" format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted string
 */
export const formatPostedTime = (date) => {
  return `Posted ${formatRelativeTime(date)}`;
};
