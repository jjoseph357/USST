import { ScheduleTask, TaskCategory, BacklogItem, TaskStatus } from '../types/schedule';

export const SCHEDULE_HEADERS = [
  'Task ID',
  'Task Name',
  'Category',
  'Start Date',
  'End Date',
  'Progress %',
  'Dependencies',
  'Assignees',
  'Sizing (Terms)',
  'Notes',
  'Milestone'
];

export const BACKLOG_HEADERS = [
  'Priority / ID',
  'Task Name',
  'Subsystem',
  'Sizing (Members / Term)',
  'Status',
  'Notes'
];

export function parseTasksFromRows(rows: (string | number)[][]): ScheduleTask[] {
  if (!rows || rows.length < 2) return [];

  // Assume row 0 is header
  const tasks: ScheduleTask[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    const id = String(row[0]).trim();
    const title = String(row[1] || '').trim();
    const rawCategory = String(row[2] || 'avionics-hw').trim().toLowerCase() as TaskCategory;
    const category: TaskCategory = isValidCategory(rawCategory) ? rawCategory : 'avionics-hw';
    const startDate = normalizeDateString(row[3]);
    const endDate = normalizeDateString(row[4]);
    const progress = Math.min(100, Math.max(0, Number(row[5]) || 0));

    const dependencies = row[6]
      ? String(row[6]).split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const assignees = row[7]
      ? String(row[7]).split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const sizing = row[8] !== undefined && row[8] !== '' ? Number(row[8]) : undefined;
    const notes = String(row[9] || '').trim();
    const milestoneStr = String(row[10] || '').trim().toLowerCase();
    const isMilestone = milestoneStr === 'yes' || milestoneStr === 'true' || milestoneStr === '1';

    tasks.push({
      id,
      title: title || id,
      category,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      progress,
      dependencies,
      assignees,
      sizing,
      notes,
      isMilestone
    });
  }

  return tasks;
}

export function tasksToSheetRows(tasks: ScheduleTask[]): (string | number)[][] {
  const rows: (string | number)[][] = [SCHEDULE_HEADERS];

  for (const t of tasks) {
    rows.push([
      t.id,
      t.title,
      t.category,
      t.startDate,
      t.endDate,
      t.progress,
      t.dependencies.join(', '),
      t.assignees.join(', '),
      t.sizing ?? '',
      t.notes || '',
      t.isMilestone ? 'Yes' : 'No'
    ]);
  }

  return rows;
}

export function parseBacklogFromRows(rows: (string | number)[][]): BacklogItem[] {
  if (!rows || rows.length < 2) return [];

  const items: BacklogItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[1]) continue;

    const priority = String(row[0] || '').trim();
    const title = String(row[1] || '').trim();
    const rawSubsystem = String(row[2] || 'Software').trim();
    const subsystem = (rawSubsystem === 'Hardware' || rawSubsystem === 'Operations')
      ? rawSubsystem
      : 'Software';

    const rawSizing = row[3];
    const sizingTerms = rawSizing !== undefined && rawSizing !== '' && rawSizing !== '—'
      ? Number(rawSizing)
      : undefined;

    const rawStatus = String(row[4] || 'not-started').trim().toLowerCase() as TaskStatus;
    const status: TaskStatus = ['not-started', 'in-progress', 'completed', 'blocked'].includes(rawStatus)
      ? rawStatus
      : 'not-started';

    const notes = String(row[5] || '').trim();
    const prefix = subsystem === 'Hardware' ? 'hw' : (subsystem === 'Software' ? 'sw' : 'op');
    const id = `${prefix}-${priority || i}`;

    items.push({
      id,
      priority,
      title,
      subsystem,
      sizingTerms: isNaN(Number(sizingTerms)) ? undefined : sizingTerms,
      status,
      notes
    });
  }

  return items;
}

export function backlogToSheetRows(items: BacklogItem[]): (string | number)[][] {
  const rows: (string | number)[][] = [BACKLOG_HEADERS];

  for (const item of items) {
    rows.push([
      item.priority,
      item.title,
      item.subsystem,
      item.sizingTerms !== undefined ? item.sizingTerms : '—',
      item.status,
      item.notes
    ]);
  }

  return rows;
}

export function exportTasksToCsv(tasks: ScheduleTask[]): string {
  const rows = tasksToSheetRows(tasks);
  return rows.map(row => row.map(cell => escapeCsvCell(cell)).join(',')).join('\n');
}

export function parseTasksFromCsv(csvText: string): ScheduleTask[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    rows.push(parseCsvLine(line));
  }

  return parseTasksFromRows(rows);
}

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function isValidCategory(cat: string): cat is TaskCategory {
  return ['avionics-hw', 'avionics-sw', 'milestone', 'university', 'work-session'].includes(cat);
}

function normalizeDateString(val: string | number | undefined): string {
  if (!val) return '2026-09-01';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return '2026-09-01';
}
