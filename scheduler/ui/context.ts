import type { Task, TeamMember } from '../../app.js';
import { TASKS, BLOCKS, canEdit, getActiveUser, isTaskBlocked, taskMatchesFilters } from '../../app.js';
import { buildGraph, criticalPath, depthOf, impactOf, type TaskGraph } from '../graph';

export type ViewName = 'overview' | 'map' | 'board' | 'list';

export const VIEWS: { id: ViewName; label: string; icon: 'overview' | 'map' | 'board' | 'list'; key: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'overview', key: '1' },
  { id: 'map', label: 'Dependency map', icon: 'map', key: '2' },
  { id: 'board', label: 'Board', icon: 'board', key: '3' },
  { id: 'list', label: 'List', icon: 'list', key: '4' }
];

export const LAUNCH = { name: 'Launch Canada 2027', date: '2027-08-10' };

/** Everything a view needs for one render, derived once from the store. */
export interface ViewContext {
  tasks: Task[];
  matches: Set<string>;
  graph: TaskGraph;
  impact: Map<string, number>;
  depth: Map<string, number>;
  critical: string[];
  criticalSet: Set<string>;
  user: TeamMember;
  editable: boolean;
  selectedId: string | null;
}

export function buildContext(selectedId: string | null): ViewContext {
  const graph = buildGraph(TASKS);
  const critical = criticalPath(graph);
  return {
    tasks: TASKS,
    matches: new Set(TASKS.filter(t => taskMatchesFilters(t)).map(t => t.id)),
    graph,
    impact: impactOf(graph),
    depth: depthOf(graph),
    critical,
    criticalSet: new Set(critical),
    user: getActiveUser(),
    editable: canEdit(),
    selectedId
  };
}

export const isReady = (t: Task) => t.status !== 'done' && !isTaskBlocked(t);

export const blockOrder = () => BLOCKS.map(b => b.id);
