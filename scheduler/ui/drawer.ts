import type { Task } from '../../app.js';
import {
  BLOCKS,
  TASKS,
  TEAM_MEMBERS,
  blockMap,
  taskMap,
  isTaskBlocked,
  unmetDependencies,
  updateTaskDetails,
  updateTaskStatus,
  assignNameToTask,
  unassignNameFromTask,
  toggleChecklistItem,
  connectTasks
} from '../../app.js';
import { html, avatar, member, statusPill, icon, STATUS_META, STATUS_ORDER, type Safe } from './dom';
import { wouldCreateCycle } from '../graph';
import type { ViewContext } from './context';

function depRow(t: Task, unlink: { from: string; to: string } | null, editable: boolean) {
  return html`
    <li class="dep-row">
      <button class="dep-open" data-action="open-task" data-id="${t.id}">
        ${statusPill(t.status)}<span class="mono">${t.id}</span><span class="dep-title">${t.title}</span>
      </button>
      ${editable && unlink
        ? html`<button class="icon-btn" data-action="unlink" data-from="${unlink.from}" data-to="${unlink.to}" title="Remove link">${icon('close', 14)}</button>`
        : ''}
    </li>`;
}

function taskOptions(candidates: Task[]) {
  return BLOCKS.map(b => {
    const opts = candidates.filter(t => t.blockId === b.id);
    return opts.length
      ? html`<optgroup label="${b.code} · ${b.name}">${opts.map(t => html`<option value="${t.id}">${t.id} · ${t.title.slice(0, 70)}</option>`)}</optgroup>`
      : '';
  });
}

export function renderDrawer(task: Task, ctx: ViewContext): Safe {
  const ro = !ctx.editable;
  const dis = ro ? 'disabled' : '';
  const block = blockMap[task.blockId];
  const parents = task.dependsOn.map(id => taskMap[id]).filter(Boolean);
  const children = TASKS.filter(t => t.dependsOn.includes(task.id));
  const waits = unmetDependencies(task);
  const impact = ctx.impact.get(task.id) ?? 0;

  const canBeParent = TASKS.filter(t => t.id !== task.id && !task.dependsOn.includes(t.id) && !wouldCreateCycle(ctx.graph, t.id, task.id));
  const canBeChild = TASKS.filter(t => t.id !== task.id && !t.dependsOn.includes(task.id) && !wouldCreateCycle(ctx.graph, task.id, t.id));
  const epics = [...new Set(TASKS.filter(t => t.blockId === task.blockId).map(t => t.epic).filter(Boolean))];

  const blocker = isTaskBlocked(task)
    ? task.status === 'blocked'
      ? html`<div class="callout callout-warn"><strong>Waiting on hardware.</strong> ${task.note || 'Mark it Backlog or In progress once the parts arrive.'}</div>`
      : html`<div class="callout callout-warn"><strong>Blocked by ${waits.length === 1 ? 'a prerequisite' : `${waits.length} prerequisites`}:</strong> ${waits.join(', ')}. It becomes ready when ${waits.length === 1 ? 'that is' : 'those are'} done.</div>`
    : task.status === 'todo'
      ? html`<div class="callout callout-ok"><strong>Ready to start.</strong> ${impact ? `Finishing it moves ${impact} other open task${impact === 1 ? '' : 's'} closer.` : 'Nothing else waits on it.'}</div>`
      : '';

  return html`
    <header class="drawer-head">
      <span class="block-dot" style="--c:${block?.color ?? '#64748b'}"></span>
      <select class="bare-select" data-field="blockId" ${dis} aria-label="Subsystem">
        ${BLOCKS.map(b => html`<option value="${b.id}" ${b.id === task.blockId ? 'selected' : ''}>${b.code} · ${b.name}</option>`)}
      </select>
      <span class="spacer"></span>
      <span class="mono id-badge">${task.id}</span>
      <button class="icon-btn" data-action="copy-link" data-id="${task.id}" title="Copy link to this task">${icon('link', 15)}</button>
      <button class="icon-btn" data-action="close-drawer" title="Close (Esc)">${icon('close', 16)}</button>
    </header>

    <div class="drawer-body">
      ${ro ? html`<div class="callout"><button class="link" data-action="identity">Choose who you are</button> to edit, claim, or link tasks.</div>` : ''}
      <textarea class="title-input" data-field="title" rows="2" ${dis} aria-label="Title">${task.title}</textarea>

      <div class="segmented" role="radiogroup" aria-label="Status">
        ${STATUS_ORDER.map(s => html`<button role="radio" aria-checked="${s === task.status}" class="seg-btn s-${s} ${s === task.status ? 'is-on' : ''}" data-action="set-status" data-status="${s}" ${dis}><i></i>${STATUS_META[s].short}</button>`)}
      </div>
      ${blocker}

      <dl class="fields">
        <dt>Owners</dt>
        <dd>
          <div class="chips">
            ${task.assignees.map(id => html`<span class="chip">${avatar(id)} ${member(id).name}${ro ? '' : html`<button class="chip-x" data-action="unassign" data-who="${id}" aria-label="Remove ${member(id).name}">×</button>`}</span>`)}
            ${ro ? (task.assignees.length ? '' : html`<span class="muted small">Unassigned</span>`) : html`
              ${task.assignees.includes(ctx.user.id) ? '' : html`<button class="btn btn-xs" data-action="claim" data-id="${task.id}">Assign me</button>`}
              <input class="chip-input" list="crewList" placeholder="Add person…" data-add="assignee" aria-label="Add owner"/>`}
          </div>
        </dd>

        <dt>Target date</dt>
        <dd><input type="date" class="input input-sm" data-field="endDate" value="${task.endDate ?? ''}" ${dis}/></dd>

        <dt>Epic</dt>
        <dd><input class="input input-sm" data-field="epic" list="epicList" value="${task.epic}" ${dis}/>
          <datalist id="epicList">${epics.map(e => html`<option value="${e}"></option>`)}</datalist></dd>

        <dt>Tags</dt>
        <dd>
          <div class="chips">
            ${(task.tags ?? []).map(tag => html`<span class="chip chip-tag">${tag}${ro ? '' : html`<button class="chip-x" data-action="remove-tag" data-tag="${tag}" aria-label="Remove tag ${tag}">×</button>`}</span>`)}
            ${ro ? '' : html`<input class="chip-input" placeholder="Add tag…" data-add="tag" aria-label="Add tag"/>`}
          </div>
        </dd>
      </dl>

      <section class="drawer-section">
        <h3>Waits on <span class="muted">${parents.length}</span></h3>
        <ul class="deps">${parents.map(p => depRow(p, { from: p.id, to: task.id }, ctx.editable))}</ul>
        ${ro ? '' : html`<select class="input input-sm" data-add="parent" aria-label="Add prerequisite"><option value="">+ Add prerequisite…</option>${taskOptions(canBeParent)}</select>`}
      </section>

      <section class="drawer-section">
        <h3>Unlocks <span class="muted">${children.length}</span>${impact > children.length ? html` <span class="small muted">· ${impact} open downstream in total</span>` : ''}</h3>
        <ul class="deps">${children.map(c => depRow(c, { from: task.id, to: c.id }, ctx.editable))}</ul>
        ${ro ? '' : html`<select class="input input-sm" data-add="child" aria-label="Add dependent task"><option value="">+ Add task that waits on this…</option>${taskOptions(canBeChild)}</select>`}
      </section>

      <section class="drawer-section">
        <h3>Checklist <span class="muted">${task.completedChecks?.length ?? 0}/${task.checklist?.length ?? 0}</span></h3>
        <ul class="checklist">
          ${(task.checklist ?? []).map((item, i) => html`
            <li>
              <label><input type="checkbox" data-check="${i}" ${task.completedChecks?.includes(i) ? 'checked' : ''} ${dis}/> <span>${item}</span></label>
              ${ro ? '' : html`<button class="icon-btn" data-action="remove-check" data-index="${i}" aria-label="Remove step">${icon('close', 12)}</button>`}
            </li>`)}
        </ul>
        ${ro ? '' : html`<input class="input input-sm" placeholder="Add a step and press Enter…" data-add="check"/>`}
      </section>

      <section class="drawer-section">
        <h3>Notes</h3>
        <textarea class="input notes" data-field="note" rows="4" placeholder="Progress, decisions, links to PRs…" ${dis}>${task.note ?? ''}</textarea>
      </section>
    </div>

    ${ro ? '' : html`
      <footer class="drawer-foot">
        <button class="btn btn-danger-ghost btn-sm" data-action="delete-task" data-id="${task.id}">${icon('trash', 14)} Delete</button>
        <span class="muted small">Changes save automatically</span>
      </footer>`}
    <datalist id="crewList">${TEAM_MEMBERS.map(m => html`<option value="${m.name}"></option>`)}</datalist>`;
}

export function autosize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
}

/** Field edits inside the drawer. Bound once on the persistent drawer element. */
export function bindDrawer(root: HTMLElement, currentId: () => string | null) {
  const commitField = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const id = currentId();
    const field = el.dataset.field as keyof Task | undefined;
    if (!id || !field) return;
    const task = taskMap[id];
    if (!task || (task[field] ?? '') === el.value) return;
    if (field === 'title' && !el.value.trim()) {
      el.value = task.title;
      return;
    }
    updateTaskDetails(id, { [field]: el.value });
  };

  root.addEventListener('change', e => {
    const el = e.target as HTMLInputElement;
    const id = currentId();
    if (!id) return;
    if (el.dataset.field) return commitField(el);
    if (el.dataset.check !== undefined) return toggleChecklistItem(id, Number(el.dataset.check));
    if (el.dataset.add === 'parent' && el.value) return void connectTasks(el.value, id);
    if (el.dataset.add === 'child' && el.value) return void connectTasks(id, el.value);
    if (el.dataset.add === 'assignee' && el.value.trim()) return void assignNameToTask(id, el.value);
  });

  root.addEventListener('keydown', e => {
    const el = e.target as HTMLInputElement;
    const id = currentId();
    if (!id || e.key !== 'Enter') return;
    if (el.classList.contains('title-input')) {
      e.preventDefault();
      el.blur();
      return;
    }
    const value = el.value?.trim();
    if (!value || !el.dataset.add) return;
    const task = taskMap[id];
    e.preventDefault();
    if (el.dataset.add === 'tag') updateTaskDetails(id, { tags: [...(task.tags ?? []), value] });
    if (el.dataset.add === 'check') updateTaskDetails(id, { checklist: [...(task.checklist ?? []), value] });
    if (el.dataset.add === 'assignee') assignNameToTask(id, value);
    root.querySelector<HTMLInputElement>(`[data-add="${el.dataset.add}"]`)?.focus();
  });

  root.addEventListener('input', e => {
    const el = e.target as HTMLTextAreaElement;
    if (el.classList.contains('title-input')) autosize(el);
  });

  root.addEventListener('focusout', e => {
    const el = e.target as HTMLTextAreaElement;
    if (el.dataset.field && el.tagName === 'TEXTAREA') commitField(el);
  });

  root.addEventListener('click', e => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-action]');
    const id = currentId();
    if (!btn || !id || !root.contains(btn)) return;
    const task = taskMap[id];
    switch (btn.dataset.action) {
      case 'set-status':
        updateTaskStatus(id, btn.dataset.status as Task['status']);
        break;
      case 'unassign':
        unassignNameFromTask(id, btn.dataset.who!);
        break;
      case 'remove-tag':
        updateTaskDetails(id, { tags: (task.tags ?? []).filter(t => t !== btn.dataset.tag) });
        break;
      case 'remove-check': {
        const index = Number(btn.dataset.index);
        const checklist = (task.checklist ?? []).filter((_, i) => i !== index);
        const completedChecks = (task.completedChecks ?? []).filter(i => i !== index).map(i => (i > index ? i - 1 : i));
        updateTaskDetails(id, { checklist, completedChecks });
        break;
      }
      default:
        return;
    }
    e.stopPropagation();
  });
}
