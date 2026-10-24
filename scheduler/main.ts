/// <reference types="vite/client" />
import type { Task } from '../app.js';
import {
  taskMap,
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
  updateTaskStatus,
  TASKS
} from '../app.js';
import { startSync, onSyncStatus, saveTask, deleteTaskDoc, saveBlock, signInWithGoogle, signOutUser, type SyncStatus } from '../firebase.js';
import { html, mount, icon, avatar, $, STATUS_META, type Safe } from './ui/dom';
import { buildContext, VIEWS, type ViewName } from './ui/context';
import { renderHome, type Setup } from './ui/home';
import { renderMap, bindMap, fitZoom } from './ui/map';
import { renderBoard, bindBoard } from './ui/board';
import { renderDrawer, bindDrawer, autosize } from './ui/drawer';
import { openNewTask, openBlockEditor, openAccount } from './ui/dialogs';
import { toast } from './ui/toast';
import { prefs, savePrefs } from './ui/prefs';

interface Route {
  view: ViewName;
  task: string | null;
}

const OLD_VIEWS: Record<string, ViewName> = { overview: 'home', map: 'plan', list: 'board' };

function parseRoute(): Route {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const view = VIEWS.find(v => v.id === path)?.id ?? OLD_VIEWS[path] ?? 'home';
  const task = new URLSearchParams(query).get('task');
  return { view, task: task && taskMap[task] ? task : null };
}

function routeHref(r: Route) {
  return `#/${r.view}${r.task ? `?task=${encodeURIComponent(r.task)}` : ''}`;
}

let route = parseRoute();
let sync: SyncStatus = { state: 'connecting', user: null, pending: 0, error: null };

// Google sign-in can't run in headless checks, so the dev server lets you edit without it.
const signedIn = () => Boolean(sync.user) || import.meta.env.DEV;

function setup(): Setup {
  if (!signedIn()) return 'sign-in';
  return getActiveUser().id === 'guest' ? 'pick-name' : null;
}

const editable = () => setup() === null;

function navigate(patch: Partial<Route>, replace = false) {
  route = { ...route, ...patch };
  const href = routeHref(route);
  if (replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);
  render();
}

const SAVE_STATE: Partial<Record<SyncStatus['state'], { text: string; tone: string }>> = {
  offline: { text: 'Offline, changes not saved', tone: 'bad' },
  synced: { text: 'All changes saved', tone: 'ok' },
  saving: { text: 'Saving…', tone: 'idle' },
  error: { text: 'Couldn’t save', tone: 'bad' }
};

function renderHeader() {
  const me = getActiveUser();
  const save = SAVE_STATE[sync.state];
  mount(
    $('#tabs'),
    html`${VIEWS.map(v => html`
      <a class="tab ${route.view === v.id ? 'is-on' : ''}" href="${routeHref({ view: v.id, task: route.task })}" ${route.view === v.id ? html`aria-current="page"` : ''}>
        ${icon(v.icon, 16)}<span>${v.label}</span></a>`)}`
  );
  mount(
    $('#headerRight'),
    html`
      ${save ? html`<span class="save-state tone-${save.tone}" title="${sync.error ?? ''}"><i></i><span class="hide-sm">${save.text}</span></span>` : ''}
      ${editable() ? html`<button class="btn btn-primary btn-sm" data-action="new-task">${icon('plus', 14)}<span class="hide-sm">Add task</span></button>` : ''}
      <button class="icon-btn" data-action="theme" title="Switch light or dark">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon', 16)}</button>
      ${!signedIn()
        ? html`<button class="btn btn-sm" data-action="sign-in">Sign in</button>`
        : me.id === 'guest'
          ? html`<button class="btn btn-sm" data-action="identity">${icon('user', 15)} Pick your name</button>`
          : html`<button class="me-btn" data-action="identity" title="Change who you are or sign out">${avatar(me.id)}<span class="hide-sm">${me.name}</span></button>`}`
  );
}

const VIEW_RENDERERS: Record<ViewName, (ctx: ReturnType<typeof buildContext>) => Safe> = {
  home: ctx => renderHome(ctx, setup()),
  board: renderBoard,
  plan: renderMap
};

function render() {
  if (route.task && !taskMap[route.task]) route.task = null;
  const ctx = buildContext(route.task, editable());
  document.body.dataset.view = route.view;
  const viewLabel = VIEWS.find(v => v.id === route.view)!.label;
  document.title = route.task ? `${taskMap[route.task].title} · USST Flight Software` : `${viewLabel} · USST Flight Software`;
  renderHeader();

  // Re-rendering replaces the search box, so put the cursor back where it was.
  const active = document.activeElement as HTMLInputElement | null;
  const refocus = active?.dataset.filter === 'search' ? active.selectionStart : null;
  mount($('#view'), VIEW_RENDERERS[route.view](ctx));
  if (refocus !== null) {
    const search = $<HTMLInputElement>('[data-filter="search"]');
    search?.focus();
    search?.setSelectionRange(refocus, refocus);
  }
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
  const moreOpen = drawer.dataset.task === task.id && drawer.querySelector<HTMLDetailsElement>('details.more')?.open;
  drawer.hidden = false;
  drawer.dataset.task = task.id;
  mount(drawer, renderDrawer(task, ctx));
  if (moreOpen) drawer.querySelector<HTMLDetailsElement>('details.more')!.open = true;
  drawer.querySelectorAll<HTMLTextAreaElement>('.title-input').forEach(autosize);
  const body = drawer.querySelector('.drawer-body');
  if (body) body.scrollTop = scroll;
}

/** Walks someone who can't edit yet through the next setup step. */
function requireEditable() {
  const step = setup();
  if (step === 'sign-in') signIn();
  if (step === 'pick-name') openAccount(sync, { signOut });
  return step === null;
}

function signIn() {
  signInWithGoogle().then(
    () => {
      if (getActiveUser().id === 'guest') openAccount(sync, { signOut });
      else toast(`Signed in. Welcome back, ${getActiveUser().name}.`);
    },
    err => {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
      toast(`Sign-in didn't work: ${err?.message ?? err}`, { tone: 'error' });
    }
  );
}

function signOut() {
  signOutUser().then(() => toast('Signed out. You can still look around.'));
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

function moveTask(id: string, status: Task['status']) {
  const task = taskMap[id];
  if (!task || task.status === status) return;
  // "To do" holds waiting tasks too; dropping one back there shouldn't clear its wait.
  if (status === 'todo' && task.status === 'blocked') return;
  const before = task.status;
  updateTaskStatus(id, status);
  toast(`“${task.title}” is now ${STATUS_META[status].label}`, { undo: () => updateTaskStatus(id, before) });
}

const ACTIONS: Record<string, (el: HTMLElement) => void> = {
  'open-task': el => navigate({ task: el.dataset.id! }),
  'close-drawer': () => navigate({ task: null }),
  'go-view': el => navigate({ view: el.dataset.view as ViewName }),
  'sign-in': () => signIn(),
  identity: () => openAccount(sync, { signOut }),
  advance: el => requireEditable() && moveTask(el.dataset.id!, el.dataset.status as Task['status']),
  claim: el => {
    if (!requireEditable()) return;
    const task = taskMap[el.dataset.id!];
    claimTask(task.id, getActiveUser().id);
    toast(`You took “${task.title}”. It's in Your tasks on My work.`, { undo: () => claimTask(task.id, getActiveUser().id) });
  },
  'new-task': () => {
    if (!requireEditable()) return;
    openNewTask({}, t => {
      toast(`Added “${t.title}”`);
      navigate({ task: t.id });
    });
  },
  'edit-block': el => requireEditable() && openBlockEditor(el.dataset.id ?? null),
  'show-done': () => {
    prefs.boardShowDone = true;
    savePrefs();
    render();
  },
  'clear-filters': () => setFilters({ blockId: 'all', status: 'all', assignee: null, unassignedOnly: false, search: '' }),
  unlink: el => {
    const { from, to } = el.dataset as { from: string; to: string };
    if (disconnectTasks(from, to)) toast('Link removed', { undo: () => connectTasks(from, to) });
  },
  'delete-task': el => {
    const id = el.dataset.id!;
    const removed = deleteTask(id);
    if (!removed) return;
    navigate({ task: null }, true);
    toast(`Deleted “${removed.task.title}”`, { undo: () => restoreTask(removed) });
  },
  'copy-link': el => {
    const url = `${location.origin}${location.pathname}${routeHref({ view: route.view, task: el.dataset.id! })}`;
    navigator.clipboard?.writeText(url).then(() => toast('Link copied. Paste it in Discord to share this task.'), () => toast(url));
  },
  theme: () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    prefs.theme = next;
    savePrefs();
    applyTheme(next);
    renderHeader();
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
  } else if (e.key === 'Escape' && !document.querySelector('dialog[open]')) {
    if (typing) t.blur();
    else if (route.task) navigate({ task: null });
  }
});

window.addEventListener('popstate', () => {
  route = parseRoute();
  render();
});

function onFilter(e: Event) {
  const el = e.target as HTMLInputElement;
  const kind = el.dataset.filter;
  if (kind === 'block') setFilters({ blockId: el.value });
  else if (kind === 'mine') setFilters({ assignee: el.checked ? getActiveUser().id : null, unassignedOnly: false });
  else if (kind === 'search' && e.type === 'input') setFilters({ search: el.value });
}

function boot() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme);

  const view = $('#view')!;
  bindMap(view, (from, to) => {
    if (connectTasks(from, to)) {
      toast(`“${taskMap[to].title}” now waits for “${taskMap[from].title}”`, { undo: () => disconnectTasks(from, to) });
    }
  }, render);
  bindBoard(view, moveTask);
  view.addEventListener('change', onFilter);
  view.addEventListener('input', onFilter);
  bindDrawer($('#drawer')!, () => route.task);
  $('#scrim')!.addEventListener('click', () => navigate({ task: null }));

  onStoreMessage(message => toast(message, { tone: 'error' }));
  subscribe(render);
  setRemote({ saveTask, deleteTask: deleteTaskDoc, saveBlock });
  onSyncStatus(next => {
    const failed = next.error && next.error !== sync.error;
    const authChanged = Boolean(next.user) !== Boolean(sync.user);
    sync = next;
    if (authChanged) render();
    else renderHeader();
    if (failed) toast(`Your last change didn't save: ${next.error}`, { tone: 'error' });
  });
  startSync({ onTasks: applyRemoteTasks, onBlocks: applyRemoteBlocks, seedTasks: () => TASKS });

  history.replaceState(null, '', routeHref(route));
  render();
}

boot();
