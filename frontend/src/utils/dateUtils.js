/**
 * Date utility functions to handle timezone issues with backend timestamps
 * 
 * Backend sends LocalDateTime from Germany server (UTC+1/+2) without timezone info.
 * We append 'Z' to treat timestamps as UTC for correct conversion to user's local time.
 */

/**
 * Parse backend LocalDateTime as UTC to avoid timezone offset issues
 * @param {string} timestamp - ISO timestamp string from backend
 * @returns {Date|null} - Date object or null if invalid
 */
export const parseUTCDate = (timestamp) => {
  if (!timestamp) return null;
  try {
    // Append 'Z' to treat as UTC
    return new Date(timestamp + 'Z');
  } catch (error) {
    console.error('Error parsing date:', timestamp, error);
    return null;
  }
};

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 * @param {string} timestamp - ISO timestamp string from backend
 * @returns {string} - Formatted relative time string
 */
export const formatTimeAgo = (timestamp) => {
  const date = parseUTCDate(timestamp);
  if (!date) return '';
  
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};
