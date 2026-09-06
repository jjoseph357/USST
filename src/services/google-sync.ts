import { GoogleSyncConfig, ScheduleTask, BacklogItem } from '../types/schedule';
import {
  parseTasksFromRows,
  tasksToSheetRows,
  parseBacklogFromRows,
  backlogToSheetRows
} from './sheets-adapter';

const CONFIG_KEY = 'usst_sync_config';

export function loadSyncConfig(): GoogleSyncConfig {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  return {
    spreadsheetId: '',
    appsScriptUrl: '',
    clientId: '',
    lastSyncedAt: undefined
  };
}

export function saveSyncConfig(config: GoogleSyncConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function fetchScheduleFromAppsScript(appsScriptUrl: string): Promise<{
  tasks: ScheduleTask[];
  backlog: BacklogItem[];
}> {
  if (!appsScriptUrl) {
    throw new Error('Google Apps Script URL is not configured.');
  }

  const response = await fetch(appsScriptUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch schedule data from Apps Script.');
  }

  const tasks = parseTasksFromRows(data.scheduleRows || []);
  const backlog = parseBacklogFromRows(data.backlogRows || []);

  return { tasks, backlog };
}

export async function pushScheduleToAppsScript(
  appsScriptUrl: string,
  tasks: ScheduleTask[],
  backlog: BacklogItem[]
): Promise<void> {
  if (!appsScriptUrl) {
    throw new Error('Google Apps Script URL is not configured.');
  }

  const payload = {
    scheduleRows: tasksToSheetRows(tasks),
    backlogRows: backlogToSheetRows(backlog)
  };

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to push schedule data to Apps Script.');
  }
}
