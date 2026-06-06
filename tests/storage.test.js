// @ts-check
import { describe, test, expect, beforeEach } from 'vitest';
import {
  getProjects, saveProjects,
  getDailyRecord, saveDailyRecord, getAllDailyRecords,
  getSession, saveSession, clearSession,
  addDeletedProject, getDeletedProject,
} from '../js/storage.js';

// jsdom provides localStorage — reset before each test
beforeEach(() => localStorage.clear());

describe('projects round-trip', () => {
  test('save and retrieve projects', () => {
    const projects = [{ id: 'a', name: 'Alpha', code: 'A-01' }];
    saveProjects(projects);
    expect(getProjects()).toEqual(projects);
  });
  test('missing returns empty array', () => {
    expect(getProjects()).toEqual([]);
  });
  test('null code is preserved', () => {
    saveProjects([{ id: 'b', name: 'Beta', code: null }]);
    expect(getProjects()[0].code).toBeNull();
  });
});

describe('daily record round-trip', () => {
  test('save and retrieve a daily record', () => {
    const record = { 'proj-1': 3600, 'proj-2': 1800 };
    saveDailyRecord('2026-06-06', record);
    expect(getDailyRecord('2026-06-06')).toEqual(record);
  });
  test('missing date returns empty object', () => {
    expect(getDailyRecord('1999-01-01')).toEqual({});
  });
  test('multiple dates are independent', () => {
    saveDailyRecord('2026-06-06', { p1: 100 });
    saveDailyRecord('2026-06-07', { p1: 200 });
    expect(getDailyRecord('2026-06-06')).toEqual({ p1: 100 });
    expect(getDailyRecord('2026-06-07')).toEqual({ p1: 200 });
  });
  test('getAllDailyRecords returns all dates', () => {
    saveDailyRecord('2026-06-06', { p1: 100 });
    saveDailyRecord('2026-06-07', { p1: 200 });
    const all = getAllDailyRecords();
    expect(Object.keys(all)).toHaveLength(2);
  });
});

describe('session snapshot round-trip', () => {
  const snap = { activeProjectId: 'p1', projectStartTimestamp: 1234567890000, sessionDate: '2026-06-06' };
  test('save and retrieve session', () => {
    saveSession(snap);
    expect(getSession()).toEqual(snap);
  });
  test('clearSession sets to null', () => {
    saveSession(snap);
    clearSession();
    expect(getSession()).toBeNull();
  });
  test('missing session returns null', () => {
    expect(getSession()).toBeNull();
  });
});

describe('deleted projects', () => {
  test('add and retrieve deleted project name', () => {
    addDeletedProject('del-1', 'Old Project');
    expect(getDeletedProject('del-1')).toBe('Old Project');
  });
  test('unknown id returns null', () => {
    expect(getDeletedProject('unknown')).toBeNull();
  });
});
