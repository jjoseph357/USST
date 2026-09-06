import { describe, it, expect } from 'vitest';
import { ScheduleTask } from '../../src/types/schedule';
import {
  shiftTask,
  stretchTask,
  addDependency,
  removeDependency,
  getTimelineBounds
} from '../../src/domain/schedule-graph';

const sampleTasks: ScheduleTask[] = [
  {
    id: 'req',
    title: 'Requirements Gathering',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 100,
    dependencies: [],
    assignees: ['Lead'],
  },
  {
    id: 'switch-power',
    title: 'Switch & Power Architecture Design',
    category: 'avionics-hw',
    startDate: '2026-10-01',
    endDate: '2026-10-20',
    progress: 50,
    dependencies: ['req'],
    assignees: ['Power Lead'],
  },
  {
    id: 'hw-freeze',
    title: 'Hardware Design Freeze',
    category: 'milestone',
    startDate: '2026-10-21',
    endDate: '2026-12-31',
    progress: 0,
    dependencies: ['switch-power'],
    assignees: ['All HW'],
  }
];

describe('schedule-graph domain logic', () => {
  it('shifts task dates without dependencies when cascade is false', () => {
    const updated = shiftTask(sampleTasks, 'switch-power', 5, false);
    const target = updated.find(t => t.id === 'switch-power')!;
    expect(target.startDate).toBe('2026-10-06');
    expect(target.endDate).toBe('2026-10-25');

    const downstream = updated.find(t => t.id === 'hw-freeze')!;
    expect(downstream.startDate).toBe('2026-10-21');
  });

  it('cascades shifts forward to dependent tasks when finish-to-start is violated', () => {
    // Shifting switch-power by 30 days pushes its end from Oct 20 to Nov 19.
    // hw-freeze currently starts Oct 21. It should be pushed to Nov 19.
    const updated = shiftTask(sampleTasks, 'switch-power', 30, true);
    const power = updated.find(t => t.id === 'switch-power')!;
    expect(power.startDate).toBe('2026-10-31');
    expect(power.endDate).toBe('2026-11-19');

    const freeze = updated.find(t => t.id === 'hw-freeze')!;
    expect(freeze.startDate).toBe('2026-11-19');
    expect(freeze.endDate).toBe('2027-01-29'); // Original duration preserved
  });

  it('stretches task end date rightwards and cascades to successors', () => {
    // Stretch switch-power end date to Oct 30
    const updated = stretchTask(sampleTasks, 'switch-power', '2026-10-30', 'end', true);
    const power = updated.find(t => t.id === 'switch-power')!;
    expect(power.startDate).toBe('2026-10-01');
    expect(power.endDate).toBe('2026-10-30');

    const freeze = updated.find(t => t.id === 'hw-freeze')!;
    expect(freeze.startDate).toBe('2026-10-30');
  });

  it('stretches task start date leftwards without moving end date', () => {
    const updated = stretchTask(sampleTasks, 'switch-power', '2026-09-25', 'start', true);
    const power = updated.find(t => t.id === 'switch-power')!;
    expect(power.startDate).toBe('2026-09-25');
    expect(power.endDate).toBe('2026-10-20');
  });

  it('detects cycles when adding dependency', () => {
    // req -> switch-power -> hw-freeze
    // Trying to add dependency hw-freeze -> req should detect cycle
    const result = addDependency(sampleTasks, 'hw-freeze', 'req');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cycle detected');
  });

  it('adds valid dependency and adjusts dates if needed', () => {
    const independentTasks: ScheduleTask[] = [
      {
        id: 't1',
        title: 'Task 1',
        category: 'avionics-sw',
        startDate: '2026-09-01',
        endDate: '2026-09-20',
        progress: 0,
        dependencies: [],
        assignees: [],
      },
      {
        id: 't2',
        title: 'Task 2',
        category: 'avionics-sw',
        startDate: '2026-09-10',
        endDate: '2026-09-30',
        progress: 0,
        dependencies: [],
        assignees: [],
      }
    ];

    const result = addDependency(independentTasks, 't1', 't2');
    expect(result.success).toBe(true);
    const t2 = result.tasks.find(t => t.id === 't2')!;
    expect(t2.dependencies).toContain('t1');
    expect(t2.startDate).toBe('2026-09-20'); // Pushed from Sep 10 to Sep 20
  });

  it('removes dependency cleanly', () => {
    const updated = removeDependency(sampleTasks, 'switch-power', 'hw-freeze');
    const freeze = updated.find(t => t.id === 'hw-freeze')!;
    expect(freeze.dependencies).not.toContain('switch-power');
  });

  it('calculates overall timeline bounds accurately', () => {
    const bounds = getTimelineBounds(sampleTasks);
    expect(bounds.minDate).toBe('2026-09-01');
    expect(bounds.maxDate).toBe('2026-12-31');
  });
});
