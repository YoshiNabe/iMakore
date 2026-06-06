// @ts-check
import * as storage from './storage.js';
import { generateId } from './utils.js';

/** @typedef {'dev'|'order'|'maintenance'|'other'} Category */
/** @typedef {{ id: string, name: string, code: string|null, category: Category }} Project */

/** @type {Project[]} */
let _projects = [];

export function load() {
  _projects = storage.getProjects().map(p => ({ category: 'other', ...p }));
}

/** @returns {Project[]} */
export function getAll() { return _projects; }

/**
 * @param {string} id
 * @returns {Project|null}
 */
export function get(id) { return _projects.find(p => p.id === id) ?? null; }

/**
 * Add a project (BR-01 validation expected from caller).
 * @param {string} name
 * @param {string|null} [code]
 * @param {Category} [category]
 * @returns {Project}
 */
export function add(name, code = null, category = 'other') {
  const project = { id: generateId(), name: name.trim(), code: code?.trim() || null, category };
  _projects.push(project);
  storage.saveProjects(_projects);
  return project;
}

/**
 * Update a project's name, code, and category.
 * @param {string} id
 * @param {string} name
 * @param {string|null} code
 * @param {Category} [category]
 * @returns {Project|null}
 */
export function update(id, name, code, category = 'other') {
  const proj = _projects.find(p => p.id === id);
  if (!proj) return null;
  proj.name = name.trim();
  proj.code = code?.trim() || null;
  proj.category = category;
  storage.saveProjects(_projects);
  return proj;
}

/** @param {string} id */
export function remove(id) {
  _projects = _projects.filter(p => p.id !== id);
  storage.saveProjects(_projects);
}

/** @param {string} id */
export function moveUp(id) {
  const i = _projects.findIndex(p => p.id === id);
  if (i <= 0) return;
  [_projects[i - 1], _projects[i]] = [_projects[i], _projects[i - 1]];
  storage.saveProjects(_projects);
}

/** @param {string} id */
export function moveDown(id) {
  const i = _projects.findIndex(p => p.id === id);
  if (i < 0 || i >= _projects.length - 1) return;
  [_projects[i], _projects[i + 1]] = [_projects[i + 1], _projects[i]];
  storage.saveProjects(_projects);
}
