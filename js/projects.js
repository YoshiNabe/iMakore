// @ts-check
import * as storage from './storage.js';
import { generateId } from './utils.js';

/** @type {{ id: string, name: string, code: string|null }[]} */
let _projects = [];

export function load() {
  _projects = storage.getProjects();
}

/** @returns {{ id: string, name: string, code: string|null }[]} */
export function getAll() { return _projects; }

/**
 * @param {string} id
 * @returns {{ id: string, name: string, code: string|null }|null}
 */
export function get(id) { return _projects.find(p => p.id === id) ?? null; }

/**
 * Add a project (BR-01 validation expected from caller).
 * @param {string} name
 * @param {string|null} [code]
 * @returns {{ id: string, name: string, code: string|null }}
 */
export function add(name, code = null) {
  const project = { id: generateId(), name: name.trim(), code: code?.trim() || null };
  _projects.push(project);
  storage.saveProjects(_projects);
  return project;
}

/**
 * @param {string} id
 */
export function remove(id) {
  _projects = _projects.filter(p => p.id !== id);
  storage.saveProjects(_projects);
}

/**
 * Update a project's name and code.
 * @param {string} id
 * @param {string} name
 * @param {string|null} code
 * @returns {{ id: string, name: string, code: string|null }|null}
 */
export function update(id, name, code) {
  const proj = _projects.find(p => p.id === id);
  if (!proj) return null;
  proj.name = name.trim();
  proj.code = code?.trim() || null;
  storage.saveProjects(_projects);
  return proj;
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
