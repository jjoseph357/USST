import type { Task } from '../../app.js';
import { blockMap, activeFilters, isTaskBlocked } from '../../app.js';
import { layoutGraph, ancestors, descendants, DEFAULT_METRICS as M, type GraphLayout } from '../graph';
import { html, raw, avatarStack, dueBadge, icon, subsystemSelect, STATUS_META, type Safe } from './dom';
import { blockOrder, type ViewContext } from './context';
import { prefs, savePrefs } from './prefs';

let lastCtx: ViewContext | null = null;
let lastLayout: GraphLayout | null = null;

/** Tasks drawn on the map: the subsystem filter plus one hop of cross-subsystem context. */
function mapTasks(ctx: ViewContext): { tasks: Task[]; context: Set<string> } {
  let tasks = ctx.tasks.filter(t => prefs.mapShowDone || t.status !== 'done');
  const context = new Set<string>();
  if (activeFilters.blockId !== 'all') {
    const inBlock = new Set(tasks.filter(t => t.blockId === activeFilters.blockId).map(t => t.id));
    for (const id of inBlock) {
      for (const n of [...(ctx.graph.parents.get(id) ?? []), ...(ctx.graph.children.get(id) ?? [])]) {
        if (!inBlock.has(n)) context.add(n);
      }
    }
    tasks = tasks.filter(t => inBlock.has(t.id) || context.has(t.id));
  }
  return { tasks, context };
}

function edgePath(layout: GraphLayout, from: string, to: string) {
  const a = layout.nodes.get(from)!;
  const b = layout.nodes.get(to)!;
  const x1 = a.x + M.nodeWidth;
  const y1 = a.y + M.nodeHeight / 2;
  const x2 = b.x - 6;
  const y2 = b.y + M.nodeHeight / 2;
  const dx = Math.max(28, (x2 - x1) / 2);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function nodeHtml(t: Task, ctx: ViewContext, layout: GraphLayout, isContext: boolean) {
  const n = layout.nodes.get(t.id)!;
  const block = blockMap[t.blockId];
  const impact = ctx.impact.get(t.id) ?? 0;
  const classes = [
    'node',
    `s-${t.status}`,
    t.status !== 'done' && !isTaskBlocked(t) ? 'is-ready' : '',
    isTaskBlocked(t) ? 'is-blocked' : '',
    !ctx.matches.has(t.id) || isContext ? 'is-dim' : '',
    ctx.selectedId === t.id ? 'is-selected' : ''
  ].filter(Boolean).join(' ');

  return html`
    <div class="${classes}" data-node="${t.id}" data-action="open-task" data-id="${t.id}" tabindex="0"
         style="left:${n.x}px;top:${n.y}px;width:${M.nodeWidth}px;height:${M.nodeHeight}px;--c:${block?.color ?? '#64748b'}"
         aria-label="${t.id} ${t.title}, ${STATUS_META[t.status].label}">
      <div class="node-top">
        <span class="mono id">${t.id}</span>
        <span class="node-status"><i></i>${STATUS_META[t.status].label}</span>
      </div>
      <div class="node-title">${t.title}</div>
      <div class="node-foot">
        ${avatarStack(t.assignees, 3)}
        <span class="node-tags">${dueBadge(t)}${impact > 0 ? html`<span class="unblocks" title="Finishing this lets ${impact} other tasks move">unblocks ${impact}</span>` : ''}</span>
      </div>
      ${ctx.editable ? html`<span class="port" data-port="${t.id}" title="Drag onto another task: that task will wait for this one"></span>` : ''}
    </div>`;
}

export function renderMap(ctx: ViewContext): Safe {
  const { tasks, context } = mapTasks(ctx);
  const layout = layoutGraph(tasks, blockOrder());
  lastCtx = ctx;
  lastLayout = layout;
  const z = prefs.mapZoom;

  const lanes = layout.lanes.map(l => {
    const b = blockMap[l.id];
    const laneTasks = tasks.filter(t => t.blockId === l.id && !context.has(t.id));
    const done = laneTasks.filter(t => t.status === 'done').length;
    return html`
      <div class="lane" style="top:${l.y}px;height:${l.height}px;--c:${b?.color ?? '#64748b'}">
        <div class="lane-label">
          <span class="block-dot" style="--c:${b?.color ?? '#64748b'}"></span>
          <strong>${b?.name ?? l.id}</strong>
          <span class="muted small">${done} of ${laneTasks.length} done</span>
          ${ctx.editable && b ? html`<button class="icon-btn" data-action="edit-block" data-id="${b.id}" title="Edit subsystem">${icon('edit', 13)}</button>` : ''}
        </div>
      </div>`;
  });

  const edges = layout.edges.map(e => {
    const src = ctx.graph.byId.get(e.from)!;
    const cls = src.status === 'done' ? 'e-done' : 'e-open';
    const d = edgePath(layout, e.from, e.to);
    const dim = !ctx.matches.has(e.from) && !ctx.matches.has(e.to) ? ' is-dim' : '';
    return raw(
      `<g class="edge ${cls}${dim}" data-from="${e.from}" data-to="${e.to}">` +
        `<path class="edge-line" d="${d}" marker-end="url(#arrow-${cls})"/>` +
        (ctx.editable
          ? `<path class="edge-hit" d="${d}" data-action="unlink" data-from="${e.from}" data-to="${e.to}"><title>Click to remove this arrow</title></path>`
          : '') +
        `</g>`
    );
  });

  const marker = (cls: string) =>
    `<marker id="arrow-${cls}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrow-${cls}"/></marker>`;

  const toolbar = html`
    <div class="toolbar">
      ${subsystemSelect()}
      <label class="toggle"><input type="checkbox" data-pref="mapShowDone" ${prefs.mapShowDone ? 'checked' : ''}/> Show finished tasks</label>
      <span class="spacer"></span>
      ${ctx.editable ? html`<button class="btn btn-ghost btn-sm" data-action="edit-block">${icon('plus', 14)} Add subsystem</button>` : ''}
      <div class="zoom">
        <button class="icon-btn" data-action="zoom" data-step="-0.1" title="Zoom out">${icon('minus', 14)}</button>
        <span class="mono small">${Math.round(z * 100)}%</span>
        <button class="icon-btn" data-action="zoom" data-step="0.1" title="Zoom in">${icon('plus', 14)}</button>
        <button class="icon-btn" data-action="zoom-fit" title="Fit to screen">${icon('fit', 14)}</button>
      </div>
    </div>
    <p class="plan-hint">Each arrow means <strong>“finish this first, then that”</strong>. Work flows left to right. Green-edged tasks are ready to start, dashed ones are waiting. Hover a task to see everything connected to it.${
      ctx.editable ? ' To add an arrow, drag from the dot on a task’s right edge onto another task. Click an arrow to remove it.' : ''
    }</p>`;

  if (!tasks.length) {
    return html`${toolbar}<div class="empty-state"><p>No tasks to draw with the current filters.</p></div>`;
  }

  return html`
    ${toolbar}
    <div class="map-scroll" id="mapScroll">
      <div class="map-spacer" style="width:${layout.width * z}px;height:${layout.height * z}px">
        <div class="map-canvas" id="mapCanvas" style="width:${layout.width}px;height:${layout.height}px;transform:scale(${z})">
          ${lanes}
          <svg class="map-edges" width="${layout.width}" height="${layout.height}" aria-hidden="true">
            <defs>${raw(['e-open', 'e-done'].map(marker).join(''))}</defs>
            ${edges}
            <path class="drag-line" id="dragLine" d=""/>
          </svg>
          ${tasks.map(t => nodeHtml(t, ctx, layout, context.has(t.id)))}
        </div>
      </div>
    </div>
`;
}

function clearTrace(root: HTMLElement) {
  root.querySelector('.map-canvas')?.classList.remove('is-tracing');
  root.querySelectorAll('.is-related').forEach(el => el.classList.remove('is-related'));
}

function trace(root: HTMLElement, id: string) {
  if (!lastCtx) return;
  const related = new Set([id, ...ancestors(lastCtx.graph, id), ...descendants(lastCtx.graph, id)]);
  root.querySelector('.map-canvas')?.classList.add('is-tracing');
  root.querySelectorAll<HTMLElement>('[data-node]').forEach(n => n.classList.toggle('is-related', related.has(n.dataset.node!)));
  root.querySelectorAll<SVGGElement>('.edge').forEach(e =>
    e.classList.toggle('is-related', related.has(e.dataset.from!) && related.has(e.dataset.to!))
  );
}

/** Wires hover tracing, link dragging and pref toggles once on the persistent view root. */
export function bindMap(root: HTMLElement, onLink: (from: string, to: string) => void, rerender: () => void) {
  let tracing: string | null = null;
  root.addEventListener('pointerover', e => {
    const node = (e.target as Element).closest<HTMLElement>('[data-node]');
    const id = node?.dataset.node ?? null;
    if (id === tracing || drag) return;
    tracing = id;
    clearTrace(root);
    if (id) trace(root, id);
  });
  root.addEventListener('pointerleave', () => {
    tracing = null;
    clearTrace(root);
  });

  root.addEventListener('change', e => {
    const input = e.target as HTMLInputElement;
    const key = input.dataset.pref as 'mapShowDone' | undefined;
    if (!key) return;
    prefs[key] = input.checked;
    savePrefs();
    rerender();
  });

  let drag: { from: string; x: number; y: number } | null = null;
  const toCanvas = (e: PointerEvent) => {
    const rect = root.querySelector('#mapCanvas')!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / prefs.mapZoom, y: (e.clientY - rect.top) / prefs.mapZoom };
  };

  root.addEventListener('pointerdown', e => {
    const port = (e.target as Element).closest<HTMLElement>('[data-port]');
    if (!port || !lastLayout) return;
    e.preventDefault();
    e.stopPropagation();
    const n = lastLayout.nodes.get(port.dataset.port!)!;
    drag = { from: n.id, x: n.x + M.nodeWidth, y: n.y + M.nodeHeight / 2 };
    root.querySelector('.map-canvas')?.classList.add('is-linking');
    (e.target as Element).setPointerCapture?.(e.pointerId);
  });

  root.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toCanvas(e);
    const dx = Math.max(28, Math.abs(p.x - drag.x) / 2);
    root.querySelector('#dragLine')?.setAttribute('d', `M${drag.x},${drag.y} C${drag.x + dx},${drag.y} ${p.x - dx},${p.y} ${p.x},${p.y}`);
    root.querySelectorAll('.link-target').forEach(el => el.classList.remove('link-target'));
    document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-node]')?.classList.add('link-target');
  });

  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    const from = drag.from;
    drag = null;
    root.querySelector('#dragLine')?.setAttribute('d', '');
    root.querySelector('.map-canvas')?.classList.remove('is-linking');
    root.querySelectorAll('.link-target').forEach(el => el.classList.remove('link-target'));
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-node]');
    const to = target?.dataset.node;
    if (to && to !== from) onLink(from, to);
  };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  // A port press must not also open the task.
  root.addEventListener('click', e => {
    if ((e.target as Element).closest('[data-port]')) e.stopPropagation();
  }, true);
}

export function fitZoom(root: HTMLElement) {
  const scroll = root.querySelector<HTMLElement>('#mapScroll');
  if (!scroll || !lastLayout) return;
  prefs.mapZoom = Math.max(0.4, Math.min(1, (scroll.clientWidth - 8) / lastLayout.width));
  savePrefs();
}
