import type { Task } from '../app.js';
import {
  BLOCKS,
  TASKS,
  TEAM_MEMBERS,
  taskMap,
  activeFilters,
  setFilters,
  subscribe,
  onStoreMessage,
  setRemote,
  applyRemoteTasks,
  applyRemoteBlocks,
  getActiveUser,
  claimTask,
  connectTasks,
  disconnectTasks,
  deleteTask,
  restoreTask,
  updateTaskStatus
} from '../app.js';
import { startSync, onSyncStatus, saveTask, deleteTaskDoc, saveBlock, signInWithGoogle, signOutUser, type SyncStatus } from '../firebase.js';
import { html, mount, icon, avatar, $, daysUntil, type Safe } from './ui/dom';
import { buildContext, VIEWS, LAUNCH, type ViewName } from './ui/context';
import { renderOverview } from './ui/overview';
import { renderMap, bindMap, fitZoom } from './ui/map';
import { renderBoard, bindBoard } from './ui/board';
import { renderList } from './ui/list';
import { renderDrawer, bindDrawer, autosize } from './ui/drawer';
import { openNewTask, openBlockEditor, openIdentity } from './ui/dialogs';
import { toast } from './ui/toast';
import { prefs, savePrefs } from './ui/prefs';

interface Route {
  view: ViewName;
  task: string | null;
}

function parseRoute(): Route {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const view = (VIEWS.find(v => v.id === path)?.id ?? 'overview') as ViewName;
  const task = new URLSearchParams(query).get('task');
  return { view, task: task && taskMap[task] ? task : null };
}

function routeHref(r: Route) {
  return `#/${r.view}${r.task ? `?task=${encodeURIComponent(r.task)}` : ''}`;
}

let route = parseRoute();
let sync: SyncStatus = { state: 'connecting', user: null, pending: 0, error: null };

function navigate(patch: Partial<Route>, replace = false) {
  route = { ...route, ...patch };
  const href = routeHref(route);
  if (replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);
  render();
}


const SYNC_LABEL: Record<SyncStatus['state'], { text: string; tone: string; hint: string }> = {
  offline: { text: 'Offline', tone: 'bad', hint: 'Cloud sync is unreachable. Changes stay in this browser.' },
  connecting: { text: 'Connecting…', tone: 'idle', hint: 'Loading the shared board.' },
  live: { text: 'Live · not signed in', tone: 'warn', hint: 'You see live data, but your edits stay in this browser until you sign in.' },
  synced: { text: 'Saved', tone: 'ok', hint: 'All changes are saved to the shared board.' },
  saving: { text: 'Saving…', tone: 'idle', hint: 'Sending changes to the shared board.' },
  error: { text: 'Not saved', tone: 'bad', hint: 'The last change was rejected. Click for details.' }
};

function renderHeader() {
  const me = getActiveUser();
  const s = SYNC_LABEL[sync.state];
  mount(
    $('#headerRight'),
    html`
      <span class="launch-chip hide-sm" title="${LAUNCH.name} begins ${LAUNCH.date}">${icon('rocket', 13)} <span class="mono">T-${daysUntil(LAUNCH.date)}d</span></span>
      <button class="sync-chip tone-${s.tone}" data-action="identity" title="${sync.error ?? s.hint}"><i></i><span class="hide-sm">${s.text}</span></button>
      <button class="icon-btn" data-action="theme" title="Toggle theme">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon', 16)}</button>
      <button class="me-btn" data-action="identity" title="Who you are on the crew">
        ${me.id === 'guest' ? html`${icon('user', 16)}<span class="hide-sm">Who are you?</span>` : html`${avatar(me.id, 'sm')}<span class="hide-sm">${me.name}</span>`}
      </button>
      ${me.id !== 'guest' ? html`<button class="btn btn-primary btn-sm" data-action="new-task" title="New task (N)">${icon('plus', 14)}<span class="hide-sm">New task</span></button>` : ''}`
  );
}

function renderSidebar() {
  const open = (pred: (t: Task) => boolean) => TASKS.filter(t => t.status !== 'done' && pred(t)).length;
  mount(
    $('#sidebar'),
    html`
      <nav class="nav" aria-label="Views">
        ${VIEWS.map(v => html`
          <a class="nav-item ${route.view === v.id ? 'is-on' : ''}" href="${routeHref({ view: v.id, task: route.task })}" ${route.view === v.id ? html`aria-current="page"` : ''}>
            ${icon(v.icon, 16)}<span>${v.label}</span><kbd>${v.key}</kbd></a>`)}
      </nav>
      <div class="side-section">
        <div class="side-head"><span>Subsystems</span>${getActiveUser().id !== 'guest' ? html`<button class="icon-btn" data-action="edit-block" title="New subsystem">${icon('plus', 13)}</button>` : ''}</div>
        <button class="side-item ${activeFilters.blockId === 'all' ? 'is-on' : ''}" data-action="filter-block" data-id="all"><span class="block-dot" style="--c:var(--muted)"></span><span>All subsystems</span><span class="count">${open(() => true)}</span></button>
        ${BLOCKS.map(b => html`
          <button class="side-item ${activeFilters.blockId === b.id ? 'is-on' : ''}" data-action="filter-block" data-id="${b.id}" title="${b.subtitle}">
            <span class="block-dot" style="--c:${b.color}"></span><span class="truncate">${b.name}</span><span class="count">${open(t => t.blockId === b.id)}</span></button>`)}
      </div>
      <div class="side-section">
        <div class="side-head"><span>Crew</span><span class="muted small">open</span></div>
        ${TEAM_MEMBERS.map(m => html`
          <button class="side-item ${activeFilters.assignee === m.id ? 'is-on' : ''}" data-action="filter-person" data-id="${m.id}" title="${m.role} · ${m.flair}">
            ${avatar(m.id)}<span class="truncate">${m.name}</span><span class="count">${open(t => t.assignees.includes(m.id))}</span></button>`)}
      </div>`
  );
}

const PRESETS: { id: string; label: string; apply: () => Partial<typeof activeFilters> }[] = [
  { id: 'all', label: 'All', apply: () => ({ status: 'all', assignee: null, unassignedOnly: false }) },
  { id: 'mine', label: 'Mine', apply: () => ({ status: 'all', assignee: getActiveUser().id, unassignedOnly: false }) },
  { id: 'pickup', label: 'Up for grabs', apply: () => ({ status: 'unblocked', assignee: null, unassignedOnly: true }) },
  { id: 'unblocked', label: 'Ready', apply: () => ({ status: 'unblocked', assignee: null, unassignedOnly: false }) },
  { id: 'blocked', label: 'Blocked', apply: () => ({ status: 'blocked', assignee: null, unassignedOnly: false }) }
];

function activePreset() {
  return PRESETS.find(p => {
    const want = p.apply();
    return want.status === activeFilters.status && want.assignee === activeFilters.assignee && want.unassignedOnly === activeFilters.unassignedOnly;
  })?.id;
}

function renderFilterBar(matchCount: number) {
  const bar = $('#filterbar')!;
  bar.hidden = route.view === 'overview';
  if (bar.hidden) return;
  const preset = activePreset();
  const isDefault = activeFilters.blockId === 'all' && preset === 'all' && !activeFilters.search;
  const block = BLOCKS.find(b => b.id === activeFilters.blockId);
  const person = activeFilters.assignee ? TEAM_MEMBERS.find(m => m.id === activeFilters.assignee) : null;

  const search = $<HTMLInputElement>('#search', bar);
  if (!search) {
    mount(
      bar,
      html`
        <label class="search">${icon('search', 15)}<input id="search" type="search" placeholder="Search tasks, tags, people…" autocomplete="off"/><kbd>/</kbd></label>
        <div class="presets" role="group" aria-label="Quick filters" id="presets"></div>
        <div class="filter-chips" id="filterChips"></div>`
    );
  }
  mount(
    $('#presets', bar),
    html`${PRESETS.filter(p => p.id !== 'mine' || getActiveUser().id !== 'guest').map(
      p => html`<button class="preset ${preset === p.id ? 'is-on' : ''}" data-action="preset" data-id="${p.id}">${p.label}</button>`
    )}`
  );
  mount(
    $('#filterChips', bar),
    html`
      ${block ? html`<span class="fchip" style="--c:${block.color}"><span class="block-dot" style="--c:${block.color}"></span>${block.name}<button data-action="filter-block" data-id="all" aria-label="Clear subsystem filter">×</button></span>` : ''}
      ${person && preset !== 'mine' ? html`<span class="fchip">${avatar(person.id)}${person.name}<button data-action="filter-person" data-id="${person.id}" aria-label="Clear person filter">×</button></span>` : ''}
      <span class="muted small">${matchCount} of ${TASKS.length}</span>
      ${isDefault ? '' : html`<button class="link small" data-action="clear-filters">Clear</button>`}`
  );
}

function renderGuestBanner() {
  const el = $('#banner')!;
  const show = getActiveUser().id === 'guest' && !prefs.dismissedGuestBanner;
  el.hidden = !show;
  if (show) {
    mount(
      el,
      html`<span>You're viewing as a guest. <button class="link" data-action="identity">Tell us who you are</button> to claim tasks, update status, and link work.</span>
        <button class="icon-btn" data-action="dismiss-banner" aria-label="Dismiss">${icon('close', 14)}</button>`
    );
  }
}


const VIEW_RENDERERS: Record<ViewName, (ctx: ReturnType<typeof buildContext>) => Safe> = {
  overview: renderOverview,
  map: renderMap,
  board: renderBoard,
  list: renderList
};

function render() {
  if (route.task && !taskMap[route.task]) route.task = null;
  const ctx = buildContext(route.task);
  document.body.dataset.view = route.view;
  document.title = route.task ? `${route.task} · USST Flight Software` : `${VIEWS.find(v => v.id === route.view)!.label} · USST Flight Software`;
  renderHeader();
  renderSidebar();
  renderGuestBanner();
  renderFilterBar(ctx.matches.size);
  mount($('#view'), VIEW_RENDERERS[route.view](ctx));
  renderDrawerPanel(ctx);
}

function renderDrawerPanel(ctx: ReturnType<typeof buildContext>) {
  const drawer = $('#drawer')!;
  const scrim = $('#scrim')!;
  const task = route.task ? taskMap[route.task] : null;
  document.body.classList.toggle('has-drawer', Boolean(task));
  scrim.hidden = !task;
  if (!task) {
    drawer.hidden = true;
    delete drawer.dataset.task;
    return;
  }
  // Don't yank a field out from under someone who is typing in it.
  const active = document.activeElement as HTMLElement | null;
  const typing = active && drawer.contains(active) && active.matches('input:not([type=checkbox]):not([type=date]), textarea');
  if (typing && drawer.dataset.task === task.id) return;
  const scroll = drawer.querySelector('.drawer-body')?.scrollTop ?? 0;
  drawer.hidden = false;
  drawer.dataset.task = task.id;
  mount(drawer, renderDrawer(task, ctx));
  drawer.querySelectorAll<HTMLTextAreaElement>('.title-input').forEach(autosize);
  const body = drawer.querySelector('.drawer-body');
  if (body) body.scrollTop = scroll;
}


function requireIdentity() {
  if (getActiveUser().id !== 'guest') return true;
  openIdentity(sync, syncActions);
  return false;
}

function unlinkWithUndo(from: string, to: string) {
  if (disconnectTasks(from, to)) toast(`Removed link ${from} → ${to}`, { undo: () => connectTasks(from, to) });
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

const ACTIONS: Record<string, (el: HTMLElement) => void> = {
  'open-task': el => navigate({ task: el.dataset.id! }),
  'close-drawer': () => navigate({ task: null }),
  'go-view': el => navigate({ view: el.dataset.view as ViewName }),
  'go-block': el => {
    setFilters({ blockId: el.dataset.id! });
    navigate({ view: 'list' });
  },
  'go-filter': el => {
    const f = el.dataset.filter!;
    setFilters({ blockId: 'all', search: '', assignee: null, unassignedOnly: false, status: f });
    navigate({ view: f === 'done' || f === 'in-progress' || f === 'testing' ? 'board' : 'list' });
  },
  'filter-block': el => setFilters({ blockId: activeFilters.blockId === el.dataset.id ? 'all' : el.dataset.id! }),
  'filter-person': el => setFilters({ assignee: activeFilters.assignee === el.dataset.id ? null : el.dataset.id!, unassignedOnly: false }),
  preset: el => setFilters(PRESETS.find(p => p.id === el.dataset.id)!.apply()),
  'clear-filters': () => {
    setFilters({ blockId: 'all', status: 'all', assignee: null, unassignedOnly: false, search: '' });
    const s = $<HTMLInputElement>('#search');
    if (s) s.value = '';
  },
  claim: el => requireIdentity() && claimTask(el.dataset.id!, getActiveUser().id),
  'new-task': el => {
    if (!requireIdentity()) return;
    openNewTask({ blockId: el.dataset.block, status: el.dataset.status as Task['status'] | undefined }, t => {
      toast(`Created ${t.id}`);
      navigate({ task: t.id });
    });
  },
  'edit-block': el => requireIdentity() && openBlockEditor(el.dataset.id ?? null),
  identity: () => openIdentity(sync, syncActions),
  unlink: el => unlinkWithUndo(el.dataset.from!, el.dataset.to!),
  'delete-task': el => {
    const id = el.dataset.id!;
    const removed = deleteTask(id);
    if (!removed) return;
    navigate({ task: null }, true);
    toast(`Deleted ${id}`, { undo: () => restoreTask(removed) });
  },
  'copy-link': el => {
    const url = `${location.origin}${location.pathname}${routeHref({ view: route.view, task: el.dataset.id! })}`;
    navigator.clipboard?.writeText(url).then(() => toast('Link copied'), () => toast(url));
  },
  theme: () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    prefs.theme = next;
    savePrefs();
    applyTheme(next);
    renderHeader();
  },
  'dismiss-banner': () => {
    prefs.dismissedGuestBanner = true;
    savePrefs();
    renderGuestBanner();
  },
  zoom: el => {
    prefs.mapZoom = Math.round(Math.max(0.4, Math.min(1.6, prefs.mapZoom + Number(el.dataset.step))) * 10) / 10;
    savePrefs();
    render();
  },
  'zoom-fit': () => {
    fitZoom($('#view')!);
    render();
  }
};

document.addEventListener('click', e => {
  const target = e.target as HTMLElement;
  const el = target.closest<HTMLElement>('[data-action]');
  if (!el) return;
  // Form controls inside a clickable row keep their own behaviour.
  const control = target.closest('select, input, textarea, label, a[href]');
  if (control && el.contains(control) && control !== el) return;
  const action = ACTIONS[el.dataset.action!];
  if (!action) return;
  e.preventDefault();
  action(el);
});

document.addEventListener('keydown', e => {
  const t = e.target as HTMLElement;
  const typing = t.matches('input, textarea, select, [contenteditable]');
  if (e.key === 'Enter' && !typing && t.dataset.action === 'open-task') {
    e.preventDefault();
    ACTIONS['open-task'](t);
    return;
  }
  if (e.key === 'Escape' && !document.querySelector('dialog[open]')) {
    if (typing) t.blur();
    else if (route.task) navigate({ task: null });
    return;
  }
  if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
  const view = VIEWS.find(v => v.key === e.key);
  if (view) navigate({ view: view.id });
  else if (e.key === '/') {
    e.preventDefault();
    if (route.view === 'overview') navigate({ view: 'list' });
    $<HTMLInputElement>('#search')?.focus();
  } else if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    ACTIONS['new-task'](document.body);
  }
});

window.addEventListener('popstate', () => {
  route = parseRoute();
  render();
});


const syncActions = {
  signIn: () =>
    signInWithGoogle().then(
      () => toast('Signed in. Your changes now save for the whole team.'),
      err => {
        if (err?.code === 'auth/popup-closed-by-user') return;
        toast(`Sign-in failed: ${err?.code === 'auth/operation-not-allowed' ? 'Google sign-in is not enabled for this Firebase project yet.' : err?.message ?? err}`, { tone: 'error' });
      }
    ),
  signOut: () => signOutUser().then(() => toast('Signed out. Edits now stay in this browser.'))
};

function boot() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme);

  const view = $('#view')!;
  bindMap(view, (from, to) => {
    if (connectTasks(from, to)) toast(`Linked ${from} → ${to}`, { undo: () => disconnectTasks(from, to) });
  }, render);
  bindBoard(view, (id, status) => updateTaskStatus(id, status), () => {
    savePrefs();
    render();
  });
  view.addEventListener('change', e => {
    const sel = e.target as HTMLSelectElement;
    if (sel.dataset.statusFor) updateTaskStatus(sel.dataset.statusFor, sel.value as Task['status']);
  });
  bindDrawer($('#drawer')!, () => route.task);
  $('#scrim')!.addEventListener('click', () => navigate({ task: null }));
  $('#filterbar')!.addEventListener('input', e => {
    const input = e.target as HTMLInputElement;
    if (input.id === 'search') setFilters({ search: input.value });
  });

  onStoreMessage(message => toast(message, { tone: 'error' }));
  subscribe(render);
  setRemote({ saveTask, deleteTask: deleteTaskDoc, saveBlock });
  onSyncStatus(next => {
    const failed = next.error && next.error !== sync.error;
    sync = next;
    renderHeader();
    if (failed) toast(`Couldn't save to the shared board: ${next.error}`, { tone: 'error' });
  });
  startSync({ onTasks: applyRemoteTasks, onBlocks: applyRemoteBlocks, seedTasks: () => TASKS });

  history.replaceState(null, '', routeHref(route));
  render();
}

boot();
