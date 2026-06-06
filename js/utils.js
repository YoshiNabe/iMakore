// @ts-check

/**
 * Format total seconds into HH:MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Format total seconds into compact H:MM for calendar cells.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTimeCompact(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Format a Date as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return today as YYYY-MM-DD.
 * @returns {string}
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * Generate a UUID using crypto.randomUUID().
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID();
}
