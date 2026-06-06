// @ts-check
import * as projects from './projects.js';
import * as storage from './storage.js';

/** @type {((p: { id:string, name:string, code:string|null }) => void)|null} */
let _onAdded = null;
/** @type {((id: string) => void)|null} */
let _onDeleted = null;

/**
 * @param {{ onProjectAdded: Function, onProjectDeleted: Function }} callbacks
 */
export function init(callbacks) {
  _onAdded   = callbacks.onProjectAdded;
  _onDeleted = callbacks.onProjectDeleted;
}

const $ = id => document.getElementById(id);

export function open()   { $('menu-panel')?.classList.remove('hidden'); }
export function close()  { $('menu-panel')?.classList.add('hidden'); closeAddDialog(); closeDeleteDialog(); }
export function toggle() { $('menu-panel')?.classList.contains('hidden') ? open() : close(); }

export function showAddDialog() {
  const dlg = $('add-project-dialog');
  if (!dlg) return;
  /** @type {HTMLInputElement} */ ($('project-name-input')).value = '';
  /** @type {HTMLInputElement} */ ($('project-code-input')).value = '';
  dlg.querySelector('.form-error').textContent = '';
  dlg.classList.remove('hidden');
}

function closeAddDialog() { $('add-project-dialog')?.classList.add('hidden'); }

export function handleAddSubmit() {
  const name = /** @type {HTMLInputElement} */ ($('project-name-input')).value.trim();
  const code = /** @type {HTMLInputElement} */ ($('project-code-input')).value.trim() || null;
  const errEl = $('add-project-dialog')?.querySelector('.form-error');

  // BR-01 validation
  if (!name || name.length > 50) {
    if (errEl) errEl.textContent = 'プロジェクト名は必須です（50 文字以内）';
    return;
  }
  if (code && code.length > 20) {
    if (errEl) errEl.textContent = 'プロジェクトコードは 20 文字以内で入力してください';
    return;
  }

  const project = projects.add(name, code);
  closeAddDialog();
  close();
  _onAdded?.(project);
}

/** @type {string|null} */
let _pendingDeleteId = null;

/**
 * @param {string} projectId
 * @param {boolean} isActive
 */
export function showDeleteConfirm(projectId, isActive) {
  if (isActive) { showToast('終業後に削除してください'); return; }
  _pendingDeleteId = projectId;
  const dlg = $('delete-confirm-dialog');
  if (!dlg) return;
  const proj = projects.get(projectId);
  const msg = dlg.querySelector('.delete-confirm-message');
  if (msg) msg.textContent = `「${proj?.name ?? ''}」を削除しますか？過去の記録は保持されます。`;
  dlg.classList.remove('hidden');
}

export function handleDeleteConfirm() {
  if (!_pendingDeleteId) return;
  const proj = projects.get(_pendingDeleteId);
  if (proj) {
    storage.addDeletedProject(proj.id, proj.name);
    projects.remove(proj.id);
    _onDeleted?.(_pendingDeleteId);
  }
  _pendingDeleteId = null;
  closeDeleteDialog();
}

function closeDeleteDialog() { $('delete-confirm-dialog')?.classList.add('hidden'); }

/** @param {string} msg */
function showToast(msg) {
  let toast = $('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast toast--visible';
  setTimeout(() => toast?.classList.remove('toast--visible'), 3000);
}
