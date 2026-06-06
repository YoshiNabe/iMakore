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
