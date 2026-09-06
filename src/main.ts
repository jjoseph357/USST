import './styles/main.css';
import { ScheduleTask, BacklogItem, CategoryFilterState, GoogleSyncConfig } from './types/schedule';
import { SEED_TASKS, SEED_BACKLOG } from './data/seed-schedule';
import { GanttChart, GanttZoom } from './components/gantt-chart';
import { CalendarView } from './components/calendar-view';
import { BacklogView } from './components/backlog-view';
import { TaskInspectorModal } from './components/task-inspector-modal';
import { SetupModal } from './components/setup-modal';
import { exportTasksToCsv, parseTasksFromCsv } from './services/sheets-adapter';
import {
  loadSyncConfig,
  fetchScheduleFromAppsScript
} from './services/google-sync';

const TASKS_STORAGE_KEY = 'usst_avionics_tasks_v2';
const BACKLOG_STORAGE_KEY = 'usst_avionics_backlog_v2';

class App {
  private tasks: ScheduleTask[] = [];
  private backlog: BacklogItem[] = [];

  private filters: CategoryFilterState = {
    'avionics-hw': true,
    'avionics-sw': true,
    'milestone': true,
    'university': true
  };

  private currentZoom: GanttZoom = 'week';

  private gantt!: GanttChart;
  private calendar!: CalendarView;
  private backlogView!: BacklogView;
  private inspectorModal!: TaskInspectorModal;
  private setupModal!: SetupModal;

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
    this.inspectorModal = new TaskInspectorModal();

    const ganttContainer = document.getElementById('gantt-container') as HTMLElement;
    this.gantt = new GanttChart({
      container: ganttContainer,
      tasks: this.tasks,
      filters: this.filters,
      zoom: this.currentZoom,
      onTaskSelect: (task) => {
        this.inspectorModal.open(task, this.tasks);
      }
    });

    const calendarContainer = document.getElementById('calendar-container') as HTMLElement;
    this.calendar = new CalendarView({
      container: calendarContainer,
      tasks: this.tasks,
      filters: this.filters,
      onTaskSelect: (task) => {
        this.inspectorModal.open(task, this.tasks);
      }
    });

    const backlogContainer = document.getElementById('backlog-container') as HTMLElement;
    this.backlogView = new BacklogView({
      container: backlogContainer,
      items: this.backlog
    });

    this.setupModal = new SetupModal({
      onSync: async (config: GoogleSyncConfig) => {
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
        this.setSyncStatus('synced', 'Connected');
      },
      onExportCsv: () => {
        const csv = exportTasksToCsv(this.tasks);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usst-schedule-${new Date().toISOString().split('T')[0]}.csv`;
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
      }
    });

    // Navigation tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as 'gantt' | 'calendar' | 'backlog';
        this.switchView(view);
      });
    });

    // Filter chips
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

    // Zoom buttons
    const zoomBtns = document.querySelectorAll('.zoom-btn');
    zoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        zoomBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentZoom = btn.getAttribute('data-zoom') as GanttZoom;
        this.gantt.update(this.tasks, this.filters, this.currentZoom);
      });
    });

    // Action buttons
    document.getElementById('btn-open-setup')?.addEventListener('click', () => {
      this.setupModal.open();
    });

    document.getElementById('btn-banner-guide')?.addEventListener('click', () => {
      this.setupModal.open();
    });

    document.getElementById('btn-refresh-sheet')?.addEventListener('click', async () => {
      const config = loadSyncConfig();
      if (!config.appsScriptUrl) {
        this.setupModal.open();
        return;
      }
      this.setSyncStatus('syncing', 'Updating...');
      try {
        const result = await fetchScheduleFromAppsScript(config.appsScriptUrl);
        if (result.tasks.length > 0) {
          this.tasks = result.tasks;
          this.saveTasks();
        }
        if (result.backlog.length > 0) {
          this.backlog = result.backlog;
          this.saveBacklog();
        }
        this.refreshAllViews();
        this.setSyncStatus('synced', 'Connected');
      } catch (err) {
        this.setSyncStatus('error', 'Sync Failed');
      }
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
      this.setSyncStatus('synced', 'Connected');
    } else {
      this.setSyncStatus('offline', 'Local Baseline');
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

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
