import { describe, it, expect } from 'vitest';
import type { Task } from '../../app.js';
import {
  buildGraph,
  criticalPath,
  depthOf,
  impactOf,
  layoutGraph,
  wouldCreateCycle,
  DEFAULT_METRICS
} from '../../scheduler/graph';

const task = (id: string, dependsOn: string[] = [], status: Task['status'] = 'todo', blockId = 'a'): Task => ({
  id,
  blockId,
  title: id,
  epic: '',
  status,
  assignees: [],
  dependsOn
});

// A -> B -> C -> D, plus A -> E, and X standalone. B is done.
const sample = [
  task('A', [], 'in-progress'),
  task('B', ['A'], 'done'),
  task('C', ['B']),
  task('D', ['C'], 'todo', 'b'),
  task('E', ['A'], 'todo', 'b'),
  task('X')
];

describe('task graph analysis', () => {
  it('ignores dependencies on tasks outside the set', () => {
    const g = buildGraph([task('A', ['MISSING'])]);
    expect(g.parents.get('A')).toEqual([]);
  });

  it('assigns each task the longest distance from a root', () => {
    const depth = depthOf(buildGraph([...sample, task('F', ['A', 'C'])]));
    expect(depth.get('A')).toBe(0);
    expect(depth.get('C')).toBe(2);
    expect(depth.get('F')).toBe(3);
    expect(depth.get('X')).toBe(0);
  });

  it('counts only unfinished downstream tasks as impact', () => {
    const impact = impactOf(buildGraph(sample));
    expect(impact.get('A')).toBe(3);
    expect(impact.get('C')).toBe(1);
    expect(impact.get('X')).toBe(0);
    expect(impact.get('B')).toBe(0);
  });

  it('finds the longest unfinished chain and skips completed links', () => {
    const tasks = [task('P'), task('Q', ['P']), task('R', ['Q']), task('S', ['P'])];
    expect(criticalPath(buildGraph(tasks))).toEqual(['P', 'Q', 'R']);
    // B is done, so A-B-C-D is not one open chain; the best open chains have two tasks.
    const path = criticalPath(buildGraph(sample));
    expect(path).toHaveLength(2);
    expect(path).not.toContain('B');
  });

  it('rejects links that would close a loop', () => {
    const g = buildGraph(sample);
    expect(wouldCreateCycle(g, 'D', 'A')).toBe(true);
    expect(wouldCreateCycle(g, 'C', 'C')).toBe(true);
    expect(wouldCreateCycle(g, 'X', 'D')).toBe(false);
  });

  it('terminates on cyclic data instead of hanging', () => {
    const g = buildGraph([task('L1', ['L2']), task('L2', ['L1'])]);
    expect(depthOf(g).size).toBe(2);
    expect(criticalPath(g).length).toBeLessThanOrEqual(2);
  });
});

describe('dependency map layout', () => {
  const layout = layoutGraph(sample, ['a', 'b']);

  it('places every task exactly once in its subsystem lane', () => {
    expect(layout.nodes.size).toBe(sample.length);
    expect(layout.nodes.get('D')!.laneId).toBe('b');
    const laneA = layout.lanes.find(l => l.id === 'a')!;
    const a = layout.nodes.get('A')!;
    expect(a.y).toBeGreaterThanOrEqual(laneA.y);
    expect(a.y + DEFAULT_METRICS.nodeHeight).toBeLessThanOrEqual(laneA.y + laneA.height);
  });

  it('draws every edge left to right, including across lanes', () => {
    for (const e of layout.edges) {
      expect(layout.nodes.get(e.to)!.x).toBeGreaterThan(layout.nodes.get(e.from)!.x);
    }
    expect(layout.edges).toContainEqual({ from: 'C', to: 'D' });
  });

  it('never overlaps two nodes', () => {
    const boxes = [...layout.nodes.values()];
    for (const p of boxes) {
      for (const q of boxes) {
        if (p === q) continue;
        const overlap =
          Math.abs(p.x - q.x) < DEFAULT_METRICS.nodeWidth && Math.abs(p.y - q.y) < DEFAULT_METRICS.nodeHeight;
        expect(overlap).toBe(false);
      }
    }
  });

  it('fits the canvas around every node', () => {
    for (const n of layout.nodes.values()) {
      expect(n.x + DEFAULT_METRICS.nodeWidth).toBeLessThanOrEqual(layout.width);
      expect(n.y + DEFAULT_METRICS.nodeHeight).toBeLessThanOrEqual(layout.height);
    }
  });
});
