// @ts-check
import { describe, test, expect } from 'vitest';
import { formatTime, formatTimeCompact, formatDate, getToday } from '../js/utils.js';

describe('formatTime', () => {
  test('0 秒は 00:00:00', () => expect(formatTime(0)).toBe('00:00:00'));
  test('59 秒は 00:00:59', () => expect(formatTime(59)).toBe('00:00:59'));
  test('60 秒は 00:01:00', () => expect(formatTime(60)).toBe('00:01:00'));
  test('3600 秒は 01:00:00', () => expect(formatTime(3600)).toBe('01:00:00'));
  test('3661 秒は 01:01:01', () => expect(formatTime(3661)).toBe('01:01:01'));
  test('36000 秒（10 時間）は 10:00:00', () => expect(formatTime(36000)).toBe('10:00:00'));
  test('負の値は 00:00:00', () => expect(formatTime(-5)).toBe('00:00:00'));
  test('小数は切り捨て', () => expect(formatTime(1.9)).toBe('00:00:01'));
});

describe('formatTimeCompact', () => {
  test('0 秒は 0:00', () => expect(formatTimeCompact(0)).toBe('0:00'));
  test('3600 秒は 1:00', () => expect(formatTimeCompact(3600)).toBe('1:00'));
  test('3660 秒は 1:01', () => expect(formatTimeCompact(3660)).toBe('1:01'));
  test('90 秒は 0:01', () => expect(formatTimeCompact(90)).toBe('0:01'));
});

describe('formatDate', () => {
  test('2026-06-06 を正しくフォーマット', () => {
    expect(formatDate(new Date(2026, 5, 6))).toBe('2026-06-06');
  });
  test('月と日をゼロパディング', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
  test('12 月 31 日', () => {
    expect(formatDate(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});

describe('getToday', () => {
  test('YYYY-MM-DD 形式を返す', () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  test('今日の日付と一致する', () => {
    expect(getToday()).toBe(formatDate(new Date()));
  });
});
