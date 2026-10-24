import type { Task } from '../app.js';

export interface TaskGraph {
  byId: Map<string, Task>;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
}

export function buildGraph(tasks: readonly Task[]): TaskGraph {
  const byId = new Map(tasks.map(t => [t.id, t]));
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const t of tasks) {
    parents.set(t.id, []);
    children.set(t.id, []);
  }
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (!byId.has(dep) || dep === t.id) continue;
      parents.get(t.id)!.push(dep);
      children.get(dep)!.push(t.id);
    }
  }
  return { byId, parents, children };
}

const isOpen = (t: Task | undefined) => Boolean(t && t.status !== 'done');

function walk(next: Map<string, string[]>, start: string): Set<string> {
  const seen = new Set<string>();
  const stack = [...(next.get(start) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || id === start) continue;
    seen.add(id);
    stack.push(...(next.get(id) ?? []));
  }
  return seen;
}

export const descendants = (g: TaskGraph, id: string) => walk(g.children, id);
export const ancestors = (g: TaskGraph, id: string) => walk(g.parents, id);

/** Adding "to depends on from" closes a loop when `to` already sits upstream of `from`. */
export function wouldCreateCycle(g: TaskGraph, from: string, to: string): boolean {
  return from === to || ancestors(g, from).has(to);
}

/** Kahn order; tasks caught in a cycle are appended at the end so callers never lose nodes. */
export function topoOrder(g: TaskGraph): string[] {
  const indegree = new Map([...g.parents].map(([id, ps]) => [id, ps.length]));
  const queue = [...g.byId.keys()].filter(id => indegree.get(id) === 0).sort();
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const c of g.children.get(id) ?? []) {
      const d = indegree.get(c)! - 1;
      indegree.set(c, d);
      if (d === 0) queue.push(c);
    }
  }
  const placed = new Set(order);
  return [...order, ...[...g.byId.keys()].filter(id => !placed.has(id)).sort()];
}

export function depthOf(g: TaskGraph): Map<string, number> {
  const depth = new Map<string, number>();
  for (const id of topoOrder(g)) {
    const ps = g.parents.get(id) ?? [];
    depth.set(id, ps.reduce((d, p) => Math.max(d, (depth.get(p) ?? -1) + 1), 0));
  }
  return depth;
}

/** Number of unfinished tasks that transitively wait on each unfinished task. Finished tasks hold nothing up. */
export function impactOf(g: TaskGraph): Map<string, number> {
  const impact = new Map<string, number>();
  for (const id of g.byId.keys()) {
    let n = 0;
    if (!isOpen(g.byId.get(id))) {
      impact.set(id, 0);
      continue;
    }
    for (const d of descendants(g, id)) if (isOpen(g.byId.get(d))) n++;
    impact.set(id, n);
  }
  return impact;
}

/** Longest chain of unfinished tasks: the sequence that sets the earliest possible finish. */
export function criticalPath(g: TaskGraph): string[] {
  const len = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const id of topoOrder(g)) {
    if (!isOpen(g.byId.get(id))) continue;
    let best: string | null = null;
    for (const p of g.parents.get(id) ?? []) {
      if (len.has(p) && (best === null || len.get(p)! > len.get(best)!)) best = p;
    }
    len.set(id, best ? len.get(best)! + 1 : 1);
    prev.set(id, best);
  }
  let end: string | null = null;
  for (const [id, l] of len) if (end === null || l > len.get(end)!) end = id;
  const path: string[] = [];
  for (let cur = end; cur; cur = prev.get(cur) ?? null) path.unshift(cur);
  return path.length > 1 ? path : [];
}

export interface LayoutNode {
  id: string;
  laneId: string;
  column: number;
  x: number;
  y: number;
}

export interface LayoutLane {
  id: string;
  y: number;
  height: number;
}

export interface GraphLayout {
  nodes: Map<string, LayoutNode>;
  lanes: LayoutLane[];
  edges: { from: string; to: string }[];
  width: number;
  height: number;
}

export interface LayoutMetrics {
  nodeWidth: number;
  nodeHeight: number;
  columnGap: number;
  rowGap: number;
  lanePadding: number;
  laneHeader: number;
  gutter: number;
}

export const DEFAULT_METRICS: LayoutMetrics = {
  nodeWidth: 216,
  nodeHeight: 92,
  columnGap: 56,
  rowGap: 14,
  lanePadding: 14,
  laneHeader: 34,
  gutter: 24
};

/**
 * Swimlane per subsystem, column per dependency depth. Depth is global so a
 * cross-subsystem edge still points left to right.
 */
export function layoutGraph(
  tasks: readonly Task[],
  laneOrder: readonly string[],
  m: LayoutMetrics = DEFAULT_METRICS
): GraphLayout {
  const g = buildGraph(tasks);
  const depth = depthOf(g);
  const lanesIds = [
    ...laneOrder.filter(id => tasks.some(t => t.blockId === id)),
    ...[...new Set(tasks.map(t => t.blockId))].filter(id => !laneOrder.includes(id))
  ];
  const maxColumn = Math.max(0, ...depth.values());

  // Order each column by the mean row of its parents to keep edges short and uncrossed.
  const rowIndex = new Map<string, number>();
  const cells = new Map<string, string[][]>();
  for (const laneId of lanesIds) {
    cells.set(laneId, Array.from({ length: maxColumn + 1 }, () => []));
  }
  const byColumn = topoOrder(g).sort((a, b) => depth.get(a)! - depth.get(b)!);
  for (let col = 0; col <= maxColumn; col++) {
    const ids = byColumn.filter(id => depth.get(id) === col);
    const score = (id: string) => {
      const rows = (g.parents.get(id) ?? []).map(p => rowIndex.get(p) ?? 0);
      return rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : Number.MAX_SAFE_INTEGER;
    };
    ids.sort((a, b) => score(a) - score(b) || a.localeCompare(b));
    for (const id of ids) {
      const column = cells.get(g.byId.get(id)!.blockId)![col];
      rowIndex.set(id, column.length);
      column.push(id);
    }
  }

  const nodes = new Map<string, LayoutNode>();
  const lanes: LayoutLane[] = [];
  let y = m.gutter;
  for (const laneId of lanesIds) {
    const columns = cells.get(laneId)!;
    const rows = Math.max(1, ...columns.map(c => c.length));
    const height = m.laneHeader + m.lanePadding * 2 + rows * m.nodeHeight + (rows - 1) * m.rowGap;
    columns.forEach((ids, col) =>
      ids.forEach((id, row) =>
        nodes.set(id, {
          id,
          laneId,
          column: col,
          x: m.gutter + col * (m.nodeWidth + m.columnGap),
          y: y + m.laneHeader + m.lanePadding + row * (m.nodeHeight + m.rowGap)
        })
      )
    );
    lanes.push({ id: laneId, y, height });
    y += height;
  }

  const edges = [...g.children].flatMap(([from, cs]) => cs.map(to => ({ from, to })));
  return {
    nodes,
    lanes,
    edges,
    width: m.gutter * 2 + (maxColumn + 1) * m.nodeWidth + maxColumn * m.columnGap,
    height: y + m.gutter
  };
}
