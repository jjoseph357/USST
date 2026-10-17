import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEAM_MEMBERS,
  BLOCKS,
  TASKS,
  GUEST_MEMBER,
  memberMap,
  blockMap,
  taskMap,
  isTaskBlocked,
  getStatusLabel,
  filterTasks,
  activeFilters,
  populateBlockFilter,
  updateTaskStatus,
  claimTask,
  toggleChecklistItem,
  addTaskNote,
  getActiveUser,
  setActiveUser,
  createNewTask,
  deleteTask,
  addAuditLog,
  getAuditLog,
  FUN_AVATAR_PACK,
  FUN_COLOR_PALETTE
} from '../../app.js';

describe('USST Rocketry Mission Control Task Hub', () => {
  describe('Team Roster & Roles', () => {
    it('defines all 8 core team members with distinct handles and avatars', () => {
      expect(TEAM_MEMBERS.length).toBe(8);

      const memberIds = TEAM_MEMBERS.map((m: { id: string }) => m.id);
      expect(memberIds).toContain('david');
      expect(memberIds).toContain('joseph');
      expect(memberIds).toContain('nick');
      expect(memberIds).toContain('sophie');
      expect(memberIds).toContain('jay');
      expect(memberIds).toContain('chase');
      expect(memberIds).toContain('ven');
      expect(memberIds).toContain('michael');

      for (const member of TEAM_MEMBERS) {
        expect(member.name.length).toBeGreaterThan(0);
        expect(member.handle.length).toBeGreaterThan(0);
        expect(member.role.length).toBeGreaterThan(0);
        expect(member.avatar.length).toBeGreaterThan(0);
        expect(member.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(member.flair.length).toBeGreaterThan(0);
      }
    });

    it('indexes team members properly in memberMap, including Guest profile', () => {
      expect(memberMap['david'].name).toBe('David Kuang');
      expect(memberMap['joseph'].name).toBe('Joseph');
      expect(memberMap['nick'].name).toBe('Nick S');
      expect(memberMap['michael'].name).toBe('Michael R');
      expect(memberMap['guest'].name).toBe('Guest Observer');
      expect(GUEST_MEMBER.id).toBe('guest');
    });

    it('manages active user session and role switching', () => {
      setActiveUser('joseph');
      expect(getActiveUser().id).toBe('joseph');

      setActiveUser('nick');
      expect(getActiveUser().name).toBe('Nick S');

      setActiveUser('guest');
      expect(getActiveUser().role).toContain('Guest');

      // Restore to joseph
      setActiveUser('joseph');
    });
  });

  describe('Engineering Blocks (Level 1 Subsystems)', () => {
    it('defines all 7 subsystems: Block 0 through Block 6', () => {
      expect(BLOCKS.length).toBe(7);

      const expectedCodes = [
        'Block 0',
        'Block 1',
        'Block 2',
        'Block 3',
        'Block 4',
        'Block 5',
        'Block 6'
      ];
      expect(BLOCKS.map((b: { code: string }) => b.code)).toEqual(expectedCodes);

      // Verify specific blocks
      expect(blockMap['block-0'].name).toContain('Onboarding');
      expect(blockMap['block-1'].name).toBe('Zephyr RTOS');
      expect(blockMap['block-2'].name).toContain('Algorithms');
      expect(blockMap['block-3'].name).toBe('Software Simulator');
      expect(blockMap['block-4'].name).toBe('RF Comms');
      expect(blockMap['block-5'].name).toBe('Ground Station');
      expect(blockMap['block-6'].name).toBe('Peripherals');

      for (const block of BLOCKS) {
        expect(block.objective).toContain('OBJECTIVE');
        expect(block.deliverables.length).toBeGreaterThanOrEqual(3);
        expect(block.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('links correct GitHub repositories to subsystems', () => {
      const b1Repos = blockMap['block-1'].repos.map((r: { name: string }) => r.name);
      expect(b1Repos).toContain('USSTRocketry/Maidstone');

      const b2Repos = blockMap['block-2'].repos.map((r: { name: string }) => r.name);
      expect(b2Repos).toContain('USSTRocketry/Maidstone');
      expect(b2Repos).toContain('USSTRocketry/Carrot-River');

      const b4Repos = blockMap['block-4'].repos.map((r: { name: string }) => r.name);
      expect(b4Repos).toContain('USSTRocketry/Turtleford');
      expect(b4Repos).toContain('USSTRocketry/Radisson');

      const b5Repos = blockMap['block-5'].repos.map((r: { name: string }) => r.name);
      expect(b5Repos).toContain('USSTRocketry/Houston');
    });
  });

  describe('Task Integrity & Dependency Graph', () => {
    it('contains all 41 tasks extracted from Miro board', () => {
      expect(TASKS.length).toBe(41);
    });

    it('validates that every task references valid block, assignees, and dependencies', () => {
      const validStatuses = ['todo', 'in-progress', 'testing', 'blocked', 'done'];

      for (const task of TASKS) {
        expect(blockMap[task.blockId]).toBeDefined();
        expect(validStatuses).toContain(task.status);
        expect(task.title.length).toBeGreaterThan(0);
        expect(task.epic.length).toBeGreaterThan(0);

        for (const assigneeId of task.assignees) {
          expect(memberMap[assigneeId]).toBeDefined();
        }

        for (const depId of task.dependsOn) {
          expect(taskMap[depId]).toBeDefined();
        }
      }
    });

    it('verifies there are no circular dependencies in the task graph', () => {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      function hasCycle(taskId: string): boolean {
        visited.add(taskId);
        recursionStack.add(taskId);

        const task = taskMap[taskId];
        if (task && task.dependsOn) {
          for (const depId of task.dependsOn) {
            if (!visited.has(depId)) {
              if (hasCycle(depId)) return true;
            } else if (recursionStack.has(depId)) {
              return true;
            }
          }
        }

        recursionStack.delete(taskId);
        return false;
      }

      for (const task of TASKS) {
        if (!visited.has(task.id)) {
          expect(hasCycle(task.id)).toBe(false);
        }
      }
    });

    it('evaluates isTaskBlocked correctly across statuses and dependencies', () => {
      // Null / undefined safety
      expect(isTaskBlocked(null)).toBe(false);
      expect(isTaskBlocked(undefined)).toBe(false);

      // B1-07 status is explicitly 'blocked'
      const b1_07 = taskMap['B1-07'];
      expect(isTaskBlocked(b1_07)).toBe(true);

      // B1-01 is 'done' with no dependencies
      const b1_01 = taskMap['B1-01'];
      expect(isTaskBlocked(b1_01)).toBe(false);

      // B1-02 depends on B1-01 (done) -> not blocked
      const b1_02 = taskMap['B1-02'];
      expect(isTaskBlocked(b1_02)).toBe(false);

      // B1-04 depends on B1-03 ('in-progress', not 'done') -> blocked
      const b1_04 = taskMap['B1-04'];
      expect(isTaskBlocked(b1_04)).toBe(true);

      // A completed task is NEVER blocked even if dependencies exist
      const mockCompletedTask = {
        id: 'MOCK-01',
        blockId: 'block-1',
        title: 'Mock Done',
        epic: 'Test',
        status: 'done' as const,
        assignees: [],
        dependsOn: ['B1-04'] // B1-04 is not done
      };
      expect(isTaskBlocked(mockCompletedTask)).toBe(false);
    });

    it('maps status codes to human-readable labels', () => {
      expect(getStatusLabel('todo')).toBe('Backlog');
      expect(getStatusLabel('in-progress')).toBe('In Progress');
      expect(getStatusLabel('testing')).toBe('Testing & Verify');
      expect(getStatusLabel('blocked')).toBe('Waiting on HW / Blocked');
      expect(getStatusLabel('done')).toBe('Completed');
      expect(getStatusLabel('unknown-status')).toBe('unknown-status');
    });
  });

  describe('Filtering Engine', () => {
    beforeEach(() => {
      activeFilters.view = 'hierarchy';
      activeFilters.search = '';
      activeFilters.blockId = 'all';
      activeFilters.status = 'all';
      activeFilters.assignee = null;
    });

    it('returns all tasks when default filters are active', () => {
      const results = filterTasks();
      expect(results.length).toBe(TASKS.length);
    });

    it('filters by Block ID', () => {
      activeFilters.blockId = 'block-1';
      const b1Tasks = filterTasks();
      expect(b1Tasks.length).toBe(12);
      for (const t of b1Tasks) {
        expect(t.blockId).toBe('block-1');
      }

      activeFilters.blockId = 'block-2';
      const b2Tasks = filterTasks();
      expect(b2Tasks.length).toBe(10);
      for (const t of b2Tasks) {
        expect(t.blockId).toBe('block-2');
      }
    });

    it('filters by assignee', () => {
      activeFilters.assignee = 'nick';
      const nickTasks = filterTasks();
      expect(nickTasks.length).toBeGreaterThan(0);
      for (const t of nickTasks) {
        expect(t.assignees).toContain('nick');
      }

      activeFilters.assignee = 'chase';
      const chaseTasks = filterTasks();
      expect(chaseTasks.length).toBeGreaterThan(0);
      for (const t of chaseTasks) {
        expect(t.assignees).toContain('chase');
      }
    });

    it('filters by unblocked criteria (tasks ready to work on)', () => {
      activeFilters.status = 'unblocked';
      const unblockedTasks = filterTasks();
      expect(unblockedTasks.length).toBeGreaterThan(0);
      for (const t of unblockedTasks) {
        expect(isTaskBlocked(t)).toBe(false);
        expect(t.status).not.toBe('done');
      }
    });

    it('filters by blocked criteria (all tasks waiting on predecessor or hardware)', () => {
      activeFilters.status = 'blocked';
      const blockedTasks = filterTasks();
      // Verifies the fix: previously only 1 task with status 'blocked' was returned.
      // Now all tasks blocked by predecessors/hardware are included!
      expect(blockedTasks.length).toBe(24);
      for (const t of blockedTasks) {
        expect(isTaskBlocked(t)).toBe(true);
      }
    });

    it('filters by specific statuses: done, in-progress, testing', () => {
      activeFilters.status = 'done';
      const doneTasks = filterTasks();
      for (const t of doneTasks) {
        expect(t.status).toBe('done');
      }

      activeFilters.status = 'in-progress';
      const inProgressTasks = filterTasks();
      for (const t of inProgressTasks) {
        expect(t.status).toBe('in-progress');
      }

      activeFilters.status = 'testing';
      const testingTasks = filterTasks();
      for (const t of testingTasks) {
        expect(t.status).toBe('testing');
      }
    });

    it('searches by keyword across titles, epics, tags, notes, and checklist items', () => {
      activeFilters.search = 'UKF';
      const ukfResults = filterTasks();
      expect(ukfResults.length).toBeGreaterThan(0);

      activeFilters.search = 'LoRa';
      const loraResults = filterTasks();
      expect(loraResults.length).toBeGreaterThan(0);

      activeFilters.search = 'Device Tree';
      const dtResults = filterTasks();
      expect(dtResults.length).toBeGreaterThan(0);

      activeFilters.search = 'Zephyr RTOS';
      const zephyrResults = filterTasks();
      expect(zephyrResults.length).toBeGreaterThan(0);
    });

    it('populates block filter options safely and idempotently', () => {
      // In Node environment without DOM, calling populateBlockFilter should be safe and not throw
      expect(() => populateBlockFilter()).not.toThrow();

      // Mock select DOM element
      const mockChildren: { value: string; textContent: string }[] = [];
      const mockSelect = {
        innerHTML: '',
        value: '',
        appendChild: (child: { value: string; textContent: string }) => mockChildren.push(child)
      };

      // Temporarily mock document.getElementById and document.createElement
      (globalThis as unknown as { document: { getElementById: (id: string) => unknown; createElement: (tag: string) => unknown } }).document = {
        getElementById: (id: string) => (id === 'blockFilter' ? mockSelect : null),
        createElement: () => ({ value: '', textContent: '' })
      };

      try {
        populateBlockFilter();
        // 1 "all" option + 7 blocks = 8 options
        expect(mockChildren.length).toBe(7);
        expect(mockSelect.innerHTML).toContain('All Blocks');

        // Calling a second time resets and does not duplicate
        mockChildren.length = 0;
        populateBlockFilter();
        expect(mockChildren.length).toBe(7);
      } finally {
        delete (globalThis as unknown as { document?: unknown }).document;
      }
    });
  });

  describe('Interactive State Mutations & Workflow', () => {
    it('unblocks downstream tasks when predecessor status is updated to done', () => {
      const b1_03 = taskMap['B1-03'];
      const b1_04 = taskMap['B1-04'];
      const originalB1_03Status = b1_03.status;

      // Initially B1-04 is blocked because B1-03 is in-progress
      expect(isTaskBlocked(b1_04)).toBe(true);

      // Mark B1-03 as done
      updateTaskStatus('B1-03', 'done');
      expect(b1_03.status).toBe('done');

      // Now B1-04 should be unblocked!
      expect(isTaskBlocked(b1_04)).toBe(false);

      // Revert back for other tests
      updateTaskStatus('B1-03', originalB1_03Status);
      expect(isTaskBlocked(b1_04)).toBe(true);
    });

    it('claims and unassigns tasks for team members', () => {
      const task = taskMap['B0-04'];
      const originalAssignees = [...task.assignees];

      // Claim task for nick
      claimTask('B0-04', 'nick');
      expect(task.assignees).toContain('nick');

      // Unclaim task for nick
      claimTask('B0-04', 'nick');
      expect(task.assignees).not.toContain('nick');

      // Restore original assignees
      task.assignees = originalAssignees;
    });

    it('toggles interactive checklist items', () => {
      const task = taskMap['B0-01'];
      expect(task.checklist).toBeDefined();

      // Check item 0
      toggleChecklistItem('B0-01', 0);
      expect(task.completedChecks).toContain(0);

      // Uncheck item 0
      toggleChecklistItem('B0-01', 0);
      expect(task.completedChecks).not.toContain(0);
    });

    it('records progress notes on tasks', () => {
      const task = taskMap['B1-03'];
      const originalNote = task.note;

      addTaskNote('B1-03', 'Nick S: "Testing UART console output"');
      expect(task.note).toContain('Testing UART console output');

      // Restore original note
      task.note = originalNote;
    });

    it('creates new tasks dynamically and adds them to taskMap and TASKS', () => {
      const initialCount = TASKS.length;
      const created = createNewTask({
        blockId: 'block-0',
        title: 'New Avionics Sensor Test Task',
        epic: 'Hardware Testing',
        status: 'todo',
        assignees: ['joseph'],
        dependsOn: ['B0-01'],
        checklist: ['Step 1', 'Step 2'],
        tags: ['Avionics', 'Test']
      });

      expect(created.id).toMatch(/^B0-\d{2}$/);
      expect(created.title).toBe('New Avionics Sensor Test Task');
      expect(taskMap[created.id]).toBe(created);
      expect(TASKS.length).toBe(initialCount + 1);

      // Clean up using deleteTask
      deleteTask(created.id);
      expect(taskMap[created.id]).toBeUndefined();
      expect(TASKS.length).toBe(initialCount);
    });

    it('manages audit log correctly', () => {
      const initialLogCount = getAuditLog().length;
      addAuditLog('Test action for mission control verification');

      const logs = getAuditLog();
      expect(logs.length).toBe(initialLogCount + 1);
      expect(logs[0].action).toBe('Test action for mission control verification');
      expect(logs[0].timestamp).toBeDefined();
      expect(logs[0].actor).toBeDefined();
    });

    it('provides rich avatar and color palettes', () => {
      expect(FUN_AVATAR_PACK.length).toBeGreaterThanOrEqual(20);
      expect(FUN_AVATAR_PACK).toContain('🚀');
      expect(FUN_AVATAR_PACK).toContain('🛰️');
      expect(FUN_AVATAR_PACK).toContain('🧙‍♂️');

      expect(FUN_COLOR_PALETTE.length).toBeGreaterThanOrEqual(10);
      for (const color of FUN_COLOR_PALETTE) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });
});

