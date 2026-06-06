// @ts-check
import * as storage     from './storage.js';
import * as timer       from './timer.js';
import * as projectsMgr from './projects.js';
import * as accumulator from './accumulator.js';
import * as calendar    from './calendar.js';
import * as menu        from './menu.js';
import { formatTime, getToday } from './utils.js';

/** @type {'IDLE'|'ACTIVE'|'PAUSED'} */
let _state = 'IDLE';
/** @type {ReturnType<typeof setInterval>|null} */
let _tick = null;
/** 一時停止中のプロジェクト ID @type {string|null} */
let _pausedProjectId = null;

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
      if (session.isPaused) {
        // 一時停止状態を復元
        _pausedProjectId = session.activeProjectId;
        _state = 'PAUSED';
        renderProjects();
        setActiveButton(session.activeProjectId);
      } else {
        // アクティブセッションを復元 (BR-05)
        timer.resume(session.activeProjectId, session.projectStartTimestamp);
        _state = 'ACTIVE';
        renderProjects();
        setActiveButton(session.activeProjectId);
        startTick();
      }
    } else {
      // 日付をまたいだ場合はロールオーバーして IDLE 起動 (BR-05)
      const midnight = new Date(session.sessionDate + 'T24:00:00').getTime();
      const elapsed = Math.max(0, Math.floor((midnight - session.projectStartTimestamp) / 1000));
      if (!session.isPaused) accumulator.add(session.activeProjectId, elapsed);
      accumulator.checkAndRollover();
      accumulator.saveToday();
      storage.clearSession();
      renderProjects();
    }
  } else {
    renderProjects();
  }

  updateSessionBar();
  updateTimerDisplay();
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
  storage.saveSession({ activeProjectId: first.id, projectStartTimestamp: Date.now(), sessionDate: getToday(), isPaused: false });
  _state = 'ACTIVE';
  updateSessionBar();
  setActiveButton(first.id);
  startTick();
}

function endWork() {
  accumulator.checkAndRollover();
  if (_state === 'ACTIVE') {
    const cp = timer.stop();
    if (cp) accumulator.add(cp.projectId, cp.elapsedSeconds);
  }
  // PAUSED の場合はタイマー停止済み・累積加算済み
  accumulator.saveToday();
  storage.clearSession();
  stopTick();
  _state = 'IDLE';
  _pausedProjectId = null;
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
  storage.saveSession({ activeProjectId: projectId, projectStartTimestamp: Date.now(), sessionDate: getToday(), isPaused: false });
  setActiveButton(projectId);
}

function pauseWork() {
  accumulator.checkAndRollover();
  const cp = timer.stop();
  if (cp) accumulator.add(cp.projectId, cp.elapsedSeconds);
  _pausedProjectId = cp?.projectId ?? timer.getActiveProjectId();
  accumulator.saveToday();
  storage.saveSession({ activeProjectId: _pausedProjectId ?? '', projectStartTimestamp: 0, sessionDate: getToday(), isPaused: true });
  stopTick();
  _state = 'PAUSED';
  updateSessionBar();
  updateTimerDisplay();
}

function resumeWork() {
  if (!_pausedProjectId) return;
  accumulator.checkAndRollover();
  timer.start(_pausedProjectId);
  storage.saveSession({ activeProjectId: _pausedProjectId, projectStartTimestamp: Date.now(), sessionDate: getToday(), isPaused: false });
  _state = 'ACTIVE';
  updateSessionBar();
  startTick();
}

/** 今日のデータをストレージから再読み込みして表示を更新する（始業前のみ使用）*/
function refreshToday() {
  accumulator.loadToday();
  updateTimerDisplay();
}

// ── Timer display ────────────────────────────────────────────────────────────

function updateTimerDisplay() {
  accumulator.checkAndRollover();
  const activeId = timer.getActiveProjectId();
  const elapsed  = timer.getElapsedSeconds();
  const todayAll = accumulator.getAllTodayAccumulated();

  let grandTotal = 0;

  projectsMgr.getAll().forEach(proj => {
    const btn = document.querySelector(`[data-project-id="${proj.id}"]`);
    if (!btn) return;
    const timeEl = btn.querySelector('.project-btn-time');
    if (!timeEl) return;
    const base  = todayAll[proj.id] ?? 0;
    const total = proj.id === activeId ? base + elapsed : base;
    timeEl.textContent = formatTime(total);
    grandTotal += total;
  });

  // 登録プロジェクト以外のプロジェクト(削除済み等)の累積も合計に含める
  Object.entries(todayAll).forEach(([id, secs]) => {
    if (!projectsMgr.get(id)) grandTotal += secs;
  });

  const totalEl = $('total-time-display');
  if (totalEl) totalEl.textContent = formatTime(grandTotal);
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
  const beginBtn       = $('begin-work-btn');
  const refreshBtn     = $('refresh-btn');
  const endBtn         = $('end-work-btn');
  const pauseResumeBtn = $('pause-resume-btn');

  // IDLE
  if (_state === 'IDLE') {
    beginBtn?.classList.remove('hidden');
    refreshBtn?.classList.remove('hidden');
    endBtn?.classList.add('hidden');
    pauseResumeBtn?.classList.add('hidden');
  }
  // ACTIVE
  if (_state === 'ACTIVE') {
    beginBtn?.classList.add('hidden');
    refreshBtn?.classList.add('hidden');
    endBtn?.classList.remove('hidden');
    if (pauseResumeBtn) {
      pauseResumeBtn.classList.remove('hidden');
      pauseResumeBtn.textContent = '停止';
      pauseResumeBtn.classList.remove('btn--success');
      pauseResumeBtn.classList.add('btn--warning');
    }
  }
  // PAUSED
  if (_state === 'PAUSED') {
    beginBtn?.classList.add('hidden');
    refreshBtn?.classList.add('hidden');
    endBtn?.classList.remove('hidden');
    if (pauseResumeBtn) {
      pauseResumeBtn.classList.remove('hidden');
      pauseResumeBtn.textContent = '再開';
      pauseResumeBtn.classList.remove('btn--warning');
      pauseResumeBtn.classList.add('btn--success');
    }
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
  const all = projectsMgr.getAll();
  all.forEach((proj, idx) => {
    const row = document.createElement('div');
    row.className = 'menu-project-row';

    // 上下並び替えボタン
    const upBtn = document.createElement('button');
    upBtn.className = 'menu-order-btn';
    upBtn.textContent = '▲';
    upBtn.disabled = idx === 0;
    upBtn.setAttribute('aria-label', '上へ移動');
    upBtn.addEventListener('click', () => {
      projectsMgr.moveUp(proj.id);
      renderProjects();
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'menu-order-btn';
    downBtn.textContent = '▼';
    downBtn.disabled = idx === all.length - 1;
    downBtn.setAttribute('aria-label', '下へ移動');
    downBtn.addEventListener('click', () => {
      projectsMgr.moveDown(proj.id);
      renderProjects();
    });

    const orderGroup = document.createElement('div');
    orderGroup.className = 'menu-order-group';
    orderGroup.appendChild(upBtn);
    orderGroup.appendChild(downBtn);
    row.appendChild(orderGroup);

    const nameEl = document.createElement('span');
    nameEl.className = 'menu-project-name';
    nameEl.textContent = proj.name + (proj.code ? ` (${proj.code})` : '');
    row.appendChild(nameEl);

    const delBtn = document.createElement('button');
    delBtn.className = 'menu-delete-btn';
    delBtn.textContent = '削除';
    delBtn.dataset.testid = `delete-btn-${proj.id}`;
    delBtn.addEventListener('click', () => {
      const isActive = (_state === 'ACTIVE' || _state === 'PAUSED') && (timer.getActiveProjectId() === proj.id || _pausedProjectId === proj.id);
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
  $('refresh-btn')?.addEventListener('click', refreshToday);
  $('pause-resume-btn')?.addEventListener('click', () => {
    if (_state === 'ACTIVE') pauseWork();
    else if (_state === 'PAUSED') resumeWork();
  });

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
