import type { Task } from '../../app.js';
import { TEAM_MEMBERS, blockMap } from '../../app.js';
import { html, avatar, member, daysUntil, dueBadge, icon, nextStep, situation, statusPill, timeAgo, type Safe } from './dom';
import { LAUNCH, isReady, type ViewContext } from './context';

export type Setup = 'sign-in' | 'pick-name' | null;

function taskLine(t: Task, action: Safe | string = '') {
  const block = blockMap[t.blockId];
  const s = situation(t);
  return html`
    <li class="line" data-action="open-task" data-id="${t.id}" tabindex="0">
      <span class="line-bar" style="--c:${block?.color ?? '#64748b'}"></span>
      <span class="line-main">
        <span class="line-title">${t.title}</span>
        <span class="line-sub"><span class="tone-${s.tone}">${s.text}</span><span class="muted"> · ${block?.name ?? ''}</span> ${dueBadge(t)}</span>
      </span>
      <span class="line-action">${action}</span>
    </li>`;
}

function stepButton(t: Task, ctx: ViewContext) {
  const step = ctx.editable ? nextStep(t) : null;
  return step
    ? html`<button class="btn btn-sm ${step.status === 'done' ? 'btn-primary' : ''}" data-action="advance" data-id="${t.id}" data-status="${step.status}">${step.label}</button>`
    : '';
}

function section(title: string, hint: string, body: Safe) {
  return html`
    <section class="card-section">
      <header><h2>${title}</h2><p class="muted">${hint}</p></header>
      ${body}
    </section>`;
}

function setupCard(setup: Setup) {
  if (setup === 'sign-in') {
    return html`
      <section class="welcome">
        <div>
          <h2>Welcome to the flight software tracker</h2>
          <p>Anyone can look around. To take a task or update progress, sign in with your Google account.</p>
        </div>
        <button class="btn btn-primary btn-lg" data-action="sign-in">Sign in with Google</button>
      </section>`;
  }
  if (setup === 'pick-name') {
    return html`
      <section class="welcome">
        <div>
          <h2>One more step: which crew member are you?</h2>
          <p>Pick your name once so the site can show your tasks.</p>
        </div>
        <button class="btn btn-primary btn-lg" data-action="identity">Pick my name</button>
      </section>`;
  }
  return '';
}

export function renderHome(ctx: ViewContext, setup: Setup): Safe {
  const tasks = ctx.tasks;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const hasName = ctx.user.id !== 'guest';

  const rank: Record<Task['status'], number> = { 'in-progress': 0, testing: 1, todo: 2, blocked: 3, done: 4 };
  const mine = tasks.filter(t => t.status !== 'done' && t.assignees.includes(ctx.user.id)).sort((a, b) => rank[a.status] - rank[b.status]);

  const byImpact = (a: Task, b: Task) => (ctx.impact.get(b.id) ?? 0) - (ctx.impact.get(a.id) ?? 0) || a.id.localeCompare(b.id);
  const open = tasks.filter(t => t.status === 'todo' && isReady(t) && !t.assignees.length).sort(byImpact);

  const progress = html`
    <section class="progress">
      <div>
        <p class="progress-label">${icon('rocket', 15)} ${LAUNCH.name}</p>
        <p class="progress-big"><strong>${daysUntil(LAUNCH.date)}</strong> days to go</p>
      </div>
      <div class="progress-meter">
        <div class="meter"><span style="width:${pct}%"></span></div>
        <p><strong>${done} of ${tasks.length}</strong> tasks done</p>
      </div>
    </section>`;

  const mineBody = mine.length
    ? html`<ul class="lines">${mine.map(t => taskLine(t, stepButton(t, ctx)))}</ul>`
    : html`<p class="empty">Nothing on your plate. Take one from “Ready to pick up”.</p>`;

  const openBody = open.length
    ? html`<ul class="lines">${open.slice(0, 6).map(t => {
        const unblocks = ctx.impact.get(t.id) ?? 0;
        return taskLine(
          t,
          html`${unblocks ? html`<span class="unblocks" title="Finishing this lets ${unblocks} other tasks move">unblocks ${unblocks}</span>` : ''}${
            ctx.editable ? html`<button class="btn btn-sm" data-action="claim" data-id="${t.id}">Take it</button>` : ''
          }`
        );
      })}</ul>
      ${open.length > 6 ? html`<button class="link" data-action="go-view" data-view="board">See all ${open.length} on the board</button>` : ''}`
    : html`<p class="empty">Nothing is free right now. Every open task has an owner or is waiting on something.</p>`;

  const busy = TEAM_MEMBERS.map(m => ({
    m,
    tasks: tasks.filter(t => (t.status === 'in-progress' || t.status === 'testing') && t.assignees.includes(m.id))
  })).filter(x => x.tasks.length);

  const teamBody = busy.length
    ? html`<ul class="team">${busy.map(({ m, tasks: ts }) => html`
        <li>
          ${avatar(m.id, 'md')}
          <div>
            <strong>${m.name}</strong>
            ${ts.map(t => html`<button class="team-task" data-action="open-task" data-id="${t.id}"><span>${t.title}</span>${t.status === 'testing' ? html`<em>testing</em>` : ''}</button>`)}
          </div>
        </li>`)}</ul>`
    : html`<p class="empty">Nobody has marked anything as in progress yet.</p>`;

  const recent = tasks.filter(t => (t.updatedAt ?? 0) > 0).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).slice(0, 8);
  const recentBody = recent.length
    ? html`<ul class="feed">${recent.map(t => {
        const who = t.updatedBy ? member(t.updatedBy) : null;
        return html`
          <li data-action="open-task" data-id="${t.id}" tabindex="0">
            ${who ? avatar(who.id) : html`<span class="avatar avatar-sm">·</span>`}
            <span><strong>${who?.name ?? 'Someone'}</strong> updated <span class="feed-title">${t.title}</span>
              <span class="feed-meta">${statusPill(t.status)}<span class="muted">${timeAgo(t.updatedAt!)}</span></span></span>
          </li>`;
      })}</ul>`
    : html`<p class="empty">Changes the team makes will show up here.</p>`;

  return html`
    <div class="home">
      ${setupCard(setup)}
      ${progress}
      <div class="home-grid">
        <div class="home-col">
          ${hasName ? section('Your tasks', mine.length ? 'Press the button to move a task to its next step.' : '', mineBody) : ''}
          ${section('Ready to pick up', 'Nobody owns these and nothing is in the way. The ones near the top free up the most other work.', openBody)}
        </div>
        <div class="home-col">
          ${section('What the team is working on', '', teamBody)}
          ${section('Latest changes', '', recentBody)}
        </div>
      </div>
    </div>`;
}
