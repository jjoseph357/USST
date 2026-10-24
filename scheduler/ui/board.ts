import type { Task } from '../../app.js';
import { blockMap, activeFilters } from '../../app.js';
import { html, avatarStack, dueBadge, situation, subsystemSelect, type Safe } from './dom';
import type { ViewContext } from './context';
import { prefs } from './prefs';

const COLUMNS: { status: Task['status']; label: string; hint: string; holds: Task['status'][] }[] = [
  { status: 'todo', label: 'To do', hint: 'Not started yet', holds: ['todo', 'blocked'] },
  { status: 'in-progress', label: 'Doing', hint: 'Someone is on it', holds: ['in-progress'] },
  { status: 'testing', label: 'Testing', hint: 'Built, being checked', holds: ['testing'] },
  { status: 'done', label: 'Done', hint: 'Finished', holds: ['done'] }
];

function card(t: Task, ctx: ViewContext): Safe {
  const block = blockMap[t.blockId];
  const s = situation(t);
  const showSituation = s.tone === 'wait' || (t.status === 'todo' && s.tone === 'ok');
  return html`
    <article class="card ${s.tone === 'wait' ? 'is-waiting' : ''} ${ctx.selectedId === t.id ? 'is-selected' : ''}"
             data-action="open-task" data-id="${t.id}" draggable="${ctx.editable}" tabindex="0" style="--c:${block?.color ?? '#64748b'}">
      <span class="card-block">${block?.name ?? ''}</span>
      <h3 class="card-title">${t.title}</h3>
      ${showSituation ? html`<p class="card-note tone-${s.tone}">${s.text}</p>` : ''}
      <div class="card-foot">${avatarStack(t.assignees)}${dueBadge(t)}</div>
    </article>`;
}

export function renderBoard(ctx: ViewContext): Safe {
  const visible = ctx.tasks.filter(t => ctx.matches.has(t.id));
  const filtered = visible.length !== ctx.tasks.length;
  return html`
    <div class="toolbar">
      ${subsystemSelect()}
      ${ctx.user.id !== 'guest' ? html`<label class="toggle"><input type="checkbox" data-filter="mine" ${activeFilters.assignee === ctx.user.id ? 'checked' : ''}/> Only my tasks</label>` : ''}
      <input class="input input-sm toolbar-search" type="search" data-filter="search" placeholder="Search…" value="${activeFilters.search}" aria-label="Search tasks"/>
      ${filtered ? html`<span class="muted small">Showing ${visible.length} of ${ctx.tasks.length}</span><button class="link small" data-action="clear-filters">Show everything</button>` : ''}
      ${ctx.editable ? html`<span class="spacer"></span><span class="muted small hide-sm">Drag a card to another column to change it</span>` : ''}
    </div>
    <div class="board">
      ${COLUMNS.map(col => {
        const cards = visible.filter(t => col.holds.includes(t.status));
        const collapsed = col.status === 'done' && !prefs.boardShowDone;
        return html`
          <section class="column" data-drop-status="${col.status}">
            <header class="column-head">
              <h2>${col.label} <span class="count">${cards.length}</span></h2>
              <p class="muted small">${col.hint}</p>
            </header>
            <div class="column-body">
              ${collapsed
                ? html`<button class="btn btn-ghost btn-sm" data-action="show-done">Show ${cards.length} finished tasks</button>`
                : cards.map(t => card(t, ctx))}
              ${!collapsed && !cards.length ? html`<p class="empty">Nothing here</p>` : ''}
            </div>
          </section>`;
      })}
    </div>`;
}

export function bindBoard(root: HTMLElement, onMove: (taskId: string, status: Task['status']) => void) {
  let draggingId: string | null = null;
  root.addEventListener('dragstart', e => {
    const el = (e.target as Element).closest<HTMLElement>('.card[draggable="true"]');
    if (!el || !e.dataTransfer) return;
    draggingId = el.dataset.id!;
    e.dataTransfer.setData('text/plain', draggingId);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('is-dragging');
  });
  root.addEventListener('dragend', () => {
    draggingId = null;
    root.querySelectorAll('.is-dragging, .is-drop').forEach(el => el.classList.remove('is-dragging', 'is-drop'));
  });
  root.addEventListener('dragover', e => {
    const col = (e.target as Element).closest<HTMLElement>('[data-drop-status]');
    if (!col || !draggingId) return;
    e.preventDefault();
    root.querySelectorAll('.is-drop').forEach(el => el !== col && el.classList.remove('is-drop'));
    col.classList.add('is-drop');
  });
  root.addEventListener('drop', e => {
    const col = (e.target as Element).closest<HTMLElement>('[data-drop-status]');
    if (!col || !draggingId) return;
    e.preventDefault();
    onMove(draggingId, col.dataset.dropStatus as Task['status']);
  });
}
