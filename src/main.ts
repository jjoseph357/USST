import './styles/main.css';
import { ScheduleTask, BacklogItem, CategoryFilterState, GoogleSyncConfig } from './types/schedule';
import { SEED_TASKS, SEED_BACKLOG } from './data/seed-schedule';
import { GanttChart, GanttZoom } from './components/gantt-chart';
import { CalendarView } from './components/calendar-view';
import { BacklogView } from './components/backlog-view';
import { TaskModal } from './components/task-modal';
import { SyncModal } from './components/sync-modal';
import { exportTasksToCsv, parseTasksFromCsv } from './services/sheets-adapter';
import {
  loadSyncConfig,
  fetchScheduleFromAppsScript,
  pushScheduleToAppsScript
} from './services/google-sync';

const TASKS_STORAGE_KEY = 'usst_avionics_tasks';
const BACKLOG_STORAGE_KEY = 'usst_avionics_backlog';

class App {
  private tasks: ScheduleTask[] = [];
  private backlog: BacklogItem[] = [];

  private filters: CategoryFilterState = {
    'avionics-hw': true,
    'avionics-sw': true,
    'milestone': true,
    'university': true,
    'work-session': true
  };

  private currentZoom: GanttZoom = 'week';

  private gantt!: GanttChart;
  private calendar!: CalendarView;
  private backlogView!: BacklogView;
  private taskModal!: TaskModal;
  private syncModal!: SyncModal;

  constructor() {
    this.loadState();
    this.initUI();
    this.initSyncStatus();
  }

  private loadState() {
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (savedTasks) {
      try {
        this.tasks = JSON.parse(savedTasks);
      } catch {
        this.tasks = [...SEED_TASKS];
      }
    } else {
      this.tasks = [...SEED_TASKS];
      this.saveTasks();
    }

    const savedBacklog = localStorage.getItem(BACKLOG_STORAGE_KEY);
    if (savedBacklog) {
      try {
        this.backlog = JSON.parse(savedBacklog);
      } catch {
        this.backlog = [...SEED_BACKLOG];
      }
    } else {
      this.backlog = [...SEED_BACKLOG];
      this.saveBacklog();
    }
  }

  private saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
  }

  private saveBacklog() {
    localStorage.setItem(BACKLOG_STORAGE_KEY, JSON.stringify(this.backlog));
  }

  private initUI() {
    // 1. Initialize views
    const ganttContainer = document.getElementById('gantt-container') as HTMLElement;
    this.gantt = new GanttChart({
      container: ganttContainer,
      tasks: this.tasks,
      filters: this.filters,
      zoom: this.currentZoom,
      onTaskChange: (updated) => {
        this.tasks = updated;
        this.saveTasks();
        this.calendar.update(this.tasks, this.filters);
      },
      onTaskSelect: (task) => {
        this.taskModal.open(task, this.tasks);
      }
    });

    const calendarContainer = document.getElementById('calendar-container') as HTMLElement;
    this.calendar = new CalendarView({
      container: calendarContainer,
      tasks: this.tasks,
      filters: this.filters,
      onTaskSelect: (task) => {
        this.taskModal.open(task, this.tasks);
      }
    });

    const backlogContainer = document.getElementById('backlog-container') as HTMLElement;
    this.backlogView = new BacklogView({
      container: backlogContainer,
      items: this.backlog,
      onItemUpdate: (items) => {
        this.backlog = items;
        this.saveBacklog();
      }
    });

    // 2. Initialize Modals
    this.taskModal = new TaskModal({
      onSave: (task, isNew) => {
        if (isNew) {
          this.tasks.push(task);
        } else {
          const idx = this.tasks.findIndex(t => t.id === task.id);
          if (idx !== -1) {
            this.tasks[idx] = task;
          }
        }
        this.saveTasks();
        this.refreshAllViews();
      },
      onDelete: (taskId) => {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        // Also remove dependencies pointing to this task
        this.tasks.forEach(t => {
          t.dependencies = t.dependencies.filter(id => id !== taskId);
        });
        this.saveTasks();
        this.refreshAllViews();
      }
    });

    this.syncModal = new SyncModal({
      onPull: async (config: GoogleSyncConfig) => {
        const result = await fetchScheduleFromAppsScript(config.appsScriptUrl || '');
        if (result.tasks.length > 0) {
          this.tasks = result.tasks;
          this.saveTasks();
        }
        if (result.backlog.length > 0) {
          this.backlog = result.backlog;
          this.saveBacklog();
        }
        this.refreshAllViews();
        this.setSyncStatus('synced', 'Synced with Sheets');
      },
      onPush: async (config: GoogleSyncConfig) => {
        await pushScheduleToAppsScript(config.appsScriptUrl || '', this.tasks, this.backlog);
        this.setSyncStatus('synced', 'Synced with Sheets');
      },
      onExportCsv: () => {
        const csv = exportTasksToCsv(this.tasks);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usst-avionics-schedule-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      onImportCsv: (csvText: string) => {
        const imported = parseTasksFromCsv(csvText);
        if (imported.length > 0) {
          this.tasks = imported;
          this.saveTasks();
          this.refreshAllViews();
        }
      },
      onResetSeed: () => {
        this.tasks = [...SEED_TASKS];
        this.backlog = [...SEED_BACKLOG];
        this.saveTasks();
        this.saveBacklog();
        this.refreshAllViews();
      }
    });

    // 3. Navigation tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as 'gantt' | 'calendar' | 'backlog';
        this.switchView(view);
      });
    });

    // 4. Filter checkboxes
    const bindFilter = (id: string, key: keyof CategoryFilterState) => {
      const checkbox = document.getElementById(id) as HTMLInputElement;
      checkbox?.addEventListener('change', () => {
        this.filters[key] = checkbox.checked;
        this.refreshAllViews();
      });
    };

    bindFilter('filter-hw', 'avionics-hw');
    bindFilter('filter-sw', 'avionics-sw');
    bindFilter('filter-milestone', 'milestone');
    bindFilter('filter-university', 'university');
    bindFilter('filter-session', 'work-session');

    // 5. Zoom buttons
    const zoomBtns = document.querySelectorAll('.zoom-btn');
    zoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        zoomBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentZoom = btn.getAttribute('data-zoom') as GanttZoom;
        this.gantt.update(this.tasks, this.filters, this.currentZoom);
      });
    });

    // 6. Action buttons
    document.getElementById('btn-add-task')?.addEventListener('click', () => {
      this.taskModal.open(null, this.tasks);
    });

    document.getElementById('btn-open-sync')?.addEventListener('click', () => {
      this.syncModal.open();
    });
  }

  private switchView(view: 'gantt' | 'calendar' | 'backlog') {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${view}`);
    if (targetSec) targetSec.classList.add('active');

    // Toggle zoom controls visibility
    const zoomControls = document.getElementById('gantt-zoom-controls');
    if (zoomControls) {
      zoomControls.style.display = view === 'gantt' ? 'flex' : 'none';
    }

    if (view === 'gantt') {
      this.gantt.render();
    } else if (view === 'calendar') {
      this.calendar.render();
    } else if (view === 'backlog') {
      this.backlogView.render();
    }
  }

  private refreshAllViews() {
    this.gantt.update(this.tasks, this.filters, this.currentZoom);
    this.calendar.update(this.tasks, this.filters);
    this.backlogView.update(this.backlog);
  }

  private initSyncStatus() {
    const config = loadSyncConfig();
    if (config.appsScriptUrl) {
      this.setSyncStatus('offline', 'Connected to Sheets');
    } else {
      this.setSyncStatus('offline', 'Local Storage');
    }
  }

  private setSyncStatus(state: 'synced' | 'syncing' | 'error' | 'offline', label: string) {
    const dot = document.getElementById('sync-status-dot');
    const text = document.getElementById('sync-status-text');
    if (dot) {
      dot.className = `status-dot ${state}`;
    }
    if (text) {
      text.textContent = label;
    }
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
