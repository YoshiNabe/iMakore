// @ts-check
import * as storage    from './storage.js';
import * as timer      from './timer.js';
import * as projectsMgr from './projects.js';
import * as accumulator from './accumulator.js';
import * as calendar   from './calendar.js';
import * as menu       from './menu.js';
import { formatTime, getToday } from './utils.js';

/** @type {'IDLE'|'ACTIVE'} */
let _state = 'IDLE';
/** @type {ReturnType<typeof setInterval>|null} */
let _tick = null;

const $ = id => document.getElementById(id);

// ── Initialization ───────────────────────────────────────────────────────────

function init() {
  projectsMgr.load();
  accumulator.loadToday();
  accumulator.purgeOldData();

  storage.onStorageError(msg => {
    const banner = $('global-error');
    if (banner) { banner.textContent = msg; banner.classList.remove('hidden'); }
  });

  menu.init({ onProjectAdded, onProjectDeleted });

  const session = storage.getSession();
  if (session) {
    const today = getToday();
    if (session.sessionDate === today) {
      // Resume active session (BR-05 — same day)
      timer.resume(session.activeProjectId, session.projectStartTimestamp);
      _state = 'ACTIVE';
      renderProjects();
      setActiveButton(session.activeProjectId);
      startTick();
    } else {
      // Crossed midnight — rollover then start IDLE (BR-05 — different day)
      const midnight = new Date(session.sessionDate + 'T24:00:00').getTime();
      const elapsed = Math.max(0, Math.floor((midnight - session.projectStartTimestamp) / 1000));
      accumulator.add(session.activeProjectId, elapsed);
      accumulator.checkAndRollover();
      accumulator.saveToday();
      storage.clearSession();
      renderProjects();
    }
  } else {
    renderProjects();
  }

  updateSessionBar();
  wireEvents();

  // Page Visibility API — PATTERN-01
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTick();
    } else if (_state === 'ACTIVE') {
      updateTimerDisplay();
      startTick();
    }
  });
}

// ── Session control ──────────────────────────────────────────────────────────

function beginWork() {
  const all = projectsMgr.getAll();
  if (all.length === 0) return;

  accumulator.checkAndRollover();
  const first = all[0];
  timer.start(first.id);
  storage.saveSession({ activeProjectId: first.id, projectStartTimestamp: Date.now(), sessionDate: getToday() });
  _state = 'ACTIVE';
  updateSessionBar();
  setActiveButton(first.id);
  startTick();
}

function endWork() {
  accumulator.checkAndRollover();
  const cp = timer.stop();
  if (cp) accumulator.add(cp.projectId, cp.elapsedSeconds);
  accumulator.saveToday();
  storage.clearSession();
  stopTick();
  _state = 'IDLE';
  updateSessionBar();
  clearActiveButtons();
  updateTimerDisplay();
}

/** @param {string} projectId */
function switchProject(projectId) {
  if (projectId === timer.getActiveProjectId()) return;
  accumulator.checkAndRollover();
  const cp = timer.checkpoint();
  if (cp) accumulator.add(cp.projectId, cp.elapsedSeconds);
  timer.start(projectId);
  storage.saveSession({ activeProjectId: projectId, projectStartTimestamp: Date.now(), sessionDate: getToday() });
  setActiveButton(projectId);
}

// ── Timer display ────────────────────────────────────────────────────────────

function updateTimerDisplay() {
  accumulator.checkAndRollover();
  const activeId = timer.getActiveProjectId();
  const elapsed  = timer.getElapsedSeconds();
  const todayAll = accumulator.getAllTodayAccumulated();

  projectsMgr.getAll().forEach(proj => {
    const btn = document.querySelector(`[data-project-id="${proj.id}"]`);
    if (!btn) return;
    const timeEl = btn.querySelector('.project-btn-time');
    if (!timeEl) return;
    const base  = todayAll[proj.id] ?? 0;
    const total = proj.id === activeId ? base + elapsed : base;
    timeEl.textContent = formatTime(total);
  });
}

function startTick() {
  if (_tick) return;
  _tick = setInterval(updateTimerDisplay, 1000);
}

function stopTick() {
  if (_tick) { clearInterval(_tick); _tick = null; }
}

// ── UI rendering ─────────────────────────────────────────────────────────────

function renderProjects() {
  const container = $('project-list');
  if (!container) return;
  container.innerHTML = '';
  projectsMgr.getAll().forEach(proj => container.appendChild(createProjectButton(proj)));
  renderMenuProjectList();
  updateBeginBtnState();
}

/** @param {{ id: string, name: string, code: string|null }} proj */
function createProjectButton(proj) {
  const btn = document.createElement('button');
  btn.className = 'project-btn';
  btn.dataset.projectId = proj.id;
  btn.dataset.testid = `project-btn-${proj.id}`;

  const nameEl = document.createElement('span');
  nameEl.className = 'project-btn-name';
  nameEl.textContent = proj.name;
  btn.appendChild(nameEl);

  if (proj.code) {
    const codeEl = document.createElement('span');
    codeEl.className = 'project-btn-code';
    codeEl.textContent = proj.code;
    btn.appendChild(codeEl);
  }

  const timeEl = document.createElement('span');
  timeEl.className = 'project-btn-time';
  timeEl.textContent = '00:00:00';
  btn.appendChild(timeEl);

  btn.addEventListener('click', () => { if (_state === 'ACTIVE') switchProject(proj.id); });
  return btn;
}

/** @param {{ id: string, name: string, code: string|null }} project */
function onProjectAdded(project) {
  $('project-list')?.appendChild(createProjectButton(project));
  updateBeginBtnState();
  renderMenuProjectList();
}

/** @param {string} projectId */
function onProjectDeleted(projectId) {
  document.querySelector(`[data-project-id="${projectId}"]`)?.remove();
  updateBeginBtnState();
  renderMenuProjectList();
}

/** @param {string} projectId */
function setActiveButton(projectId) {
  document.querySelectorAll('.project-btn').forEach(btn => {
    /** @type {HTMLElement} */ (btn).classList.toggle(
      'project-btn--active', /** @type {HTMLElement} */ (btn).dataset.projectId === projectId
    );
  });
}

function clearActiveButtons() {
  document.querySelectorAll('.project-btn').forEach(btn => btn.classList.remove('project-btn--active'));
}

function updateSessionBar() {
  const beginBtn = $('begin-work-btn');
  const endBtn   = $('end-work-btn');
  if (_state === 'ACTIVE') {
    beginBtn?.classList.add('hidden');
    endBtn?.classList.remove('hidden');
  } else {
    beginBtn?.classList.remove('hidden');
    endBtn?.classList.add('hidden');
  }
  updateBeginBtnState();
}

function updateBeginBtnState() {
  const btn = /** @type {HTMLButtonElement|null} */ ($('begin-work-btn'));
  if (!btn) return;
  const ok = projectsMgr.getAll().length > 0;
  btn.disabled = !ok;
  btn.classList.toggle('btn--disabled', !ok);
}

function renderMenuProjectList() {
  const list = $('menu-project-list');
  if (!list) return;
  list.innerHTML = '';
  projectsMgr.getAll().forEach(proj => {
    const row = document.createElement('div');
    row.className = 'menu-project-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'menu-project-name';
    nameEl.textContent = proj.name + (proj.code ? ` (${proj.code})` : '');
    row.appendChild(nameEl);

    const delBtn = document.createElement('button');
    delBtn.className = 'menu-delete-btn';
    delBtn.textContent = '削除';
    delBtn.dataset.testid = `delete-btn-${proj.id}`;
    delBtn.addEventListener('click', () => {
      const isActive = _state === 'ACTIVE' && timer.getActiveProjectId() === proj.id;
      menu.showDeleteConfirm(proj.id, isActive);
    });
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

// ── Event wiring ─────────────────────────────────────────────────────────────

function wireEvents() {
  $('begin-work-btn')?.addEventListener('click', beginWork);
  $('end-work-btn')?.addEventListener('click', endWork);

  $('menu-btn')?.addEventListener('click', () => menu.toggle());

  $('add-project-btn')?.addEventListener('click', () => menu.showAddDialog());
  $('add-project-submit')?.addEventListener('click', () => menu.handleAddSubmit());
  $('add-project-cancel')?.addEventListener('click', () => $('add-project-dialog')?.classList.add('hidden'));

  $('delete-confirm-ok')?.addEventListener('click', () => menu.handleDeleteConfirm());
  $('delete-confirm-cancel')?.addEventListener('click', () => $('delete-confirm-dialog')?.classList.add('hidden'));

  $('calendar-btn')?.addEventListener('click', () => { menu.close(); calendar.show(); });
  $('calendar-close-btn')?.addEventListener('click', () => calendar.hide());
  $('cal-prev-btn')?.addEventListener('click', () => calendar.prevMonth());
  $('cal-next-btn')?.addEventListener('click', () => calendar.nextMonth());
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
