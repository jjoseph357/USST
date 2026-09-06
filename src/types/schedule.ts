export type TaskCategory =
  | 'avionics-hw'
  | 'avionics-sw'
  | 'milestone'
  | 'university';

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';

export interface ScheduleTask {
  id: string;
  title: string;
  category: TaskCategory;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string;   // ISO format: YYYY-MM-DD
  progress: number;  // 0 to 100
  dependencies: string[]; // List of predecessor task IDs
  assignees: string[];
  sizing?: number;   // Member-terms (e.g. 1.5, 2.0)
  priority?: string | number;
  notes?: string;
  isMilestone?: boolean;
}

export interface BacklogItem {
  id: string;
  priority: string | number;
  title: string;
  subsystem: 'Hardware' | 'Software' | 'Operations';
  sizingTerms?: number; // Sizing in members / term
  status: TaskStatus;
  notes: string;
}

export interface CapacityModel {
  totalTerms: number;
  totalEffortTerms: number;
  requiredMembersPerTerm: number;
}

export interface CategoryFilterState {
  'avionics-hw': boolean;
  'avionics-sw': boolean;
  'milestone': boolean;
  'university': boolean;
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface GoogleSyncConfig {
  spreadsheetId: string;
  clientId?: string;
  appsScriptUrl?: string;
  apiKey?: string;
  sharedDriveId?: string;
  lastSyncedAt?: string;
}
