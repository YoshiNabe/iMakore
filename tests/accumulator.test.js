// @ts-check
import { describe, test, expect, beforeEach, vi } from 'vitest';

// We test the pure rollover detection logic by extracting it inline.
// The actual accumulator depends on storage, so we test the logic unit separately.

/**
 * Pure function extracted from accumulator.checkAndRollover logic:
 * given the stored date and today's date, determine if rollover is needed.
 * @param {string} storedDate
 * @param {string} today
 * @returns {boolean}
 */
function needsRollover(storedDate, today) {
  return storedDate !== today;
}

/**
 * Midnight timestamp for a given YYYY-MM-DD string.
 * @param {string} dateStr
 * @returns {number}
 */
function midnightOf(dateStr) {
  return new Date(dateStr + 'T24:00:00').getTime();
}

/**
 * Elapsed seconds to midnight given a project start timestamp on the previous day.
 * @param {string} sessionDate
 * @param {number} projectStartTimestamp
 * @returns {number}
 */
function elapsedToMidnight(sessionDate, projectStartTimestamp) {
  const midnight = midnightOf(sessionDate);
  return Math.max(0, Math.floor((midnight - projectStartTimestamp) / 1000));
}

describe('rollover detection (needsRollover)', () => {
  test('same date: no rollover needed', () => {
    expect(needsRollover('2026-06-06', '2026-06-06')).toBe(false);
  });
  test('different date: rollover needed', () => {
    expect(needsRollover('2026-06-05', '2026-06-06')).toBe(true);
  });
  test('multi-day gap: rollover needed', () => {
    expect(needsRollover('2026-01-01', '2026-06-06')).toBe(true);
  });
  test('year boundary: rollover needed', () => {
    expect(needsRollover('2025-12-31', '2026-01-01')).toBe(true);
  });
});

describe('elapsedToMidnight (session restore calculation)', () => {
  test('project started 1 hour before midnight = 3600 seconds', () => {
    const midnight = midnightOf('2026-06-05');   // midnight between Jun 5 and Jun 6
    const startTs = midnight - 3600 * 1000;      // 23:00:00 on Jun 5
    expect(elapsedToMidnight('2026-06-05', startTs)).toBe(3600);
  });
  test('project started at midnight itself = 0 seconds', () => {
    const midnight = midnightOf('2026-06-05');
    expect(elapsedToMidnight('2026-06-05', midnight)).toBe(0);
  });
  test('future timestamp returns 0 (non-negative)', () => {
    const midnight = midnightOf('2026-06-05');
    expect(elapsedToMidnight('2026-06-05', midnight + 1000)).toBe(0);
  });
  test('30-minute session before midnight = 1800 seconds', () => {
    const midnight = midnightOf('2026-06-06');
    const startTs = midnight - 30 * 60 * 1000;
    expect(elapsedToMidnight('2026-06-06', startTs)).toBe(1800);
  });
});

describe('2-year purge date comparison', () => {
  test('date string comparison is correct (lexicographic = chronological for YYYY-MM-DD)', () => {
    expect('2024-06-05' < '2026-06-06').toBe(true);
    expect('2026-06-06' < '2026-06-06').toBe(false);
    expect('2026-06-07' < '2026-06-06').toBe(false);
  });
});
