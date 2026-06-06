// @ts-check
import * as storage from './storage.js';
import { getToday, formatDate } from './utils.js';

/** @type {{ [projectId: string]: number }} */
let _today = {};
let _currentDate = getToday();

/** Load today's accumulated data from storage. */
export function loadToday() {
  _currentDate = getToday();
  _today = { ...storage.getDailyRecord(_currentDate) };
}

/**
 * Add seconds to a project's daily accumulation.
 * @param {string} projectId
 * @param {number} seconds
 */
export function add(projectId, seconds) {
  if (seconds <= 0) return;
  _today[projectId] = (_today[projectId] ?? 0) + seconds;
}

/**
 * @param {string} projectId
 * @returns {number}
 */
export function getTodayAccumulated(projectId) { return _today[projectId] ?? 0; }

/** @returns {{ [projectId: string]: number }} */
export function getAllTodayAccumulated() { return { ..._today }; }

/**
 * If the calendar date has changed since last check, save the old day's data
 * and reset the in-memory accumulator for the new day.
 * Call this at every user-interaction entry point (BR-04).
 */
export function checkAndRollover() {
  const today = getToday();
  if (today === _currentDate) return;
  storage.saveDailyRecord(_currentDate, { ..._today });
  _currentDate = today;
  _today = {};
}

/** Persist today's accumulation to storage. */
export function saveToday() {
  storage.saveDailyRecord(_currentDate, { ..._today });
}

/**
 * Delete daily records older than 730 days (2-year rolling window — PATTERN-03).
 * Runs once at startup.
 */
export function purgeOldData() {
  const cutoff = formatDate(new Date(Date.now() - 730 * 24 * 60 * 60 * 1000));
  const all = storage.getAllDailyRecords();
  const old = Object.keys(all).filter(d => d < cutoff);
  if (old.length === 0) return;
  old.forEach(d => delete all[d]);
  storage.saveAllDailyRecords(all);
  console.log(`iMakore: purged ${old.length} daily record(s) older than 2 years`);
}
