// @ts-check

/** @type {string|null} */
let _activeProjectId = null;
/** @type {number|null} */
let _startTimestamp = null;

/**
 * Start timing a project from now.
 * @param {string} projectId
 */
export function start(projectId) {
  _activeProjectId = projectId;
  _startTimestamp = Date.now();
}

/**
 * Resume timing from a saved timestamp (session restore).
 * @param {string} projectId
 * @param {number} timestamp  ms since epoch
 */
export function resume(projectId, timestamp) {
  _activeProjectId = projectId;
  _startTimestamp = timestamp;
}

/**
 * Stop timing and return elapsed seconds.
 * @returns {{ projectId: string, elapsedSeconds: number }|null}
 */
export function stop() {
  if (_activeProjectId === null) return null;
  const result = { projectId: _activeProjectId, elapsedSeconds: getElapsedSeconds() };
  _activeProjectId = null;
  _startTimestamp = null;
  return result;
}

/**
 * Get elapsed seconds without stopping.
 * @returns {{ projectId: string, elapsedSeconds: number }|null}
 */
export function checkpoint() {
  if (_activeProjectId === null) return null;
  return { projectId: _activeProjectId, elapsedSeconds: getElapsedSeconds() };
}

/**
 * Current elapsed seconds (Date.now() based — drift-free).
 * @returns {number}
 */
export function getElapsedSeconds() {
  if (_startTimestamp === null) return 0;
  return Math.max(0, Math.floor((Date.now() - _startTimestamp) / 1000));
}

/** @returns {boolean} */
export function isRunning() { return _activeProjectId !== null; }

/** @returns {string|null} */
export function getActiveProjectId() { return _activeProjectId; }
