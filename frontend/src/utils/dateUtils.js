/**
 * Date utility functions to handle timezone issues with backend timestamps
 *
 * Backend sends LocalDateTime in the server's local time without timezone info.
 * We parse timestamps as-is (treating them as local time) to avoid timezone offset issues.
 */

/**
 * Parse backend LocalDateTime timestamp
 * @param {string} timestamp - ISO timestamp string from backend
 * @returns {Date|null} - Date object or null if invalid
 */
export const parseUTCDate = (timestamp) => {
    if (!timestamp) return null;
    // Already a Date object — return as-is (guard against non-string inputs)
    if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? null : timestamp;
    try {
        // Parse directly — backend sends local server time without timezone suffix
        // Do NOT append 'Z' as that would shift the time by the server's UTC offset
        const date = new Date(timestamp);
        // Check if date is valid (Invalid Date has NaN time)
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', timestamp);
            return null;
        }
        return date;
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
