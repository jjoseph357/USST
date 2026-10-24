import type { Task, TaskStatus, TeamMember } from '../../app.js';
import { memberMap } from '../../app.js';

/** Markup that is already safe. Only `html` and `raw` produce it. */
export class Safe {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

export const raw = (markup: string) => new Safe(markup);

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderValue(v: unknown): string {
  if (v instanceof Safe) return v.value;
  if (Array.isArray(v)) return v.map(renderValue).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
}

/** Tagged template that escapes every interpolation unless it is already `Safe`. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): Safe {
  let out = strings[0];
  values.forEach((v, i) => {
    out += renderValue(v) + strings[i + 1];
  });
  return new Safe(out);
}

export function mount(el: Element | null, content: Safe) {
  if (el) el.innerHTML = content.value;
}

export const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);

export interface StatusMeta {
  label: string;
  short: string;
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  todo: { label: 'Backlog', short: 'Backlog' },
  'in-progress': { label: 'In progress', short: 'Doing' },
  testing: { label: 'Testing & verify', short: 'Testing' },
  blocked: { label: 'Waiting on hardware', short: 'Waiting' },
  done: { label: 'Done', short: 'Done' }
};

export const STATUS_ORDER: TaskStatus[] = ['todo', 'blocked', 'in-progress', 'testing', 'done'];

export function statusPill(status: TaskStatus) {
  return html`<span class="status-pill s-${status}"><i></i>${STATUS_META[status].label}</span>`;
}

export function member(id: string): TeamMember {
  return (
    memberMap[id] ?? {
      id,
      name: id,
      handle: id,
      role: 'External',
      avatar: id.slice(0, 1).toUpperCase(),
      color: '#64748b',
      flair: ''
    }
  );
}

export function avatar(id: string, size: 'sm' | 'md' | 'lg' = 'sm') {
  const m = member(id);
  return html`<span class="avatar avatar-${size}" style="--c:${m.color}" title="${m.name}">${m.avatar}</span>`;
}

export function avatarStack(ids: readonly string[], max = 3) {
  if (!ids.length) return html`<span class="muted small">Unassigned</span>`;
  const extra = ids.length - max;
  return html`<span class="avatar-stack">${ids.slice(0, max).map(id => avatar(id))}${
    extra > 0 ? html`<span class="avatar avatar-sm avatar-more">+${extra}</span>` : ''
  }</span>`;
}

const DAY = 86_400_000;

export function daysUntil(isoDate: string, today = new Date()): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - now) / DAY);
}

export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function dueBadge(task: Task) {
  if (!task.endDate || task.status === 'done') return '';
  const days = daysUntil(task.endDate);
  const tone = days < 0 ? 'overdue' : days <= 14 ? 'soon' : 'later';
  const text = days < 0 ? `${-days}d overdue` : days === 0 ? 'Due today' : `Due ${formatDate(task.endDate)}`;
  return html`<span class="due due-${tone}" title="Target ${task.endDate}">${text}</span>`;
}

export function icon(name: keyof typeof ICONS, size = 16) {
  return raw(
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`
  );
}

const ICONS = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  map: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6h9M6.5 8.2l4.2 7.6M17.5 8.2l-4.2 7.6"/>',
  board: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5-2.6-.5-5.4-.5-8 0C6 2 5 2 5 2c-.3 1.2-.3 2.4 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.8 1.7-.2.6-.2 1.2-.2 1.8v4"/><path d="M9 18c-4.5 2-5-2-7-2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
} as const;
