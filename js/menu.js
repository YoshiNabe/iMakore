// @ts-check
import * as projects from './projects.js';
import * as storage from './storage.js';

/** @type {((p: { id:string, name:string, code:string|null }) => void)|null} */
let _onAdded = null;
/** @type {((id: string) => void)|null} */
let _onDeleted = null;
/** @type {((p: { id:string, name:string, code:string|null }) => void)|null} */
let _onUpdated = null;

/**
 * @param {{ onProjectAdded: Function, onProjectDeleted: Function, onProjectUpdated: Function }} callbacks
 */
export function init(callbacks) {
  _onAdded   = callbacks.onProjectAdded;
  _onDeleted = callbacks.onProjectDeleted;
  _onUpdated = callbacks.onProjectUpdated;
}

const $ = id => document.getElementById(id);

export function open()   { $('menu-panel')?.classList.remove('hidden'); }
export function close()  {
  $('menu-panel')?.classList.add('hidden');
  closeAddDialog();
  closeEditDialog();
  closeDeleteDialog();
}
export function toggle() { $('menu-panel')?.classList.contains('hidden') ? open() : close(); }

// ── Add ──────────────────────────────────────────────────────────────────────

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

// ── Edit ──────────────────────────────────────────────────────────────────────

/** @param {string} projectId */
export function showEditDialog(projectId) {
  const proj = projects.get(projectId);
  if (!proj) return;
  const dlg = $('edit-project-dialog');
  if (!dlg) return;
  /** @type {HTMLInputElement} */ ($('edit-project-id')).value = proj.id;
  /** @type {HTMLInputElement} */ ($('edit-project-name-input')).value = proj.name;
  /** @type {HTMLInputElement} */ ($('edit-project-code-input')).value = proj.code ?? '';
  dlg.querySelector('.form-error').textContent = '';
  dlg.classList.remove('hidden');
}

function closeEditDialog() { $('edit-project-dialog')?.classList.add('hidden'); }

export function handleEditSubmit() {
  const id   = /** @type {HTMLInputElement} */ ($('edit-project-id')).value;
  const name = /** @type {HTMLInputElement} */ ($('edit-project-name-input')).value.trim();
  const code = /** @type {HTMLInputElement} */ ($('edit-project-code-input')).value.trim() || null;
  const errEl = $('edit-project-dialog')?.querySelector('.form-error');

  if (!name || name.length > 50) {
    if (errEl) errEl.textContent = 'プロジェクト名は必須です（50 文字以内）';
    return;
  }
  if (code && code.length > 20) {
    if (errEl) errEl.textContent = 'プロジェクトコードは 20 文字以内で入力してください';
    return;
  }

  const updated = projects.update(id, name, code);
  if (updated) {
    closeEditDialog();
    close();        // 追加と同じく保存後はメニューも閉じる
    _onUpdated?.(updated);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

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

// ── Utility ───────────────────────────────────────────────────────────────────

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
