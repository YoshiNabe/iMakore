// @ts-check
import * as storage from './storage.js';
import * as projects from './projects.js';
import { formatDate, formatTime, formatTimeCompact } from './utils.js';

let _year = new Date().getFullYear();
let _month = new Date().getMonth(); // 0-indexed

const $ = id => document.getElementById(id);

export function show() {
  $('calendar-panel')?.classList.remove('hidden');
  renderMonth(_year, _month);
}

export function hide() {
  $('calendar-panel')?.classList.add('hidden');
  $('day-detail-panel')?.classList.add('hidden');
}

export function prevMonth() {
  if (--_month < 0) { _month = 11; _year--; }
  renderMonth(_year, _month);
}

export function nextMonth() {
  if (++_month > 11) { _month = 0; _year++; }
  renderMonth(_year, _month);
}

/**
 * @param {number} year
 * @param {number} month  0-indexed
 */
export function renderMonth(year, month) {
  const label = $('calendar-month-label');
  if (label) label.textContent = `${year}年${month + 1}月`;

  const grid = $('calendar-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Weekday headers
  ['日', '月', '火', '水', '木', '金', '土'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = formatDate(new Date());
  const allRecords = storage.getAllDailyRecords();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell cal-cell--empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const record = allRecords[dateStr] ?? {};
    const totalSecs = Object.values(record).reduce((a, b) => a + b, 0);

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (dateStr === today ? ' cal-cell--today' : '');
    cell.dataset.date = dateStr;

    const num = document.createElement('span');
    num.className = 'cal-day-num';
    num.textContent = String(d);
    cell.appendChild(num);

    if (totalSecs > 0) {
      const t = document.createElement('span');
      t.className = 'cal-day-time';
      t.textContent = formatTimeCompact(totalSecs);
      cell.appendChild(t);
    }

    cell.addEventListener('click', () => showDayDetail(dateStr));
    grid.appendChild(cell);
  }
}

/** @param {string} date YYYY-MM-DD */
export function showDayDetail(date) {
  const panel = $('day-detail-panel');
  if (!panel) return;

  const [y, m, d] = date.split('-').map(Number);
  const dow = ['日','月','火','水','木','金','土'][new Date(y, m - 1, d).getDay()];
  const title = panel.querySelector('.day-detail-title');
  if (title) title.textContent = `${y}年${m}月${d}日（${dow}）`;

  const list = panel.querySelector('.day-detail-list');
  if (!list) return;
  list.innerHTML = '';

  const record = storage.getDailyRecord(date);
  const deletedMap = storage.getAllDeletedProjects();
  const entries = Object.entries(record);

  if (entries.length === 0) {
    const p = document.createElement('p');
    p.className = 'day-detail-empty';
    p.textContent = '記録なし';
    list.appendChild(p);
  } else {
    entries.forEach(([id, secs]) => {
      const proj = projects.get(id);
      const name = proj ? proj.name : `[削除済み] ${deletedMap[id] ?? id}`;
      const code = proj?.code ?? null;

      const row = document.createElement('div');
      row.className = 'day-detail-row';

      const nameEl = document.createElement('span');
      nameEl.className = 'day-detail-name';
      nameEl.textContent = name;
      row.appendChild(nameEl);

      if (code) {
        const codeEl = document.createElement('span');
        codeEl.className = 'day-detail-code';
        codeEl.textContent = code;
        row.appendChild(codeEl);
      }

      const timeEl = document.createElement('span');
      timeEl.className = 'day-detail-time';
      timeEl.textContent = formatTime(secs);
      row.appendChild(timeEl);

      list.appendChild(row);
    });
  }

  panel.classList.remove('hidden');
}
