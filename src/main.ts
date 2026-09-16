import './styles/main.css';
import {
  ScheduleTask,
  BacklogItem,
  CategoryFilterState
} from './types/schedule';
import { SEED_TASKS, SEED_BACKLOG } from './data/seed-schedule';
import { RecruitmentShowcase } from './components/recruitment-showcase';
import { RoadmapView } from './components/roadmap-view';
import { BacklogView } from './components/backlog-view';
import { TaskInspectorModal } from './components/task-inspector-modal';
import { QrModal } from './components/qr-modal';
import { GuideModal } from './components/guide-modal';
import { getIconSvg } from './utils/icons';

const TASKS_STORAGE_KEY = 'usst_avionics_tasks_v5';
const BACKLOG_STORAGE_KEY = 'usst_avionics_backlog_v5';

type AppView = 'recruitment' | 'roadmap' | 'backlog';

class App {
  private tasks: ScheduleTask[] = [];
  private backlog: BacklogItem[] = [];

  private filters: CategoryFilterState = {
    'avionics-hw': true,
    'avionics-sw': true,
    'milestone': true,
    'university': true
  };

  private currentView: AppView = 'recruitment';
  private isBoothMode = false;

  private recruitmentShowcase!: RecruitmentShowcase;
  private roadmapView!: RoadmapView;
  private backlogView!: BacklogView;
  private inspectorModal!: TaskInspectorModal;
  private qrModal!: QrModal;
  private guideModal!: GuideModal;

  public getCurrentView(): AppView {
    return this.currentView;
  }

  public getRecruitmentShowcase(): RecruitmentShowcase {
    return this.recruitmentShowcase;
  }

  constructor() {
    this.loadState();
    this.initUI();
    this.handleRoute();
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
    this.qrModal = new QrModal();
    this.guideModal = new GuideModal((view) => this.switchView(view));

    // 1. Initialize Recruitment Showcase
    const recruitmentContainer = document.getElementById('recruitment-container') as HTMLElement;
    this.recruitmentShowcase = new RecruitmentShowcase({
      container: recruitmentContainer,
      onNavigateToView: (view, filterTrack) => {
        if (view === 'roadmap') {
          this.switchView('roadmap');
          window.location.hash = '#roadmap';
        } else if (view === 'backlog') {
          this.switchView('backlog');
          window.location.hash = '#backlog';
          if (filterTrack) {
            this.backlogView.filterByTrackOrSubsystem(filterTrack);
          }
        }
      },
      onOpenQrModal: () => {
        this.qrModal.open();
      }
    });

    // 2. Initialize Roadmap View
    const roadmapContainer = document.getElementById('roadmap-container') as HTMLElement;
    this.roadmapView = new RoadmapView({
      container: roadmapContainer,
      tasks: this.tasks,
      filters: this.filters,
      onTaskSelect: (task) => {
        this.inspectorModal.open(task, this.tasks);
      }
    });

    // 3. Initialize Backlog View
    const backlogContainer = document.getElementById('backlog-container') as HTMLElement;
    this.backlogView = new BacklogView({
      container: backlogContainer,
      items: this.backlog,
      onTaskSelect: (item) => {
        this.inspectorModal.openBacklogItem(item);
      },
      onNavigateToRoadmap: () => {
        this.switchView('roadmap');
        window.location.hash = '#roadmap';
      }
    });

    // Wire Navigation Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as AppView;
        if (view) {
          this.switchView(view);
          window.location.hash = `#${view}`;
        }
      });
    });

    // Wire Brand link
    document.getElementById('brand-home-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchView('recruitment');
      window.location.hash = '#recruitment';
    });

    // Wire Header Guide button
    document.getElementById('btn-header-guide')?.addEventListener('click', () => {
      this.guideModal.open(this.currentView === 'recruitment' ? 'recruitment' : 'work-session');
    });

    // Wire Header QR button
    document.getElementById('btn-header-qr')?.addEventListener('click', () => {
      this.qrModal.open();
    });

    // Wire Booth Mode toggle
    const boothBtn = document.getElementById('btn-toggle-booth-mode');
    boothBtn?.addEventListener('click', () => {
      this.toggleBoothMode();
    });

    // Keyboard shortcut: 'P' or 'p' for Booth Mode
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'p' || e.key === 'P') && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        this.toggleBoothMode();
      }
    });

    // Wire banner buttons
    document.getElementById('btn-banner-starter')?.addEventListener('click', () => {
      this.switchView('backlog');
      window.location.hash = '#backlog';
      this.backlogView.filterByTrackOrSubsystem('starter');
    });

    document.getElementById('btn-banner-roadmap')?.addEventListener('click', () => {
      this.switchView('roadmap');
      window.location.hash = '#roadmap';
    });

    // Update Footer Year
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }
  }

  private switchView(view: AppView) {
    this.currentView = view;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${view}`);
    if (targetSec) targetSec.classList.add('active');

    const workBanner = document.getElementById('work-session-banner');
    if (workBanner) {
      workBanner.style.display = view === 'recruitment' ? 'none' : 'block';
    }

    if (view === 'recruitment') {
      // Showcase view
    } else if (view === 'roadmap') {
      this.roadmapView.render();
    } else if (view === 'backlog') {
      this.backlogView.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private toggleBoothMode() {
    this.isBoothMode = !this.isBoothMode;
    document.body.classList.toggle('booth-mode', this.isBoothMode);

    const boothBtn = document.getElementById('btn-toggle-booth-mode');
    if (boothBtn) {
      boothBtn.innerHTML = this.isBoothMode
        ? `${getIconSvg('x', 14)} <span>Exit Booth</span>`
        : `${getIconSvg('monitor', 14)} <span>Booth Mode</span>`;
      boothBtn.classList.toggle('btn-primary', this.isBoothMode);
    }

    if (this.isBoothMode && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen may require explicit user gesture
      });
    }
  }

  private handleRoute() {
    const applyRoute = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'roadmap' || hash === 'phases') {
        this.switchView('roadmap');
      } else if (hash === 'backlog') {
        this.switchView('backlog');
      } else if (hash === 'kiosk' || hash === 'booth') {
        this.switchView('recruitment');
        if (!this.isBoothMode) {
          this.toggleBoothMode();
        }
      } else {
        this.switchView('recruitment');
        if (this.isBoothMode && hash !== 'kiosk' && hash !== 'booth') {
          this.toggleBoothMode();
        }
      }
    };

    applyRoute();
    window.addEventListener('hashchange', applyRoute);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
