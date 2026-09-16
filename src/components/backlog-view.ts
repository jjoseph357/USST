import { BacklogItem, SkillTrackId } from '../types/schedule';
import { getIconSvg } from '../utils/icons';

export interface BacklogViewOptions {
  container: HTMLElement;
  items: BacklogItem[];
  onTaskSelect?: (item: BacklogItem) => void;
  onNavigateToRoadmap?: () => void;
}

export class BacklogView {
  private container: HTMLElement;
  private items: BacklogItem[];
  private onTaskSelect?: (item: BacklogItem) => void;
  private onNavigateToRoadmap?: () => void;

  private selectedCategory: 'all' | 'Hardware' | 'Software' | 'starter' = 'all';
  private selectedSubsystem: 'all' | number = 'all';
  private selectedTrack: 'all' | SkillTrackId = 'all';
  private selectedPriority = 'all';
  private searchQuery = '';
  private totalTerms = 2;

  constructor(options: BacklogViewOptions) {
    this.container = options.container;
    this.items = options.items;
    this.onTaskSelect = options.onTaskSelect;
    this.onNavigateToRoadmap = options.onNavigateToRoadmap;

    this.render();
  }

  public update(items: BacklogItem[]) {
    this.items = items;
    this.render();
  }

  public filterByTrackOrSubsystem(filter: string) {
    this.selectedCategory = 'all';
    this.selectedSubsystem = 'all';
    this.selectedTrack = 'all';
    this.selectedPriority = 'all';
    this.searchQuery = '';

    const lower = filter.toLowerCase().trim();

    if (lower === 'starter' || lower === 'beginner') {
      this.selectedCategory = 'starter';
    } else if (lower.startsWith('subsystem-')) {
      const num = parseInt(lower.replace('subsystem-', ''), 10);
      if (!isNaN(num)) {
        this.selectedSubsystem = num;
      }
    } else if (['hardware', 'firmware', 'algorithms', 'rf', 'fullstack', 'mechanical'].includes(lower)) {
      this.selectedTrack = lower as SkillTrackId;
    } else if (lower.includes('hard')) {
      this.selectedCategory = 'Hardware';
    } else if (lower.includes('soft')) {
      this.selectedCategory = 'Software';
    } else {
      this.selectedCategory = 'all';
      this.selectedSubsystem = 'all';
      this.selectedTrack = 'all';
    }

    this.render();
  }

  public clearAllFilters() {
    this.selectedCategory = 'all';
    this.selectedSubsystem = 'all';
    this.selectedTrack = 'all';
    this.selectedPriority = 'all';
    this.searchQuery = '';
    this.render();
  }

  public render() {
    this.container.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'backlog-layout';

    // Left Column: Filters, Active Filter Bar, and Table
    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.gap = '1.25rem';
    leftCol.style.flex = '1';

    // Filter toolbar card
    const filterCard = document.createElement('div');
    filterCard.className = 'card';

    const hasActiveFilter =
      this.selectedCategory !== 'all' ||
      this.selectedSubsystem !== 'all' ||
      this.selectedTrack !== 'all' ||
      this.selectedPriority !== 'all' ||
      this.searchQuery.trim().length > 0;

    const filterDescription = this.getActiveFilterDescription();

    filterCard.innerHTML = `
      <div class="backlog-toolbar-wrap">
        <!-- Category filter buttons -->
        <div class="backlog-tabs-row" role="tablist">
          <button class="backlog-filter-btn ${this.selectedCategory === 'all' && this.selectedSubsystem === 'all' && this.selectedTrack === 'all' ? 'active' : ''}" data-category="all">
            All Tasks (${this.items.length})
          </button>
          <button class="backlog-filter-btn ${this.selectedCategory === 'Hardware' ? 'active' : ''}" data-category="Hardware">
            ${getIconSvg('zap', 14)} Hardware (${this.items.filter(i => i.subsystem === 'Hardware').length})
          </button>
          <button class="backlog-filter-btn ${this.selectedCategory === 'Software' ? 'active' : ''}" data-category="Software">
            ${getIconSvg('code', 14)} Software (${this.items.filter(i => i.subsystem === 'Software').length})
          </button>
          <button class="backlog-filter-btn ${this.selectedCategory === 'starter' ? 'active' : ''}" data-category="starter">
            ${getIconSvg('leaf', 14)} Starter Tasks (${this.items.filter(i => i.isStarterProject).length})
          </button>
        </div>

        <!-- Search & Dropdown filters -->
        <div class="backlog-search-row">
          <div class="search-input-wrap">
            <span class="search-icon">${getIconSvg('search', 15)}</span>
            <input type="text" id="backlog-search-input" placeholder="Search tasks, keywords, specs..." value="${this.searchQuery}" aria-label="Search backlog tasks" />
          </div>

          <select id="backlog-subsystem-select" class="form-select" title="Filter by Subsystem" aria-label="Filter by Subsystem">
            <option value="all" ${this.selectedSubsystem === 'all' ? 'selected' : ''}>All Subsystems</option>
            <option value="1" ${this.selectedSubsystem === 1 ? 'selected' : ''}>Subsystem 01: STM32 Flight Computer</option>
            <option value="2" ${this.selectedSubsystem === 2 ? 'selected' : ''}>Subsystem 02: Power &amp; Switching</option>
            <option value="3" ${this.selectedSubsystem === 3 ? 'selected' : ''}>Subsystem 03: Flight Software &amp; RTOS</option>
            <option value="4" ${this.selectedSubsystem === 4 ? 'selected' : ''}>Subsystem 04: RF &amp; Telemetry</option>
            <option value="5" ${this.selectedSubsystem === 5 ? 'selected' : ''}>Subsystem 05: Ground Station &amp; Web</option>
            <option value="6" ${this.selectedSubsystem === 6 ? 'selected' : ''}>Subsystem 06: Airframe &amp; Mechanical</option>
          </select>

          <select id="backlog-track-select" class="form-select" title="Filter by Discipline" aria-label="Filter by Discipline">
            <option value="all" ${this.selectedTrack === 'all' ? 'selected' : ''}>All Disciplines</option>
            <option value="hardware" ${this.selectedTrack === 'hardware' ? 'selected' : ''}>Hardware &amp; PCB</option>
            <option value="firmware" ${this.selectedTrack === 'firmware' ? 'selected' : ''}>Firmware &amp; RTOS</option>
            <option value="algorithms" ${this.selectedTrack === 'algorithms' ? 'selected' : ''}>Algorithms &amp; UKF</option>
            <option value="rf" ${this.selectedTrack === 'rf' ? 'selected' : ''}>RF &amp; Telemetry</option>
            <option value="fullstack" ${this.selectedTrack === 'fullstack' ? 'selected' : ''}>Full-Stack Web</option>
          </select>

          <select id="backlog-priority-select" class="form-select" title="Filter by Priority" aria-label="Filter by Priority">
            <option value="all" ${this.selectedPriority === 'all' ? 'selected' : ''}>All Priorities</option>
            <option value="1" ${this.selectedPriority === '1' ? 'selected' : ''}>Priority 1 (Critical)</option>
            <option value="2" ${this.selectedPriority === '2' ? 'selected' : ''}>Priority 2</option>
            <option value="3" ${this.selectedPriority === '3' ? 'selected' : ''}>Priority 3</option>
            <option value="4" ${this.selectedPriority === '4' ? 'selected' : ''}>Priority 4</option>
            <option value="5" ${this.selectedPriority === '5' ? 'selected' : ''}>Priority 5</option>
            <option value="7" ${this.selectedPriority === '7' ? 'selected' : ''}>Priority 7</option>
            <option value="8" ${this.selectedPriority === '8' ? 'selected' : ''}>Priority 8</option>
            <option value="9" ${this.selectedPriority === '9' ? 'selected' : ''}>Priority 9</option>
            <option value="Gen" ${this.selectedPriority === 'Gen' ? 'selected' : ''}>General</option>
          </select>
        </div>

        ${hasActiveFilter ? `
          <div class="active-filter-bar">
            <div class="active-filter-info">
              <span class="active-filter-label">Active Filter:</span>
              <span class="badge badge-primary">${filterDescription}</span>
            </div>
            <button class="btn btn-default btn-xs" id="btn-clear-filters">
              ${getIconSvg('x', 12)} Clear Filter
            </button>
          </div>
        ` : ''}
      </div>
    `;
    leftCol.appendChild(filterCard);

    // Filter items
    const filteredItems = this.getFilteredItems();

    // Table card
    const tableCard = document.createElement('div');
    tableCard.className = 'card';

    let tableContentHtml = '';

    if (filteredItems.length === 0) {
      if (this.selectedSubsystem === 6) {
        tableContentHtml = `
          <div style="padding: 3rem 1.5rem; text-align: center;">
            <div style="margin-bottom: 0.75rem; color: var(--text-muted);">
              ${getIconSvg('tool', 36)}
            </div>
            <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--text-main);">
              Subsystem 06: Airframe &amp; Mechanical Integration
            </h4>
            <p style="color: var(--text-muted); max-width: 520px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
              Avionics bay 3D sled design, vibration testing, vacuum chamber validation, and vehicle wire harness routing are scheduled as dedicated milestone deliverables leading to the Flight Readiness Review.
            </p>
            <button class="btn btn-primary" id="btn-empty-view-roadmap">
              ${getIconSvg('calendar')} View mechanical milestones in roadmap
            </button>
          </div>
        `;
      } else {
        tableContentHtml = `
          <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
            <div style="margin-bottom: 0.5rem;">${getIconSvg('search', 28)}</div>
            <p style="font-size: 0.95rem; margin-bottom: 1rem; color: var(--text-main);">No tasks match your current filter or search criteria.</p>
            <button class="btn btn-default btn-sm" id="btn-empty-clear-filters">Clear all filters</button>
          </div>
        `;
      }
    } else {
      const rowsHtml = filteredItems.map(item => `
        <tr class="backlog-data-row" data-task-id="${item.id}">
          <td style="width: 70px;">
            <span class="priority-badge ${this.getPriorityClass(item.priority)}">
              P${item.priority}
            </span>
          </td>
          <td>
            <div class="task-title-cell">
              <div class="task-head-line" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <strong class="task-name-text">${item.title}</strong>
                ${item.isStarterProject ? `<span class="badge badge-success badge-sm">${getIconSvg('leaf', 11)} Starter</span>` : ''}
                ${item.subsystemName ? `<span class="badge badge-neutral badge-sm">${item.subsystemName}</span>` : ''}
              </div>
              <div class="task-desc-sub">${item.notes}</div>
            </div>
          </td>
          <td style="width: 100px;">
            <span class="badge ${item.subsystem === 'Hardware' ? 'badge-info' : 'badge-primary'}">
              ${item.subsystem}
            </span>
          </td>
          <td style="width: 140px;">
            <div class="sizing-chip">
              <span class="sizing-num font-mono">${item.sizingTerms !== undefined ? item.sizingTerms.toFixed(1) : '—'}</span>
              <span class="sizing-unit">member-terms</span>
            </div>
          </td>
          <td style="width: 110px;">
            <span class="status-pill status-${item.status}">
              ${item.status.replace('-', ' ')}
            </span>
          </td>
          <td style="width: 90px; text-align: right;">
            <button class="btn btn-default btn-xs btn-inspect-task" data-task-id="${item.id}">
              Inspect
            </button>
          </td>
        </tr>
      `).join('');

      tableContentHtml = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">Priority</th>
                <th>Task &amp; Description</th>
                <th style="width: 100px;">Subsystem</th>
                <th style="width: 140px;">Effort Sizing</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 90px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }

    tableCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">Technical Task Backlog (${filteredItems.length} tasks)</div>
        <span class="status-pill status-in-progress">Active Sprint</span>
      </div>
      ${tableContentHtml}
    `;
    leftCol.appendChild(tableCard);
    layout.appendChild(leftCol);

    // Right Column: Capacity Model Card
    const rightCol = document.createElement('div');
    rightCol.className = 'card backlog-sidebar-card';

    const totalSum = this.items.reduce((sum, item) => sum + (item.sizingTerms || 0), 0);
    const hwItems = this.items.filter(i => i.subsystem === 'Hardware');
    const swItems = this.items.filter(i => i.subsystem === 'Software');

    const hwSum = hwItems.reduce((sum, item) => sum + (item.sizingTerms || 0), 0);
    const swSum = swItems.reduce((sum, item) => sum + (item.sizingTerms || 0), 0);
    const headcountNeeded = (totalSum / this.totalTerms).toFixed(1);

    rightCol.innerHTML = `
      <div class="card-header">
        <div class="card-title">Division Capacity Model</div>
      </div>

      <div class="capacity-stats-list">
        <div class="capacity-stat-row">
          <span class="capacity-stat-label">Hardware Backlog</span>
          <span class="capacity-stat-val font-mono">${hwSum.toFixed(1)} member-terms</span>
        </div>
        <div class="capacity-stat-row">
          <span class="capacity-stat-label">Software Backlog</span>
          <span class="capacity-stat-val font-mono">${swSum.toFixed(1)} member-terms</span>
        </div>
        <div class="capacity-stat-row total-row">
          <span class="capacity-stat-label">Total Backlog Effort</span>
          <span class="capacity-stat-val font-mono">${totalSum.toFixed(1)} member-terms</span>
        </div>
      </div>

      <div class="capacity-calc-box">
        <div class="calc-field-group">
          <label class="calc-label" for="input-terms-count">Allocated Academic Terms</label>
          <div class="calc-input-row">
            <input type="number" id="input-terms-count" min="1" max="8" value="${this.totalTerms}" class="form-input font-mono" />
            <span class="calc-subtext">terms (Fall 26 + Winter 27)</span>
          </div>
        </div>

        <div class="headcount-result-box">
          <div class="headcount-label">Active Members Required per Term</div>
          <div class="headcount-val font-mono" id="display-headcount">${headcountNeeded}</div>
          <div class="headcount-note">Dedicated members contributing ~5–8 hrs/week</div>
        </div>
      </div>

      <div class="recruitment-helper-box">
        <div class="helper-head">
          ${getIconSvg('info', 16)}
          <strong>Work Session Guidance</strong>
        </div>
        <p class="helper-text">
          During work sessions, leads prioritize <strong>Priority 1</strong> tasks (flight computer schematics, power bring-up, watchdog timer). New recruits work on <strong>Starter Mini-Projects</strong>.
        </p>
      </div>
    `;

    layout.appendChild(rightCol);
    this.container.appendChild(layout);

    this.bindEvents();
  }

  private getActiveFilterDescription(): string {
    const parts: string[] = [];
    if (this.selectedSubsystem !== 'all') {
      const names: Record<number, string> = {
        1: 'Subsystem 01: STM32 Flight Computer',
        2: 'Subsystem 02: Power & Switching',
        3: 'Subsystem 03: Flight Software & RTOS',
        4: 'Subsystem 04: RF & Telemetry',
        5: 'Subsystem 05: Ground Station & Web',
        6: 'Subsystem 06: Airframe & Mechanical'
      };
      parts.push(names[this.selectedSubsystem] || `Subsystem ${this.selectedSubsystem}`);
    }
    if (this.selectedCategory !== 'all') {
      if (this.selectedCategory === 'starter') parts.push('Starter Projects');
      else parts.push(`${this.selectedCategory} Tasks`);
    }
    if (this.selectedTrack !== 'all') {
      const trackNames: Record<string, string> = {
        hardware: 'Hardware & PCB',
        firmware: 'Firmware & RTOS',
        algorithms: 'Algorithms & UKF',
        rf: 'RF & Telemetry',
        fullstack: 'Full-Stack Web'
      };
      parts.push(trackNames[this.selectedTrack] || `${this.selectedTrack}`);
    }
    if (this.selectedPriority !== 'all') {
      parts.push(`Priority ${this.selectedPriority}`);
    }
    if (this.searchQuery.trim()) {
      parts.push(`"${this.searchQuery}"`);
    }
    return parts.join(' • ') || 'Custom Filter';
  }

  private getFilteredItems(): BacklogItem[] {
    return this.items.filter(item => {
      // 1. Subsystem filter
      if (this.selectedSubsystem !== 'all') {
        if (item.subsystemId !== this.selectedSubsystem) return false;
      }

      // 2. Category filter
      if (this.selectedCategory === 'starter') {
        if (!item.isStarterProject) return false;
      } else if (this.selectedCategory !== 'all') {
        if (item.subsystem !== this.selectedCategory) return false;
      }

      // 3. Track filter
      if (this.selectedTrack !== 'all') {
        if (item.track !== this.selectedTrack) return false;
      }

      // 4. Priority filter
      if (this.selectedPriority !== 'all') {
        if (String(item.priority) !== this.selectedPriority) return false;
      }

      // 5. Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const text = `${item.title} ${item.notes} ${item.subsystem} ${item.subsystemName || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }

  private getPriorityClass(p: string | number): string {
    const pStr = String(p);
    if (pStr === '1') return 'p-p1';
    if (pStr === '2') return 'p-p2';
    if (pStr === '3') return 'p-p3';
    if (pStr === '4') return 'p-p4';
    if (pStr === '5') return 'p-p5';
    return 'p-other';
  }

  private bindEvents() {
    // Category pill buttons
    this.container.querySelectorAll('.backlog-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category') as 'all' | 'Hardware' | 'Software' | 'starter';
        if (cat) {
          this.selectedCategory = cat;
          this.render();
        }
      });
    });

    // Search input
    const searchInput = this.container.querySelector('#backlog-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
      const newSearchInput = this.container.querySelector('#backlog-search-input') as HTMLInputElement;
      if (newSearchInput) {
        newSearchInput.focus();
        newSearchInput.setSelectionRange(newSearchInput.value.length, newSearchInput.value.length);
      }
    });

    // Dropdown filters
    this.container.querySelector('#backlog-subsystem-select')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      this.selectedSubsystem = val === 'all' ? 'all' : parseInt(val, 10);
      this.render();
    });

    this.container.querySelector('#backlog-track-select')?.addEventListener('change', (e) => {
      this.selectedTrack = (e.target as HTMLSelectElement).value as 'all' | SkillTrackId;
      this.render();
    });

    this.container.querySelector('#backlog-priority-select')?.addEventListener('change', (e) => {
      this.selectedPriority = (e.target as HTMLSelectElement).value;
      this.render();
    });

    // Clear filter buttons
    this.container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    this.container.querySelector('#btn-empty-clear-filters')?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    this.container.querySelector('#btn-empty-view-roadmap')?.addEventListener('click', () => {
      if (this.onNavigateToRoadmap) {
        this.onNavigateToRoadmap();
      }
    });

    // Terms count input
    const termsInput = this.container.querySelector('#input-terms-count') as HTMLInputElement;
    termsInput?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val > 0) {
        this.totalTerms = val;
        const totalSum = this.items.reduce((sum, item) => sum + (item.sizingTerms || 0), 0);
        const headcountEl = this.container.querySelector('#display-headcount');
        if (headcountEl) {
          headcountEl.textContent = (totalSum / this.totalTerms).toFixed(1);
        }
      }
    });

    // Task inspect buttons
    this.container.querySelectorAll('.btn-inspect-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        const item = this.items.find(t => t.id === taskId);
        if (item && this.onTaskSelect) {
          this.onTaskSelect(item);
        }
      });
    });

    // Row click to inspect
    this.container.querySelectorAll('.backlog-data-row').forEach(row => {
      row.addEventListener('click', () => {
        const taskId = row.getAttribute('data-task-id');
        const item = this.items.find(t => t.id === taskId);
        if (item && this.onTaskSelect) {
          this.onTaskSelect(item);
        }
      });
    });
  }
}
