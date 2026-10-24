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

export type TaskStatus = 'todo' | 'in-progress' | 'testing' | 'blocked' | 'done';

export interface Task {
  id: string;
  blockId: string;
  title: string;
  epic: string;
  status: TaskStatus;
  assignees: string[];
  dependsOn: string[];
  checklist?: string[];
  completedChecks?: number[];
  note?: string;
  reactions?: string;
  tags?: string[];
  /** Target date, YYYY-MM-DD, or empty. */
  endDate?: string;
}

export interface FiltersState {
  view: string;
  search: string;
  blockId: string;
  status: string;
  assignee: string | null;
  unassignedOnly: boolean;
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
}

export interface RemoteTaskChange {
  type: 'added' | 'modified' | 'removed';
  task: Partial<Task> & { id: string; deleted?: boolean; isDeleted?: boolean };
}

export interface RemoteAdapter {
  saveTask(task: Task): void;
  deleteTask(taskId: string): void;
  saveBlock(block: Block): void;
}

export interface DeletedTask {
  task: Task;
  unlinked: string[];
}

export declare const STATUSES: TaskStatus[];
export declare const TEAM_MEMBERS: TeamMember[];
export declare const BLOCKS: Block[];
export declare const TASKS: Task[];
export declare const GUEST_MEMBER: TeamMember;
export declare const memberMap: Record<string, TeamMember>;
export declare const blockMap: Record<string, Block>;
export declare const taskMap: Record<string, Task>;
export declare const activeFilters: FiltersState;
export declare const FUN_AVATAR_PACK: string[];
export declare const FUN_COLOR_PALETTE: string[];

export declare function subscribe(listener: () => void): () => void;
export declare function onStoreMessage(handler: (message: string) => void): void;
export declare function setRemote(adapter: Partial<RemoteAdapter>): void;

export declare function isTaskBlocked(task: Task | null | undefined): boolean;
export declare function unmetDependencies(task: Task): string[];
export declare function getStatusLabel(status: string): string;
export declare function taskMatchesFilters(task: Task, filters?: FiltersState): boolean;
export declare function filterTasks(): Task[];
export declare function setFilters(patch: Partial<FiltersState>): void;

export declare function getActiveUser(): TeamMember;
export declare function setActiveUser(userId: string): void;
export declare function isLeadUser(user?: TeamMember): boolean;
export declare function canEdit(user?: TeamMember): boolean;

export declare function updateTaskStatus(taskId: string, newStatus: TaskStatus): void;
export declare function claimTask(taskId: string, memberId: string): void;
export declare function toggleChecklistItem(taskId: string, index: number): void;
export declare function addTaskNote(taskId: string, noteText: string): void;
export declare function assignNameToTask(taskId: string, nameOrId: string): Task | null;
export declare function unassignNameFromTask(taskId: string, nameOrId: string): Task | null;
export declare function updateTaskDetails(taskId: string, updates: Partial<Task>): Task | null;
export declare function createNewTask(params: {
  blockId: string;
  title: string;
  epic?: string;
  status?: TaskStatus;
  assignees?: string[];
  dependsOn?: string[];
  checklist?: string[];
  tags?: string[];
  endDate?: string;
}): Task;
export declare function deleteTask(taskId: string): DeletedTask | null;
export declare function restoreTask(deleted: DeletedTask): void;
export declare function connectTasks(sourceId: string, targetId: string): boolean;
export declare function disconnectTasks(fromId: string, toId: string): boolean;

export declare function getAuditLog(): AuditLogEntry[];
export declare function addAuditLog(actionText: string): void;

export declare function addCrewMember(member: {
  name: string;
  handle?: string;
  role?: string;
  avatar?: string;
  color?: string;
  flair?: string;
}): TeamMember | null;
export declare function updateCrewMember(id: string, updates: Partial<TeamMember>): TeamMember | null;

export declare function addBlock(data: {
  name: string;
  code?: string;
  subtitle?: string;
  color?: string;
  objective?: string;
  deliverables?: string[];
  repos?: BlockRepo[];
}): Block | null;
export declare function updateBlock(blockId: string, updates: Partial<Block>): Block | null;

export declare function applyRemoteTasks(changes: RemoteTaskChange[]): boolean;
export declare function applyRemoteBlocks(blocks: Block[]): void;
