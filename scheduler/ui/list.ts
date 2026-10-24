import { BLOCKS, isTaskBlocked, unmetDependencies } from '../../app.js';
import { html, avatarStack, dueBadge, icon, STATUS_META, STATUS_ORDER, type Safe } from './dom';
import type { ViewContext } from './context';

export function renderList(ctx: ViewContext): Safe {
  const groups = BLOCKS.map(b => ({
    block: b,
    tasks: ctx.tasks
      .filter(t => t.blockId === b.id && ctx.matches.has(t.id))
      .sort((a, z) => (ctx.depth.get(a.id) ?? 0) - (ctx.depth.get(z.id) ?? 0) || a.id.localeCompare(z.id))
  })).filter(g => g.tasks.length);

  if (!groups.length) {
    return html`<div class="empty-state"><p>No tasks match these filters.</p><button class="btn" data-action="clear-filters">Clear filters</button></div>`;
  }

  return html`
    <div class="list">
      ${groups.map(({ block, tasks }) => {
        const all = ctx.tasks.filter(t => t.blockId === block.id);
        const done = all.filter(t => t.status === 'done').length;
        return html`
          <section class="list-group" style="--c:${block.color}">
            <header class="list-head">
              <span class="block-dot" style="--c:${block.color}"></span>
              <span class="mono muted">${block.code}</span>
              <h2>${block.name}</h2>
              <span class="muted small">${done}/${all.length} done</span>
              <span class="spacer"></span>
              ${block.repos.map(r => html`<a class="repo" href="${r.url}" target="_blank" rel="noopener">${icon('github', 12)} ${r.name.split('/').pop()}</a>`)}
              ${ctx.editable
                ? html`<button class="icon-btn" data-action="edit-block" data-id="${block.id}" title="Edit subsystem">${icon('edit', 14)}</button>
                       <button class="btn btn-xs" data-action="new-task" data-block="${block.id}">${icon('plus', 12)} Task</button>`
                : ''}
            </header>
            <table class="table">
              <thead><tr><th class="c-status">Status</th><th class="c-id">ID</th><th>Task</th><th class="c-who">Owner</th><th class="c-deps">Waits on</th><th class="c-due">Target</th></tr></thead>
              <tbody>
                ${tasks.map(t => {
                  const waits = unmetDependencies(t);
                  return html`
                    <tr data-action="open-task" data-id="${t.id}" tabindex="0" class="${ctx.selectedId === t.id ? 'is-selected' : ''} ${t.status === 'done' ? 'is-done' : ''}">
                      <td class="c-status">
                        ${ctx.editable
                          ? html`<select class="status-select s-${t.status}" data-status-for="${t.id}" aria-label="Status of ${t.id}">
                              ${STATUS_ORDER.map(s => html`<option value="${s}" ${s === t.status ? 'selected' : ''}>${STATUS_META[s].label}</option>`)}
                            </select>`
                          : html`<span class="status-pill s-${t.status}"><i></i>${STATUS_META[t.status].short}</span>`}
                      </td>
                      <td class="c-id mono">${t.id}</td>
                      <td>
                        <span class="row-title">${t.title}</span>
                        ${ctx.criticalSet.has(t.id) ? html`<span class="crit-flag">critical</span>` : ''}
                        ${(ctx.impact.get(t.id) ?? 0) > 0 ? html`<span class="impact">unblocks ${ctx.impact.get(t.id)}</span>` : ''}
                        <span class="muted small epic">${t.epic}</span>
                      </td>
                      <td class="c-who">${avatarStack(t.assignees)}</td>
                      <td class="c-deps">${
                        waits.length
                          ? waits.map(id => html`<span class="dep-chip">${id}</span>`)
                          : isTaskBlocked(t)
                            ? html`<span class="small warn">hardware</span>`
                            : t.dependsOn.length && t.status !== 'done'
                              ? html`<span class="small ok">ready</span>`
                              : ''
                      }</td>
                      <td class="c-due">${dueBadge(t)}</td>
                    </tr>`;
                })}
              </tbody>
            </table>
          </section>`;
      })}
    </div>`;
}
