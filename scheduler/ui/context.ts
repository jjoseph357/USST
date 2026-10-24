import type { Task, TeamMember } from '../../app.js';
import { TASKS, BLOCKS, getActiveUser, isTaskBlocked, taskMatchesFilters } from '../../app.js';
import { buildGraph, impactOf, type TaskGraph } from '../graph';

export type ViewName = 'home' | 'board' | 'plan';

export const VIEWS: { id: ViewName; label: string; icon: 'overview' | 'board' | 'map' }[] = [
  { id: 'home', label: 'My work', icon: 'overview' },
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'plan', label: 'Plan', icon: 'map' }
];

export const LAUNCH = { name: 'Launch Canada 2027', date: '2027-08-10' };

/** Everything a view needs for one render, derived once from the store. */
export interface ViewContext {
  tasks: Task[];
  matches: Set<string>;
  graph: TaskGraph;
  impact: Map<string, number>;
  user: TeamMember;
  editable: boolean;
  selectedId: string | null;
}

export function buildContext(selectedId: string | null, editable: boolean): ViewContext {
  const graph = buildGraph(TASKS);
  return {
    tasks: TASKS,
    matches: new Set(TASKS.filter(t => taskMatchesFilters(t)).map(t => t.id)),
    graph,
    impact: impactOf(graph),
    user: getActiveUser(),
    editable,
    selectedId
  };
}

export const isReady = (t: Task) => t.status !== 'done' && !isTaskBlocked(t);

export const blockOrder = () => BLOCKS.map(b => b.id);
