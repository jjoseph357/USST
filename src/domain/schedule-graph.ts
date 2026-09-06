import { ScheduleTask } from '../types/schedule';
import { addDays, diffDays } from './date-utils';

export function hasCycle(tasks: ScheduleTask[]): boolean {
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    adj.set(t.id, [...t.dependencies]);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      if (dfs(t.id)) return true;
    }
  }

  return false;
}

export function shiftTask(
  tasks: ScheduleTask[],
  taskId: string,
  deltaDays: number,
  cascadeDependencies: boolean = true
): ScheduleTask[] {
  if (deltaDays === 0) return tasks;

  const taskMap = new Map<string, ScheduleTask>(tasks.map(t => [t.id, { ...t }]));
  const target = taskMap.get(taskId);
  if (!target) return tasks;

  target.startDate = addDays(target.startDate, deltaDays);
  target.endDate = addDays(target.endDate, deltaDays);

  if (cascadeDependencies) {
    cascadeForward(taskMap, taskId);
  }

  return Array.from(taskMap.values());
}

export function stretchTask(
  tasks: ScheduleTask[],
  taskId: string,
  newDate: string,
  edge: 'start' | 'end',
  cascadeDependencies: boolean = true
): ScheduleTask[] {
  const taskMap = new Map<string, ScheduleTask>(tasks.map(t => [t.id, { ...t }]));
  const target = taskMap.get(taskId);
  if (!target) return tasks;

  if (edge === 'start') {
    if (newDate > target.endDate) {
      // Ensure start is not after end
      target.startDate = target.endDate;
    } else {
      target.startDate = newDate;
    }
  } else {
    if (newDate < target.startDate) {
      target.endDate = target.startDate;
    } else {
      target.endDate = newDate;
    }
    if (cascadeDependencies) {
      cascadeForward(taskMap, taskId);
    }
  }

  return Array.from(taskMap.values());
}

function cascadeForward(taskMap: Map<string, ScheduleTask>, updatedId: string) {
  const updatedTask = taskMap.get(updatedId);
  if (!updatedTask) return;

  const queue = [updatedId];
  const processed = new Set<string>();

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (processed.has(currId)) continue;
    processed.add(currId);

    const currTask = taskMap.get(currId);
    if (!currTask) continue;

    // Find all tasks that depend on currTask
    for (const [otherId, otherTask] of taskMap.entries()) {
      if (otherTask.dependencies.includes(currId)) {
        if (otherTask.startDate < currTask.endDate) {
          const shiftDelta = diffDays(otherTask.startDate, currTask.endDate);
          otherTask.startDate = addDays(otherTask.startDate, shiftDelta);
          otherTask.endDate = addDays(otherTask.endDate, shiftDelta);
          queue.push(otherId);
        }
      }
    }
  }
}

export function addDependency(
  tasks: ScheduleTask[],
  predecessorId: string,
  successorId: string
): { success: boolean; tasks: ScheduleTask[]; error?: string } {
  if (predecessorId === successorId) {
    return { success: false, tasks, error: 'A task cannot depend on itself.' };
  }

  const taskMap = new Map<string, ScheduleTask>(tasks.map(t => [t.id, { ...t, dependencies: [...t.dependencies] }]));
  const successor = taskMap.get(successorId);
  const predecessor = taskMap.get(predecessorId);

  if (!successor || !predecessor) {
    return { success: false, tasks, error: 'Task not found.' };
  }

  if (successor.dependencies.includes(predecessorId)) {
    return { success: true, tasks }; // Already dependent
  }

  successor.dependencies.push(predecessorId);

  const updatedTasks = Array.from(taskMap.values());
  if (hasCycle(updatedTasks)) {
    return { success: false, tasks, error: 'Cycle detected in dependency graph.' };
  }

  // Adjust successor start date if predecessor finishes after it
  if (successor.startDate < predecessor.endDate) {
    const shiftDelta = diffDays(successor.startDate, predecessor.endDate);
    successor.startDate = addDays(successor.startDate, shiftDelta);
    successor.endDate = addDays(successor.endDate, shiftDelta);
    cascadeForward(taskMap, successorId);
  }

  return { success: true, tasks: Array.from(taskMap.values()) };
}

export function removeDependency(
  tasks: ScheduleTask[],
  predecessorId: string,
  successorId: string
): ScheduleTask[] {
  return tasks.map(t => {
    if (t.id === successorId) {
      return {
        ...t,
        dependencies: t.dependencies.filter(id => id !== predecessorId)
      };
    }
    return t;
  });
}

export function getTimelineBounds(tasks: ScheduleTask[]): { minDate: string; maxDate: string } {
  if (tasks.length === 0) {
    return { minDate: '2026-09-01', maxDate: '2027-08-31' };
  }

  let minDate = tasks[0].startDate;
  let maxDate = tasks[0].endDate;

  for (const t of tasks) {
    if (t.startDate < minDate) minDate = t.startDate;
    if (t.endDate > maxDate) maxDate = t.endDate;
  }

  return { minDate, maxDate };
}
