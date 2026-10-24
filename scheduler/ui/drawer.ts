import type { Task } from '../../app.js';
import {
  BLOCKS,
  TASKS,
  TEAM_MEMBERS,
  blockMap,
  taskMap,
  updateTaskDetails,
  updateTaskStatus,
  assignNameToTask,
  unassignNameFromTask,
  toggleChecklistItem,
  connectTasks
} from '../../app.js';
import { html, avatar, member, statusPill, icon, nextStep, situation, STATUS_META, STATUS_ORDER, type Safe } from './dom';
import { wouldCreateCycle } from '../graph';
import type { ViewContext } from './context';

function depRow(t: Task, unlink: { from: string; to: string } | null, editable: boolean) {
  return html`
    <li class="dep-row">
      <button class="dep-open" data-action="open-task" data-id="${t.id}">
        ${statusPill(t.status)}<span class="dep-title">${t.title}</span>
      </button>
      ${editable && unlink
        ? html`<button class="icon-btn" data-action="unlink" data-from="${unlink.from}" data-to="${unlink.to}" title="Remove this link">${icon('close', 14)}</button>`
        : ''}
    </li>`;
}

function taskOptions(candidates: Task[]) {
  return BLOCKS.map(b => {
    const opts = candidates.filter(t => t.blockId === b.id);
    return opts.length
      ? html`<optgroup label="${b.name}">${opts.map(t => html`<option value="${t.id}">${t.title.slice(0, 80)}</option>`)}</optgroup>`
      : '';
  });
}

export function renderDrawer(task: Task, ctx: ViewContext): Safe {
  const ro = !ctx.editable;
  const dis = ro ? 'disabled' : '';
  const block = blockMap[task.blockId];
  const parents = task.dependsOn.map(id => taskMap[id]).filter(Boolean);
  const children = TASKS.filter(t => t.dependsOn.includes(task.id));
  const s = situation(task);
  const step = ro ? null : nextStep(task);
  const mine = task.assignees.includes(ctx.user.id);

  const canBeParent = TASKS.filter(t => t.id !== task.id && !task.dependsOn.includes(t.id) && !wouldCreateCycle(ctx.graph, t.id, task.id));
  const canBeChild = TASKS.filter(t => t.id !== task.id && !t.dependsOn.includes(task.id) && !wouldCreateCycle(ctx.graph, task.id, t.id));
  const epics = [...new Set(TASKS.filter(t => t.blockId === task.blockId).map(t => t.epic).filter(Boolean))];
  const checks = task.checklist ?? [];

  return html`
    <header class="drawer-head">
      <span class="block-dot" style="--c:${block?.color ?? '#64748b'}"></span>
      <span class="drawer-block truncate">${block?.name ?? ''}</span>
      <span class="spacer"></span>
      <button class="icon-btn" data-action="copy-link" data-id="${task.id}" title="Copy a link to this task">${icon('link', 15)}</button>
      <button class="icon-btn" data-action="close-drawer" title="Close">${icon('close', 16)}</button>
    </header>

    <div class="drawer-body">
      <textarea class="title-input" data-field="title" rows="1" ${dis} aria-label="Title">${task.title}</textarea>

      <div class="now tone-${s.tone}">
        <p>${s.text}</p>
        ${step ? html`<button class="btn btn-primary" data-action="advance" data-id="${task.id}" data-status="${step.status}">${step.label}</button>` : ''}
      </div>

      ${ro ? html`<div class="callout"><button class="link" data-action="sign-in">Sign in</button> to change this task.</div>` : ''}

      <section class="drawer-section">
        <h3>Who's on it</h3>
        <div class="chips">
          ${task.assignees.map(id => html`<span class="chip">${avatar(id)} ${member(id).name}${ro ? '' : html`<button class="chip-x" data-action="unassign" data-who="${id}" aria-label="Remove ${member(id).name}">×</button>`}</span>`)}
          ${task.assignees.length ? '' : html`<span class="muted">Nobody yet</span>`}
          ${ro || mine ? '' : html`<button class="btn btn-sm" data-action="claim" data-id="${task.id}">${task.assignees.length ? 'Join' : 'Take it'}</button>`}
        </div>
      </section>

      <section class="drawer-section">
        <h3>Status</h3>
        <div class="segmented" role="radiogroup" aria-label="Status">
          ${STATUS_ORDER.map(st => html`<button role="radio" aria-checked="${st === task.status}" class="seg-btn s-${st} ${st === task.status ? 'is-on' : ''}" data-action="set-status" data-status="${st}" ${dis}><i></i>${STATUS_META[st].label}</button>`)}
        </div>
      </section>

      ${checks.length || !ro ? html`
        <section class="drawer-section">
          <h3>Steps ${checks.length ? html`<span class="muted">${task.completedChecks?.length ?? 0} of ${checks.length} done</span>` : ''}</h3>
          <ul class="checklist">
            ${checks.map((item, i) => html`
              <li>
                <label><input type="checkbox" data-check="${i}" ${task.completedChecks?.includes(i) ? 'checked' : ''} ${dis}/> <span>${item}</span></label>
                ${ro ? '' : html`<button class="icon-btn" data-action="remove-check" data-index="${i}" aria-label="Remove step">${icon('close', 12)}</button>`}
              </li>`)}
          </ul>
          ${ro ? '' : html`<input class="input input-sm" placeholder="Add a step, then press Enter" data-add="check"/>`}
        </section>` : ''}

      <section class="drawer-section">
        <h3>Notes</h3>
        <textarea class="input notes" data-field="note" rows="3" placeholder="Progress, decisions, links to PRs…" ${dis}>${task.note ?? ''}</textarea>
      </section>

      <section class="drawer-section">
        <h3>Has to wait for</h3>
        ${parents.length ? html`<ul class="deps">${parents.map(p => depRow(p, { from: p.id, to: task.id }, ctx.editable))}</ul>` : html`<p class="muted">Nothing. It can start any time.</p>`}
        ${ro ? '' : html`<select class="input input-sm" data-add="parent" aria-label="Add a task this one waits for"><option value="">+ This can't start until…</option>${taskOptions(canBeParent)}</select>`}
      </section>

      <section class="drawer-section">
        <h3>Unlocks</h3>
        ${children.length ? html`<ul class="deps">${children.map(c => depRow(c, { from: task.id, to: c.id }, ctx.editable))}</ul>` : html`<p class="muted">No other task is waiting on this one.</p>`}
        ${ro ? '' : html`<select class="input input-sm" data-add="child" aria-label="Add a task that waits for this one"><option value="">+ Finishing this lets us start…</option>${taskOptions(canBeChild)}</select>`}
      </section>

      <details class="more">
        <summary>More details</summary>
        <dl class="fields">
          <dt>Subsystem</dt>
          <dd><select class="input input-sm" data-field="blockId" ${dis}>
            ${BLOCKS.map(b => html`<option value="${b.id}" ${b.id === task.blockId ? 'selected' : ''}>${b.name}</option>`)}
          </select></dd>
          <dt>Target date</dt>
          <dd><input type="date" class="input input-sm" data-field="endDate" value="${task.endDate ?? ''}" ${dis}/></dd>
          <dt>Group</dt>
          <dd><input class="input input-sm" data-field="epic" list="epicList" value="${task.epic}" ${dis}/>
            <datalist id="epicList">${epics.map(e => html`<option value="${e}"></option>`)}</datalist></dd>
          <dt>Tags</dt>
          <dd>
            <div class="chips">
              ${(task.tags ?? []).map(tag => html`<span class="chip chip-tag">${tag}${ro ? '' : html`<button class="chip-x" data-action="remove-tag" data-tag="${tag}" aria-label="Remove tag ${tag}">×</button>`}</span>`)}
              ${ro ? '' : html`<input class="chip-input" placeholder="Add tag…" data-add="tag" aria-label="Add tag"/>`}
            </div>
          </dd>
          ${ro ? '' : html`
            <dt>Add person</dt>
            <dd><input class="input input-sm" list="crewList" placeholder="Type a name…" data-add="assignee" aria-label="Add a person"/></dd>`}
          <dt>Task ID</dt>
          <dd class="mono muted">${task.id}</dd>
        </dl>
        ${ro ? '' : html`<button class="btn btn-danger-ghost btn-sm" data-action="delete-task" data-id="${task.id}">${icon('trash', 14)} Delete this task</button>`}
      </details>
    </div>
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
