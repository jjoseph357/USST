import { ScheduleTask, CategoryFilterState } from '../types/schedule';
import { parseDateUTC, addDays, diffDays, formatDisplayDate } from '../domain/date-utils';
import { getTimelineBounds } from '../domain/schedule-graph';

export type GanttZoom = 'day' | 'week' | 'month';

export interface GanttOptions {
  container: HTMLElement;
  tasks: ScheduleTask[];
  filters: CategoryFilterState;
  zoom: GanttZoom;
  onTaskSelect: (task: ScheduleTask) => void;
}

export class GanttChart {
  private container: HTMLElement;
  private tasks: ScheduleTask[] = [];
  private filters: CategoryFilterState;
  private zoom: GanttZoom;
  private onTaskSelect: (task: ScheduleTask) => void;

  private svg!: SVGSVGElement;
  private tooltipEl!: HTMLElement;

  private rowHeight = 40;
  private headerHeight = 50;
  private sidebarWidth = 280;
  private dayWidth = 20;

  private minDateIso = '2026-09-01';
  private maxDateIso = '2027-08-31';
  private totalDays = 365;

  constructor(options: GanttOptions) {
    this.container = options.container;
    this.tasks = options.tasks;
    this.filters = options.filters;
    this.zoom = options.zoom;
    this.onTaskSelect = options.onTaskSelect;

    this.init();
  }

  public update(tasks: ScheduleTask[], filters: CategoryFilterState, zoom: GanttZoom) {
    this.tasks = tasks;
    this.filters = filters;
    this.zoom = zoom;
    this.render();
  }

  private init() {
    this.container.innerHTML = '';

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'gantt-tooltip';
    this.container.appendChild(this.tooltipEl);

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'gantt-scroll-container';
    this.container.appendChild(scrollWrapper);

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('gantt-svg');
    scrollWrapper.appendChild(this.svg);

    this.render();
  }

  private getFilteredTasks(): ScheduleTask[] {
    return this.tasks.filter(t => this.filters[t.category] !== false);
  }

  private calculateMetrics() {
    if (this.zoom === 'day') {
      this.dayWidth = 28;
    } else if (this.zoom === 'week') {
      this.dayWidth = 12;
    } else {
      this.dayWidth = 5.2;
    }

    const bounds = getTimelineBounds(this.tasks);
    this.minDateIso = addDays(bounds.minDate, -8);
    this.maxDateIso = addDays(bounds.maxDate, 14);
    this.totalDays = Math.max(30, diffDays(this.minDateIso, this.maxDateIso));
  }

  private dateToX(dateIso: string): number {
    const days = diffDays(this.minDateIso, dateIso);
    return this.sidebarWidth + (days * this.dayWidth);
  }

  public render() {
    this.calculateMetrics();
    const visibleTasks = this.getFilteredTasks();

    const chartWidth = this.sidebarWidth + (this.totalDays * this.dayWidth);
    const chartHeight = this.headerHeight + (visibleTasks.length * this.rowHeight) + 30;

    this.svg.setAttribute('width', `${chartWidth}`);
    this.svg.setAttribute('height', `${chartHeight}`);
    this.svg.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="dep-arrow" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 1 L 6 4 L 0 7 z" fill="#484f58" />
      </marker>
    `;
    this.svg.appendChild(defs);

    this.renderGrid(chartWidth, chartHeight, visibleTasks.length);
    this.renderHeader(chartWidth);
    this.renderDependencies(visibleTasks);
    this.renderTaskRows(visibleTasks);
  }

  private renderGrid(chartWidth: number, chartHeight: number, rowCount: number) {
    for (let i = 0; i < rowCount; i++) {
      const y = this.headerHeight + (i * this.rowHeight);
      const rowBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rowBg.setAttribute('x', '0');
      rowBg.setAttribute('y', `${y}`);
      rowBg.setAttribute('width', `${chartWidth}`);
      rowBg.setAttribute('height', `${this.rowHeight}`);
      rowBg.setAttribute('class', i % 2 === 0 ? 'gantt-row-even' : 'gantt-row-odd');
      this.svg.appendChild(rowBg);

      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', `${y + this.rowHeight}`);
      hLine.setAttribute('x2', `${chartWidth}`);
      hLine.setAttribute('y2', `${y + this.rowHeight}`);
      hLine.setAttribute('class', 'gantt-grid-h');
      this.svg.appendChild(hLine);
    }

    let currentDate = parseDateUTC(this.minDateIso);
    for (let day = 0; day <= this.totalDays; day++) {
      const x = this.sidebarWidth + (day * this.dayWidth);
      const isFirstOfMonth = currentDate.getUTCDate() === 1;

      if (isFirstOfMonth || this.zoom === 'day' || (this.zoom === 'week' && currentDate.getUTCDay() === 1)) {
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', `${x}`);
        vLine.setAttribute('y1', `${this.headerHeight}`);
        vLine.setAttribute('x2', `${x}`);
        vLine.setAttribute('y2', `${chartHeight}`);
        vLine.setAttribute('class', isFirstOfMonth ? 'gantt-grid-v-month' : 'gantt-grid-v');
        this.svg.appendChild(vLine);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }

  private renderHeader(chartWidth: number) {
    const headerBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    headerBg.setAttribute('x', '0');
    headerBg.setAttribute('y', '0');
    headerBg.setAttribute('width', `${chartWidth}`);
    headerBg.setAttribute('height', `${this.headerHeight}`);
    headerBg.setAttribute('class', 'gantt-header-bg');
    this.svg.appendChild(headerBg);

    const sidebarTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sidebarTitle.setAttribute('x', '16');
    sidebarTitle.setAttribute('y', '30');
    sidebarTitle.setAttribute('class', 'gantt-header-month');
    sidebarTitle.textContent = 'Deliverable / Phase';
    this.svg.appendChild(sidebarTitle);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let curDate = parseDateUTC(this.minDateIso);
    let lastMonth = -1;

    for (let d = 0; d < this.totalDays; d++) {
      const x = this.sidebarWidth + (d * this.dayWidth);
      const m = curDate.getUTCMonth();
      const dayOfMonth = curDate.getUTCDate();

      if (m !== lastMonth) {
        lastMonth = m;
        const monthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        monthText.setAttribute('x', `${x + 4}`);
        monthText.setAttribute('y', '20');
        monthText.setAttribute('class', 'gantt-header-month');
        monthText.textContent = `${months[m]} ${curDate.getUTCFullYear()}`;
        this.svg.appendChild(monthText);
      }

      if (this.zoom === 'day') {
        const dayText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dayText.setAttribute('x', `${x + (this.dayWidth / 2)}`);
        dayText.setAttribute('y', '40');
        dayText.setAttribute('text-anchor', 'middle');
        dayText.setAttribute('class', 'gantt-header-text');
        dayText.textContent = `${dayOfMonth}`;
        this.svg.appendChild(dayText);
      } else if (this.zoom === 'week' && curDate.getUTCDay() === 1) {
        const weekText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        weekText.setAttribute('x', `${x + 2}`);
        weekText.setAttribute('y', '40');
        weekText.setAttribute('class', 'gantt-header-text');
        weekText.textContent = `${dayOfMonth}`;
        this.svg.appendChild(weekText);
      }

      curDate.setUTCDate(curDate.getUTCDate() + 1);
    }
  }

  private renderDependencies(visibleTasks: ScheduleTask[]) {
    const taskIndexMap = new Map<string, number>();
    visibleTasks.forEach((t, idx) => taskIndexMap.set(t.id, idx));

    for (const task of visibleTasks) {
      if (!task.dependencies || task.dependencies.length === 0) continue;
      const targetIdx = taskIndexMap.get(task.id);
      if (targetIdx === undefined) continue;

      for (const predId of task.dependencies) {
        const sourceIdx = taskIndexMap.get(predId);
        if (sourceIdx === undefined) continue;

        const predTask = visibleTasks[sourceIdx];
        const sourceX = this.dateToX(predTask.endDate);
        const sourceY = this.headerHeight + (sourceIdx * this.rowHeight) + (this.rowHeight / 2);

        const targetX = this.dateToX(task.startDate);
        const targetY = this.headerHeight + (targetIdx * this.rowHeight) + (this.rowHeight / 2);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midX = sourceX + Math.max(10, (targetX - sourceX) / 2);
        const d = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'gantt-dep-line');
        path.setAttribute('marker-end', 'url(#dep-arrow)');
        this.svg.appendChild(path);
      }
    }
  }

  private renderTaskRows(visibleTasks: ScheduleTask[]) {
    visibleTasks.forEach((task, index) => {
      const y = this.headerHeight + (index * this.rowHeight);

      const rowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      rowGroup.style.cursor = 'pointer';
      rowGroup.addEventListener('click', () => this.onTaskSelect(task));

      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', '20');
      titleText.setAttribute('y', `${y + (this.rowHeight / 2) + 4}`);
      titleText.setAttribute('fill', '#f0f3f6');
      titleText.setAttribute('font-size', '12px');
      titleText.setAttribute('font-weight', '500');

      let displayTitle = task.title;
      if (displayTitle.length > 32) {
        displayTitle = displayTitle.slice(0, 30) + '...';
      }
      titleText.textContent = displayTitle;
      rowGroup.appendChild(titleText);

      this.svg.appendChild(rowGroup);

      if (task.isMilestone) {
        this.renderMilestone(task, y);
      } else {
        this.renderBar(task, y);
      }
    });
  }

  private renderMilestone(task: ScheduleTask, y: number) {
    const x = this.dateToX(task.startDate);
    const centerY = y + (this.rowHeight / 2);
    const size = 9;

    const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const points = `${x},${centerY - size} ${x + size},${centerY} ${x},${centerY + size} ${x - size},${centerY}`;
    diamond.setAttribute('points', points);
    diamond.setAttribute('class', 'gantt-milestone-marker');

    diamond.addEventListener('mouseenter', (e) => this.showTooltip(e, task));
    diamond.addEventListener('mouseleave', () => this.hideTooltip());
    diamond.addEventListener('click', () => this.onTaskSelect(task));

    this.svg.appendChild(diamond);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', `${x + size + 8}`);
    label.setAttribute('y', `${centerY + 4}`);
    label.setAttribute('class', 'gantt-task-label');
    label.setAttribute('fill', '#fbbf24');
    label.textContent = `${task.title} (${formatDisplayDate(task.startDate)})`;
    this.svg.appendChild(label);
  }

  private renderBar(task: ScheduleTask, y: number) {
    const startX = this.dateToX(task.startDate);
    const endX = this.dateToX(task.endDate);
    const width = Math.max(6, endX - startX);
    const barHeight = 22;
    const barY = y + (this.rowHeight - barHeight) / 2;

    const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    barGroup.style.cursor = 'pointer';

    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', `${startX}`);
    bar.setAttribute('y', `${barY}`);
    bar.setAttribute('width', `${width}`);
    bar.setAttribute('height', `${barHeight}`);
    bar.setAttribute('class', `gantt-task-bar cat-${task.category}`);

    bar.addEventListener('mouseenter', (e) => this.showTooltip(e, task));
    bar.addEventListener('mouseleave', () => this.hideTooltip());
    bar.addEventListener('click', () => this.onTaskSelect(task));
    barGroup.appendChild(bar);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    if (width > 90) {
      label.setAttribute('x', `${startX + 8}`);
      label.setAttribute('y', `${barY + 15}`);
      label.setAttribute('class', 'gantt-task-label');
      label.textContent = task.title;
    } else {
      label.setAttribute('x', `${startX + width + 8}`);
      label.setAttribute('y', `${barY + 15}`);
      label.setAttribute('class', 'gantt-task-label');
      label.setAttribute('fill', '#94a3b8');
      label.textContent = task.title;
    }
    barGroup.appendChild(label);

    this.svg.appendChild(barGroup);
  }

  private showTooltip(e: MouseEvent, task: ScheduleTask) {
    const days = diffDays(task.startDate, task.endDate) + 1;
    this.tooltipEl.innerHTML = `
      <div class="tooltip-title">${task.title}</div>
      <div class="tooltip-row"><span>Category</span> <span>${task.category}</span></div>
      <div class="tooltip-row"><span>Dates</span> <span>${task.startDate} to ${task.endDate}</span></div>
      <div class="tooltip-row"><span>Duration</span> <span>${days} day${days > 1 ? 's' : ''}</span></div>
      ${task.assignees.length ? `<div class="tooltip-row"><span>Lead</span> <span>${task.assignees.join(', ')}</span></div>` : ''}
      ${task.notes ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #282e3d; color: #8b94a0; font-size: 11px;">${task.notes}</div>` : ''}
    `;

    const rect = this.container.getBoundingClientRect();
    this.tooltipEl.style.left = `${e.clientX - rect.left + 15}px`;
    this.tooltipEl.style.top = `${e.clientY - rect.top + 15}px`;
    this.tooltipEl.style.display = 'block';
  }

  private hideTooltip() {
    this.tooltipEl.style.display = 'none';
  }
}
