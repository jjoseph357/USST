export interface TeamMember {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatar: string;
  color: string;
  flair: string;
}

export interface BlockRepo {
  name: string;
  url: string;
}

export interface Block {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  color: string;
  objective: string;
  repos: BlockRepo[];
  deliverables: string[];
}

export interface Task {
  id: string;
  blockId: string;
  title: string;
  epic: string;
  status: 'todo' | 'in-progress' | 'testing' | 'blocked' | 'done';
  assignees: string[];
  dependsOn: string[];
  checklist?: string[];
  completedChecks?: number[];
  note?: string;
  reactions?: string;
  tags?: string[];
}

export interface FiltersState {
  view: string;
  search: string;
  blockId: string;
  status: string;
  assignee: string | null;
}

export declare const TEAM_MEMBERS: TeamMember[];
export declare const BLOCKS: Block[];
export declare const TASKS: Task[];
export declare const GUEST_MEMBER: TeamMember;
export declare const memberMap: Record<string, TeamMember>;
export declare const blockMap: Record<string, Block>;
export declare const taskMap: Record<string, Task>;

export declare function isTaskBlocked(task: Task | null | undefined): boolean;
export declare function getStatusLabel(status: string): string;
export declare function filterTasks(): Task[];
export declare const activeFilters: FiltersState;

export declare function renderAll(): void;
export declare function renderRoster(): void;
export declare function renderMetrics(filtered: Task[]): void;
export declare function renderHierarchyView(filtered: Task[]): void;
export declare function renderDependencyChains(): void;
export declare function renderKanbanView(filtered: Task[]): void;
export declare function renderAuthPill(): void;
export declare function populateBlockFilter(): void;
export declare function openTaskModal(taskId: string): void;
export declare function closeTaskModal(): void;
export declare function openProfileModal(): void;
export declare function closeProfileModal(): void;
export declare function updateTaskStatus(taskId: string, newStatus: Task['status']): void;
export declare function claimTask(taskId: string, memberId: string): void;
export declare function toggleChecklistItem(taskId: string, index: number): void;
export declare function addTaskNote(taskId: string, noteText: string): void;
export declare function getActiveUser(): TeamMember;
export declare function setActiveUser(userId: string): void;
export declare function init(): void;

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
}

export declare const FUN_AVATAR_PACK: string[];
export declare const FUN_COLOR_PALETTE: string[];

export declare function createNewTask(params: {
  blockId: string;
  title: string;
  epic?: string;
  status?: Task['status'];
  assignees?: string[];
  dependsOn?: string[];
  checklist?: string[];
  tags?: string[];
}): Task;

export declare function deleteTask(taskId: string): void;
export declare function openNewTaskModal(): void;
export declare function getAuditLog(): AuditLogEntry[];
export declare function addAuditLog(actionText: string): void;

export declare function assignNameToTask(taskId: string, nameOrId: string): Task | null;
export declare function unassignNameFromTask(taskId: string, nameOrId: string): Task | null;
export declare function updateTaskDetails(
  taskId: string,
  updates: Partial<Task>
): Task | null;
export declare function addCrewMember(member: {
  name: string;
  handle?: string;
  role?: string;
  avatar?: string;
  color?: string;
  flair?: string;
}): TeamMember | null;
export declare function updateCrewMember(
  id: string,
  updates: Partial<TeamMember>
): TeamMember | null;


