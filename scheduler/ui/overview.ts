import type { Task } from '../../app.js';
import { BLOCKS, blockMap, getAuditLog, isTaskBlocked, unmetDependencies } from '../../app.js';
import { html, statusPill, avatarStack, dueBadge, daysUntil, formatDate, icon, STATUS_ORDER, STATUS_META, type Safe } from './dom';
import { LAUNCH, isReady, type ViewContext } from './context';

function taskRow(t: Task, trailing: Safe | string = '') {
  const block = blockMap[t.blockId];
  return html`
    <li class="row-item" data-action="open-task" data-id="${t.id}" tabindex="0">
      <span class="block-dot" style="--c:${block?.color ?? '#64748b'}" title="${block?.name ?? ''}"></span>
      <span class="mono id">${t.id}</span>
      <span class="row-title">${t.title}</span>
      <span class="row-meta">${dueBadge(t)}${trailing}</span>
    </li>`;
}

function impactChip(n: number) {
  return n > 0 ? html`<span class="impact" title="${n} open tasks wait on this">unblocks ${n}</span>` : '';
}

function panel(title: string, hint: string, body: Safe, extra: Safe | string = '') {
  return html`
    <section class="panel">
      <header class="panel-head">
        <div><h2>${title}</h2><p class="muted small">${hint}</p></div>
        ${extra}
      </header>
      ${body}
    </section>`;
}

function emptyLine(text: string) {
  return html`<p class="empty-line">${text}</p>`;
}

export function renderOverview(ctx: ViewContext): Safe {
  const tasks = ctx.tasks;
  const open = tasks.filter(t => t.status !== 'done');
  const done = tasks.length - open.length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const days = daysUntil(LAUNCH.date);
  const byImpact = (a: Task, b: Task) => (ctx.impact.get(b.id) ?? 0) - (ctx.impact.get(a.id) ?? 0) || a.id.localeCompare(b.id);

  const counts = {
    ready: tasks.filter(t => t.status === 'todo' && isReady(t)).length,
    doing: tasks.filter(t => t.status === 'in-progress').length,
    testing: tasks.filter(t => t.status === 'testing').length,
    blocked: tasks.filter(t => isTaskBlocked(t)).length,
    done
  };

  const pickup = tasks.filter(t => t.status === 'todo' && isReady(t)).sort(
    (a, b) => Number(a.assignees.length > 0) - Number(b.assignees.length > 0) || byImpact(a, b)
  );
  const bottlenecks = open.filter(t => (ctx.impact.get(t.id) ?? 0) > 0).sort(byImpact).slice(0, 6);
  const hardware = tasks.filter(t => t.status === 'blocked');
  const dated = open.filter(t => t.endDate && daysUntil(t.endDate) <= 21).sort((a, b) => a.endDate!.localeCompare(b.endDate!));
  const mine = ctx.editable ? open.filter(t => t.assignees.includes(ctx.user.id)) : [];

  const kpi = (label: string, value: number, filter: string, tone: string) => html`
    <button class="kpi kpi-${tone}" data-action="go-filter" data-filter="${filter}">
      <span class="kpi-value">${value}</span><span class="kpi-label">${label}</span>
    </button>`;

  const hero = html`
    <section class="hero">
      <div class="hero-main">
        <p class="eyebrow">${icon('rocket', 14)} ${LAUNCH.name} · ${formatDate(LAUNCH.date)}, 2027</p>
        <h1><span class="mono">T-${days}</span> days</h1>
        <div class="readiness">
          <div class="readiness-bar"><span style="width:${pct}%"></span></div>
          <span class="small"><strong>${pct}%</strong> of ${tasks.length} tasks complete · ${open.length} open</span>
        </div>
      </div>
      <div class="kpis">
        ${kpi('Ready to start', counts.ready, 'unblocked', 'ready')}
        ${kpi('In progress', counts.doing, 'in-progress', 'doing')}
        ${kpi('Testing', counts.testing, 'testing', 'testing')}
        ${kpi('Blocked', counts.blocked, 'blocked', 'blocked')}
        ${kpi('Done', counts.done, 'done', 'done')}
      </div>
    </section>`;

  const pickupBody = pickup.length
    ? html`<ul class="rows">${pickup.slice(0, 7).map(t =>
        taskRow(
          t,
          html`${impactChip(ctx.impact.get(t.id) ?? 0)}${
            t.assignees.length
              ? avatarStack(t.assignees)
              : ctx.editable
                ? html`<button class="btn btn-xs" data-action="claim" data-id="${t.id}">Claim</button>`
                : html`<span class="muted small">Open</span>`
          }`
        )
      )}</ul>`
    : emptyLine('Nothing is ready right now. Every open task waits on something.');

  const bottleneckBody = bottlenecks.length
    ? html`<ul class="rows">${bottlenecks.map(t =>
        taskRow(t, html`${impactChip(ctx.impact.get(t.id) ?? 0)}${statusPill(t.status)}${avatarStack(t.assignees, 2)}`)
      )}</ul>`
    : emptyLine('No open task is holding anything else up.');

  const subsystems = html`
    <ul class="subsystems">
      ${BLOCKS.map(b => {
        const bt = tasks.filter(t => t.blockId === b.id);
        const bDone = bt.filter(t => t.status === 'done').length;
        return html`
          <li>
            <button class="subsystem-row" data-action="go-block" data-id="${b.id}">
              <span class="block-dot" style="--c:${b.color}"></span>
              <span class="subsystem-name"><span class="mono muted">${b.code}</span> ${b.name}</span>
              <span class="stack-bar" aria-label="${bDone} of ${bt.length} done">
                ${STATUS_ORDER.map(s => {
                  const n = bt.filter(t => t.status === s).length;
                  return n ? html`<span class="seg s-${s}" style="flex:${n}" title="${n} ${STATUS_META[s].label}"></span>` : '';
                })}
              </span>
              <span class="mono small muted">${bDone}/${bt.length}</span>
            </button>
          </li>`;
      })}
    </ul>
    <div class="legend small muted">${STATUS_ORDER.map(s => html`<span><i class="seg s-${s}"></i>${STATUS_META[s].short}</span>`)}</div>`;

  const criticalBody = ctx.critical.length
    ? html`
        <p class="small muted">The longest chain of unfinished work. Nothing at the end can finish sooner than this sequence, so slips here move the whole schedule.</p>
        <ol class="chain">${ctx.critical.map(
          (id, i) => html`<li><button class="chain-node" data-action="open-task" data-id="${id}">
            <span class="block-dot" style="--c:${blockMap[ctx.graph.byId.get(id)!.blockId]?.color}"></span>
            <span class="mono">${id}</span></button>${i < ctx.critical.length - 1 ? icon('arrow', 12) : ''}</li>`
        )}</ol>
        <button class="btn btn-ghost btn-sm" data-action="go-view" data-view="map">${icon('map', 14)} Open in dependency map</button>`
    : emptyLine('No dependency chains are open.');

  const waitingBody = hardware.length
    ? html`<ul class="rows">${hardware.map(t => taskRow(t, avatarStack(t.assignees, 2)))}</ul>`
    : emptyLine('Nothing is waiting on hardware.');

  const datesBody = dated.length
    ? html`<ul class="rows">${dated.map(t => taskRow(t, avatarStack(t.assignees, 2)))}</ul>`
    : emptyLine('No target dates in the next three weeks. Set one from any task.');

  const mineBody = mine.length
    ? html`<ul class="rows">${mine.map(t => {
        const waits = unmetDependencies(t);
        return taskRow(t, html`${waits.length ? html`<span class="small warn">waits on ${waits.join(', ')}</span>` : ''}${statusPill(t.status)}`);
      })}</ul>`
    : emptyLine('Nothing assigned to you. Claim something from "Start here".');

  const activity = getAuditLog().slice(0, 8);
  const activityBody = html`<ul class="activity">${activity.map(
    e => html`<li><span class="muted small mono">${e.timestamp.slice(5)}</span><span class="small"><strong>${e.actor.replace(/\s*\(.*\)$/, '')}</strong> ${e.action}</span></li>`
  )}</ul>`;

  return html`
    <div class="overview">
      ${hero}
      <div class="grid-2">
        ${panel('Start here', 'Ready, unclaimed first, ranked by how much work each one unblocks.', pickupBody)}
        ${panel('Bottlenecks', 'Open tasks with the most work queued behind them.', bottleneckBody)}
      </div>
      ${ctx.editable ? panel(`Your tasks · ${ctx.user.name}`, `${mine.length} open`, mineBody) : ''}
      <div class="grid-2">
        ${panel('Subsystems', 'Status mix per block. Click to open its tasks.', subsystems)}
        ${panel('Critical path', `${ctx.critical.length} tasks in sequence`, criticalBody)}
      </div>
      <div class="grid-3">
        ${panel('Waiting on hardware', `${hardware.length} tasks`, waitingBody)}
        ${panel('Due soon', 'Overdue or due within 21 days.', datesBody)}
        ${panel('Recent activity', 'Changes made on this device.', activityBody)}
      </div>
    </div>`;
}
