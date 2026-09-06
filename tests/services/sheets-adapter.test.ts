import { describe, it, expect } from 'vitest';
import {
  parseTasksFromRows,
  tasksToSheetRows,
  parseBacklogFromRows,
  exportTasksToCsv,
  parseTasksFromCsv
} from '../../src/services/sheets-adapter';

describe('sheets-adapter boundary tests', () => {
  const rawScheduleRows: (string | number)[][] = [
    ['Task ID', 'Task Name', 'Category', 'Start Date', 'End Date', 'Progress %', 'Dependencies', 'Assignees', 'Sizing (Terms)', 'Notes', 'Milestone'],
    ['req', 'Requirements Gathering', 'avionics-hw', '2026-09-01', '2026-09-30', 100, '', 'Lead', 0, 'Initial specs', 'No'],
    ['switch-power', 'Switch & Power', 'avionics-hw', '2026-10-01', '2026-10-20', 50, 'req', 'Power Lead', 0, 'Latching switch', 'No'],
    ['hw-freeze', 'Hardware Design Freeze', 'milestone', '2026-10-21', '2026-12-31', 0, 'switch-power', 'All HW', 0, 'PCB spin 1', 'Yes']
  ];

  it('parses Google Sheet 2D rows into typed ScheduleTask objects', () => {
    const tasks = parseTasksFromRows(rawScheduleRows);
    expect(tasks.length).toBe(3);

    const req = tasks[0];
    expect(req.id).toBe('req');
    expect(req.title).toBe('Requirements Gathering');
    expect(req.category).toBe('avionics-hw');
    expect(req.startDate).toBe('2026-09-01');
    expect(req.endDate).toBe('2026-09-30');
    expect(req.progress).toBe(100);
    expect(req.dependencies).toEqual([]);
    expect(req.assignees).toEqual(['Lead']);

    const power = tasks[1];
    expect(power.dependencies).toEqual(['req']);

    const freeze = tasks[2];
    expect(freeze.isMilestone).toBe(true);
  });

  it('serializes typed tasks back into Google Sheets 2D array with headers', () => {
    const tasks = parseTasksFromRows(rawScheduleRows);
    const rows = tasksToSheetRows(tasks);

    expect(rows.length).toBe(4);
    expect(rows[0][0]).toBe('Task ID');
    expect(rows[1][0]).toBe('req');
    expect(rows[2][6]).toBe('req'); // dependency column
    expect(rows[3][10]).toBe('Yes'); // milestone column
  });

  it('parses backlog rows into BacklogItem objects', () => {
    const rawBacklogRows: (string | number)[][] = [
      ['Priority / ID', 'Task Name', 'Subsystem', 'Sizing (Members / Term)', 'Status', 'Notes'],
      ['9', 'Zephyr exploration', 'Software', '2.0', 'in-progress', 'RTOS evaluation'],
      ['4', 'Algo dev (UKF)', 'Software', '1.5', 'not-started', 'Unscented Kalman Filter']
    ];

    const backlog = parseBacklogFromRows(rawBacklogRows);
    expect(backlog.length).toBe(2);
    expect(backlog[0].id).toBe('sw-9');
    expect(backlog[0].sizingTerms).toBe(2.0);
    expect(backlog[0].status).toBe('in-progress');
  });

  it('round-trips tasks via CSV string serialization', () => {
    const originalTasks = parseTasksFromRows(rawScheduleRows);
    const csv = exportTasksToCsv(originalTasks);
    const parsed = parseTasksFromCsv(csv);

    expect(parsed.length).toBe(originalTasks.length);
    expect(parsed[0].title).toBe(originalTasks[0].title);
    expect(parsed[1].dependencies).toEqual(originalTasks[1].dependencies);
  });
});
