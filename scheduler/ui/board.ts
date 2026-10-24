import type { Task } from '../../app.js';
import { blockMap, isTaskBlocked, unmetDependencies } from '../../app.js';
import { html, avatarStack, dueBadge, icon, STATUS_META, STATUS_ORDER, type Safe } from './dom';
import type { ViewContext } from './context';
import { prefs } from './prefs';

export function taskCard(t: Task, ctx: ViewContext): Safe {
  const block = blockMap[t.blockId];
  const waits = t.status !== 'blocked' ? unmetDependencies(t) : [];
  const impact = ctx.impact.get(t.id) ?? 0;
  const checks = t.checklist?.length ?? 0;
  const checked = t.completedChecks?.length ?? 0;
  return html`
    <article class="card ${isTaskBlocked(t) ? 'is-blocked' : ''} ${ctx.selectedId === t.id ? 'is-selected' : ''}"
             data-action="open-task" data-id="${t.id}" draggable="${ctx.editable}" tabindex="0" style="--c:${block?.color ?? '#64748b'}">
      <div class="card-top">
        <span class="mono id">${t.id}</span>
        <span class="card-block">${block?.name ?? ''}</span>
        ${ctx.criticalSet.has(t.id) ? html`<span class="crit-flag" title="On the critical path">critical</span>` : ''}
      </div>
      <h3 class="card-title">${t.title}</h3>
      ${waits.length ? html`<p class="card-wait">Waits on ${waits.join(', ')}</p>` : ''}
      ${t.status === 'blocked' && t.note ? html`<p class="card-wait">${t.note}</p>` : ''}
      <div class="card-foot">
        ${avatarStack(t.assignees)}
        <span class="card-tags">
          ${checks ? html`<span class="small muted" title="Checklist">${icon('check', 12)} ${checked}/${checks}</span>` : ''}
          ${dueBadge(t)}
          ${impact > 0 ? html`<span class="impact" title="${impact} open tasks wait on this">+${impact}</span>` : ''}
        </span>
      </div>
    </article>`;
}

export function renderBoard(ctx: ViewContext): Safe {
  const visible = ctx.tasks.filter(t => ctx.matches.has(t.id));
  return html`
    <div class="board-toolbar">
      <label class="toggle"><input type="checkbox" data-pref="boardHideDone" ${prefs.boardHideDone ? 'checked' : ''}/> Collapse done</label>
      ${ctx.editable ? html`<span class="small muted hide-sm">Drag cards between columns to change status</span>` : ''}
    </div>
    <div class="board">
      ${STATUS_ORDER.map(status => {
        const col = visible.filter(t => t.status === status);
        const collapsed = status === 'done' && prefs.boardHideDone;
        return html`
          <section class="column ${collapsed ? 'is-collapsed' : ''}" data-drop-status="${status}">
            <header class="column-head">
              <span class="status-pill s-${status}"><i></i>${STATUS_META[status].label}</span>
              <span class="count">${col.length}</span>
              ${ctx.editable ? html`<button class="icon-btn" data-action="new-task" data-status="${status}" title="Add a task here">${icon('plus', 14)}</button>` : ''}
            </header>
            <div class="column-body">
              ${collapsed ? html`<p class="empty-line">${col.length} done tasks hidden</p>` : col.map(t => taskCard(t, ctx))}
              ${!collapsed && !col.length ? html`<p class="empty-line">Nothing here</p>` : ''}
            </div>
          </section>`;
      })}
    </div>`;
}

export function bindBoard(root: HTMLElement, onMove: (taskId: string, status: Task['status']) => void, onPref: () => void) {
  let draggingId: string | null = null;
  root.addEventListener('dragstart', e => {
    const card = (e.target as Element).closest<HTMLElement>('.card[draggable="true"]');
    if (!card || !e.dataTransfer) return;
    draggingId = card.dataset.id!;
    e.dataTransfer.setData('text/plain', draggingId);
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('is-dragging');
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
  root.addEventListener('change', e => {
    const input = e.target as HTMLInputElement;
    if (input.dataset.pref !== 'boardHideDone') return;
    prefs.boardHideDone = input.checked;
    onPref();
  });
}
