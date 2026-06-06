// @ts-check

const KEYS = {
  PROJECTS: 'imakore_projects',
  DAILY:    'imakore_daily',
  DELETED:  'imakore_deleted',
  SESSION:  'imakore_session',
  SETTINGS: 'imakore_settings',
};

/** @type {((msg: string) => void) | null} */
let _onError = null;

/**
 * Register a callback invoked on QuotaExceededError.
 * @param {(msg: string) => void} cb
 */
export function onStorageError(cb) { _onError = cb; }

/** @param {string} key @param {*} fallback @returns {*} */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** @param {string} key @param {*} value */
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      _onError?.('ストレージ容量が不足しています。古いデータを手動で削除してください。');
    }
  }
}

// ── Projects ────────────────────────────────────────────────────────────────
/** @returns {{ id: string, name: string, code: string|null }[]} */
export function getProjects() { return read(KEYS.PROJECTS, []); }
/** @param {{ id: string, name: string, code: string|null }[]} projects */
export function saveProjects(projects) { write(KEYS.PROJECTS, projects); }

// ── Daily records ────────────────────────────────────────────────────────────
/** @param {string} date YYYY-MM-DD @returns {{ [id: string]: number }} */
export function getDailyRecord(date) { return getAllDailyRecords()[date] ?? {}; }
/** @param {string} date @param {{ [id: string]: number }} record */
export function saveDailyRecord(date, record) {
  const all = getAllDailyRecords();
  all[date] = record;
  write(KEYS.DAILY, all);
}
/** @returns {{ [date: string]: { [id: string]: number } }} */
export function getAllDailyRecords() { return read(KEYS.DAILY, {}); }
/** @param {{ [date: string]: { [id: string]: number } }} records */
export function saveAllDailyRecords(records) { write(KEYS.DAILY, records); }

// ── Deleted projects (id → name) ─────────────────────────────────────────────
/** @param {string} id @param {string} name */
export function addDeletedProject(id, name) {
  const map = getAllDeletedProjects();
  map[id] = name;
  write(KEYS.DELETED, map);
}
/** @param {string} id @returns {string|null} */
export function getDeletedProject(id) { return getAllDeletedProjects()[id] ?? null; }
/** @returns {{ [id: string]: string }} */
export function getAllDeletedProjects() { return read(KEYS.DELETED, {}); }

// ── Session snapshot ──────────────────────────────────────────────────────────
/** @returns {{ activeProjectId: string, projectStartTimestamp: number, sessionDate: string, isPaused?: boolean }|null} */
export function getSession() { return read(KEYS.SESSION, null); }
/** @param {{ activeProjectId: string, projectStartTimestamp: number, sessionDate: string, isPaused?: boolean }} s */
export function saveSession(s) { write(KEYS.SESSION, s); }
export function clearSession() { write(KEYS.SESSION, null); }

// ── Settings ─────────────────────────────────────────────────────────────────
/** @returns {{ version: number }} */
export function getSettings() { return read(KEYS.SETTINGS, { version: 1 }); }
/** @param {{ version: number }} s */
export function saveSettings(s) { write(KEYS.SETTINGS, s); }
