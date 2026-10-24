import { describe, it, expect } from 'vitest';
import type { Task } from '../../app.js';
import { taskMap } from '../../app.js';
import { nextStep, situation } from '../../scheduler/ui/dom';

const task = (patch: Partial<Task>): Task => ({ id: 'T-1', blockId: 'block-1', title: 'Probe', epic: '', status: 'todo', assignees: [], dependsOn: [], ...patch });

describe('next step and situation', () => {
  it('walks a task forward one stage at a time', () => {
    expect(nextStep(task({ status: 'todo' }))?.status).toBe('in-progress');
    expect(nextStep(task({ status: 'in-progress' }))?.status).toBe('testing');
    expect(nextStep(task({ status: 'testing' }))?.status).toBe('done');
    expect(nextStep(task({ status: 'blocked' }))?.status).toBe('todo');
    expect(nextStep(task({ status: 'done' }))).toBeNull();
  });

  it('offers no Start button and names the blocker when a prerequisite is unfinished', () => {
    const open = Object.values(taskMap).find(t => t.status !== 'done')!;
    const waiting = task({ dependsOn: [open.id] });
    expect(nextStep(waiting)).toBeNull();
    expect(situation(waiting)).toEqual({ text: `Can't start yet. Needs “${open.title}” first`, tone: 'wait' });
  });

  it('says a task with no open prerequisites is ready', () => {
    expect(situation(task({}))).toEqual({ text: 'Ready to start', tone: 'ok' });
  });
});
