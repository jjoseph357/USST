import { ScheduleTask, CategoryFilterState } from '../types/schedule';
import { parseDateUTC, addDays, diffDays, formatDisplayDate } from '../domain/date-utils';
import { shiftTask, stretchTask, getTimelineBounds } from '../domain/schedule-graph';

export type GanttZoom = 'day' | 'week' | 'month';

export interface GanttOptions {
  container: HTMLElement;
  tasks: ScheduleTask[];
  filters: CategoryFilterState;
  zoom: GanttZoom;
  onTaskChange: (updatedTasks: ScheduleTask[]) => void;
  onTaskSelect: (task: ScheduleTask) => void;
}

export class GanttChart {
  private container: HTMLElement;
  private tasks: ScheduleTask[] = [];
  private filters: CategoryFilterState;
  private zoom: GanttZoom;
  private onTaskChange: (tasks: ScheduleTask[]) => void;
  private onTaskSelect: (task: ScheduleTask) => void;

  private svg!: SVGSVGElement;
  private tooltipEl!: HTMLElement;

  private rowHeight = 44;
  private headerHeight = 56;
  private sidebarWidth = 260;
  private dayWidth = 28; // will adjust by zoom

  private minDateIso = '2026-09-01';
  private maxDateIso = '2027-08-31';
  private totalDays = 365;

  private dragAction: {
    type: 'move' | 'stretch-start' | 'stretch-end';
    taskId: string;
    startX: number;
    initialStartDate: string;
    initialEndDate: string;
  } | null = null;

  constructor(options: GanttOptions) {
    this.container = options.container;
    this.tasks = options.tasks;
    this.filters = options.filters;
    this.zoom = options.zoom;
    this.onTaskChange = options.onTaskChange;
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
    
    // Create tooltip
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'gantt-tooltip';
    this.container.appendChild(this.tooltipEl);

    // Create scroll wrapper
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'gantt-scroll-container';
    this.container.appendChild(scrollWrapper);

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('gantt-svg');
    scrollWrapper.appendChild(this.svg);

    // Attach drag event listeners on window
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());

    this.render();
  }

  private getFilteredTasks(): ScheduleTask[] {
    return this.tasks.filter(t => {
      const cat = t.category;
      return this.filters[cat] !== false;
    });
  }

  private calculateMetrics() {
    if (this.zoom === 'day') {
      this.dayWidth = 32;
    } else if (this.zoom === 'week') {
      this.dayWidth = 14;
    } else {
      this.dayWidth = 5.5; // month zoom
    }

    const bounds = getTimelineBounds(this.tasks);
    // Pad bounds by 14 days before and after
    this.minDateIso = addDays(bounds.minDate, -10);
    this.maxDateIso = addDays(bounds.maxDate, 20);
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
    const chartHeight = this.headerHeight + (visibleTasks.length * this.rowHeight) + 40;

    this.svg.setAttribute('width', `${chartWidth}`);
    this.svg.setAttribute('height', `${chartHeight}`);
    this.svg.innerHTML = '';

    // Defs for arrow markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="dep-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
      </marker>
    `;
    this.svg.appendChild(defs);

    // 1. Render Background & Grid
    this.renderGrid(chartWidth, chartHeight, visibleTasks.length);

    // 2. Render Header
    this.renderHeader(chartWidth);

    // 3. Render Dependencies
    this.renderDependencies(visibleTasks);

    // 4. Render Task Rows & Bars
    this.renderTaskRows(visibleTasks);
  }

  private renderGrid(chartWidth: number, chartHeight: number, rowCount: number) {
    // Horizontal row alternating backgrounds and lines
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

    // Vertical day/week lines
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
    // Header background
    const headerBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    headerBg.setAttribute('x', '0');
    headerBg.setAttribute('y', '0');
    headerBg.setAttribute('width', `${chartWidth}`);
    headerBg.setAttribute('height', `${this.headerHeight}`);
    headerBg.setAttribute('class', 'gantt-header-bg');
    this.svg.appendChild(headerBg);

    // Sidebar Title
    const sidebarTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sidebarTitle.setAttribute('x', '16');
    sidebarTitle.setAttribute('y', '34');
    sidebarTitle.setAttribute('class', 'gantt-header-month');
    sidebarTitle.textContent = 'TASK / MILESTONE';
    this.svg.appendChild(sidebarTitle);

    // Timeline month and day headers
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let curDate = parseDateUTC(this.minDateIso);
    let lastMonth = -1;

    for (let d = 0; d < this.totalDays; d++) {
      const x = this.sidebarWidth + (d * this.dayWidth);
      const m = curDate.getUTCMonth();
      const dayOfMonth = curDate.getUTCDate();

      // Month label
      if (m !== lastMonth) {
        lastMonth = m;
        const monthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        monthText.setAttribute('x', `${x + 6}`);
        monthText.setAttribute('y', '22');
        monthText.setAttribute('class', 'gantt-header-month');
        monthText.textContent = `${months[m]} ${curDate.getUTCFullYear()}`;
        this.svg.appendChild(monthText);
      }

      // Day / interval text
      if (this.zoom === 'day') {
        const dayText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dayText.setAttribute('x', `${x + (this.dayWidth / 2)}`);
        dayText.setAttribute('y', '44');
        dayText.setAttribute('text-anchor', 'middle');
        dayText.setAttribute('class', 'gantt-header-text');
        dayText.textContent = `${dayOfMonth}`;
        this.svg.appendChild(dayText);
      } else if (this.zoom === 'week' && curDate.getUTCDay() === 1) {
        const weekText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        weekText.setAttribute('x', `${x + 4}`);
        weekText.setAttribute('y', '44');
        weekText.setAttribute('class', 'gantt-header-text');
        weekText.textContent = `W${dayOfMonth}`;
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

        // Draw bezier curve connector
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midX = sourceX + Math.max(12, (targetX - sourceX) / 2);
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
      
      // Sidebar row text and category color indicator
      const rowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      rowGroup.style.cursor = 'pointer';
      rowGroup.addEventListener('click', () => this.onTaskSelect(task));

      const catIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      catIndicator.setAttribute('cx', '18');
      catIndicator.setAttribute('cy', `${y + (this.rowHeight / 2)}`);
      catIndicator.setAttribute('r', '5');
      catIndicator.setAttribute('class', `gantt-task-bar cat-${task.category}`);
      rowGroup.appendChild(catIndicator);

      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', '32');
      titleText.setAttribute('y', `${y + (this.rowHeight / 2) + 4}`);
      titleText.setAttribute('fill', '#f8fafc');
      titleText.setAttribute('font-size', '12px');
      titleText.setAttribute('font-weight', '600');
      
      let displayTitle = task.title;
      if (displayTitle.length > 28) {
        displayTitle = displayTitle.slice(0, 26) + '...';
      }
      titleText.textContent = displayTitle;
      rowGroup.appendChild(titleText);

      this.svg.appendChild(rowGroup);

      // Task Bar or Milestone
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
    const size = 12;

    const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const points = `${x},${centerY - size} ${x + size},${centerY} ${x},${centerY + size} ${x - size},${centerY}`;
    diamond.setAttribute('points', points);
    diamond.setAttribute('class', 'gantt-milestone-marker');

    diamond.addEventListener('mousedown', (e) => this.startDrag(e, 'move', task.id));
    diamond.addEventListener('mouseenter', (e) => this.showTooltip(e, task));
    diamond.addEventListener('mouseleave', () => this.hideTooltip());
    diamond.addEventListener('dblclick', () => this.onTaskSelect(task));

    this.svg.appendChild(diamond);

    // Label next to diamond
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', `${x + size + 8}`);
    label.setAttribute('y', `${centerY + 4}`);
    label.setAttribute('class', 'gantt-task-label');
    label.setAttribute('fill', '#f59e0b');
    label.textContent = `${task.title} (${formatDisplayDate(task.startDate)})`;
    this.svg.appendChild(label);
  }

  private renderBar(task: ScheduleTask, y: number) {
    const startX = this.dateToX(task.startDate);
    const endX = this.dateToX(task.endDate);
    const width = Math.max(8, endX - startX);
    const barHeight = 26;
    const barY = y + (this.rowHeight - barHeight) / 2;

    const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Main task bar
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', `${startX}`);
    bar.setAttribute('y', `${barY}`);
    bar.setAttribute('width', `${width}`);
    bar.setAttribute('height', `${barHeight}`);
    bar.setAttribute('rx', '4');
    bar.setAttribute('class', `gantt-task-bar cat-${task.category}`);

    bar.addEventListener('mousedown', (e) => this.startDrag(e, 'move', task.id));
    bar.addEventListener('mouseenter', (e) => this.showTooltip(e, task));
    bar.addEventListener('mouseleave', () => this.hideTooltip());
    bar.addEventListener('dblclick', () => this.onTaskSelect(task));
    barGroup.appendChild(bar);

    // Progress bar inside
    if (task.progress > 0 && task.progress < 100) {
      const progWidth = (width * task.progress) / 100;
      const progBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      progBar.setAttribute('x', `${startX}`);
      progBar.setAttribute('y', `${barY}`);
      progBar.setAttribute('width', `${progWidth}`);
      progBar.setAttribute('height', `${barHeight}`);
      progBar.setAttribute('rx', '4');
      progBar.setAttribute('class', 'gantt-task-progress');
      progBar.style.pointerEvents = 'none';
      barGroup.appendChild(progBar);
    }

    // Left stretch handle
    const leftHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leftHandle.setAttribute('x', `${startX}`);
    leftHandle.setAttribute('y', `${barY}`);
    leftHandle.setAttribute('width', '6');
    leftHandle.setAttribute('height', `${barHeight}`);
    leftHandle.setAttribute('class', 'gantt-resize-handle');
    leftHandle.addEventListener('mousedown', (e) => this.startDrag(e, 'stretch-start', task.id));
    barGroup.appendChild(leftHandle);

    // Right stretch handle
    const rightHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rightHandle.setAttribute('x', `${startX + width - 6}`);
    rightHandle.setAttribute('y', `${barY}`);
    rightHandle.setAttribute('width', '6');
    rightHandle.setAttribute('height', `${barHeight}`);
    rightHandle.setAttribute('class', 'gantt-resize-handle');
    rightHandle.addEventListener('mousedown', (e) => this.startDrag(e, 'stretch-end', task.id));
    barGroup.appendChild(rightHandle);

    // Task label inside or adjacent to bar
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    if (width > 80) {
      label.setAttribute('x', `${startX + 10}`);
      label.setAttribute('y', `${barY + 17}`);
      label.setAttribute('class', 'gantt-task-label');
      label.textContent = task.title;
    } else {
      label.setAttribute('x', `${startX + width + 8}`);
      label.setAttribute('y', `${barY + 17}`);
      label.setAttribute('class', 'gantt-task-label');
      label.setAttribute('fill', '#cbd5e1');
      label.textContent = task.title;
    }
    barGroup.appendChild(label);

    this.svg.appendChild(barGroup);
  }

  private startDrag(e: MouseEvent, type: 'move' | 'stretch-start' | 'stretch-end', taskId: string) {
    e.stopPropagation();
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.dragAction = {
      type,
      taskId,
      startX: e.clientX,
      initialStartDate: task.startDate,
      initialEndDate: task.endDate
    };
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.dragAction) return;

    const deltaPixels = e.clientX - this.dragAction.startX;
    const deltaDays = Math.round(deltaPixels / this.dayWidth);

    if (this.dragAction.type === 'move') {
      const updated = shiftTask(this.tasks, this.dragAction.taskId, deltaDays, true);
      this.tasks = updated;
      this.render();
    } else if (this.dragAction.type === 'stretch-start') {
      const newStartDate = addDays(this.dragAction.initialStartDate, deltaDays);
      const updated = stretchTask(this.tasks, this.dragAction.taskId, newStartDate, 'start', true);
      this.tasks = updated;
      this.render();
    } else if (this.dragAction.type === 'stretch-end') {
      const newEndDate = addDays(this.dragAction.initialEndDate, deltaDays);
      const updated = stretchTask(this.tasks, this.dragAction.taskId, newEndDate, 'end', true);
      this.tasks = updated;
      this.render();
    }
  }

  private handleMouseUp() {
    if (this.dragAction) {
      this.dragAction = null;
      this.onTaskChange(this.tasks);
    }
  }

  private showTooltip(e: MouseEvent, task: ScheduleTask) {
    const days = diffDays(task.startDate, task.endDate) + 1;
    this.tooltipEl.innerHTML = `
      <div class="tooltip-title">${task.title}</div>
      <div class="tooltip-row"><span>Category:</span> <strong>${task.category}</strong></div>
      <div class="tooltip-row"><span>Timeline:</span> <span>${formatDisplayDate(task.startDate)} – ${formatDisplayDate(task.endDate)}</span></div>
      <div class="tooltip-row"><span>Duration:</span> <span>${days} day${days > 1 ? 's' : ''}</span></div>
      <div class="tooltip-row"><span>Progress:</span> <span>${task.progress}%</span></div>
      ${task.assignees.length ? `<div class="tooltip-row"><span>Assignees:</span> <span>${task.assignees.join(', ')}</span></div>` : ''}
      ${task.notes ? `<div style="margin-top: 6px; font-size: 11px; color: #94a3b8;">${task.notes}</div>` : ''}
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
