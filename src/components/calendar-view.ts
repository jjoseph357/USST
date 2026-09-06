import { ScheduleTask, CategoryFilterState } from '../types/schedule';
import { formatDateUTC, isDateInRange } from '../domain/date-utils';

export interface CalendarOptions {
  container: HTMLElement;
  tasks: ScheduleTask[];
  filters: CategoryFilterState;
  onTaskSelect: (task: ScheduleTask) => void;
}

export class CalendarView {
  private container: HTMLElement;
  private tasks: ScheduleTask[] = [];
  private filters: CategoryFilterState;
  private onTaskSelect: (task: ScheduleTask) => void;

  private currentYear: number;
  private currentMonth: number; // 0 to 11

  constructor(options: CalendarOptions) {
    this.container = options.container;
    this.tasks = options.tasks;
    this.filters = options.filters;
    this.onTaskSelect = options.onTaskSelect;

    // Default to Sep 2026 (Kickoff of the schedule)
    this.currentYear = 2026;
    this.currentMonth = 8; // September

    this.render();
  }

  public update(tasks: ScheduleTask[], filters: CategoryFilterState) {
    this.tasks = tasks;
    this.filters = filters;
    this.render();
  }

  private getFilteredTasks(): ScheduleTask[] {
    return this.tasks.filter(t => this.filters[t.category] !== false);
  }

  public render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-wrapper';

    // 1. Calendar Header
    const header = document.createElement('div');
    header.className = 'calendar-header';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const title = document.createElement('div');
    title.className = 'calendar-month-title';
    title.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
    header.appendChild(title);

    const nav = document.createElement('div');
    nav.className = 'calendar-nav-controls';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary';
    prevBtn.textContent = '← Prev';
    prevBtn.addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.render();
    });
    nav.appendChild(prevBtn);

    const todayBtn = document.createElement('button');
    todayBtn.className = 'btn btn-secondary';
    todayBtn.textContent = 'Kickoff (Sep 2026)';
    todayBtn.addEventListener('click', () => {
      this.currentYear = 2026;
      this.currentMonth = 8;
      this.render();
    });
    nav.appendChild(todayBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary';
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.render();
    });
    nav.appendChild(nextBtn);

    header.appendChild(nav);
    wrapper.appendChild(header);

    // 2. Day names header
    const daysHeader = document.createElement('div');
    daysHeader.className = 'calendar-grid-header';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const d of dayNames) {
      const col = document.createElement('div');
      col.textContent = d;
      daysHeader.appendChild(col);
    }
    wrapper.appendChild(daysHeader);

    // 3. Calendar Day Cells
    const gridDays = document.createElement('div');
    gridDays.className = 'calendar-grid-days';

    const firstDayOfMonth = new Date(Date.UTC(this.currentYear, this.currentMonth, 1));
    const startingDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 (Sun) to 6 (Sat)
    
    // Days in current month
    const lastDayOfMonth = new Date(Date.UTC(this.currentYear, this.currentMonth + 1, 0));
    const totalDaysInMonth = lastDayOfMonth.getUTCDate();

    // Days in previous month
    const lastDayOfPrevMonth = new Date(Date.UTC(this.currentYear, this.currentMonth, 0));
    const totalDaysInPrevMonth = lastDayOfPrevMonth.getUTCDate();

    const visibleTasks = this.getFilteredTasks();

    // Previous month filler days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevMonthIdx = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      const cellDate = formatDateUTC(new Date(Date.UTC(prevYear, prevMonthIdx, dayNum)));

      const cell = this.createDayCell(dayNum, cellDate, true, visibleTasks);
      gridDays.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const cellDate = formatDateUTC(new Date(Date.UTC(this.currentYear, this.currentMonth, day)));
      const cell = this.createDayCell(day, cellDate, false, visibleTasks);
      gridDays.appendChild(cell);
    }

    // Next month filler days
    const totalCellsRendered = startingDayOfWeek + totalDaysInMonth;
    const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthIdx = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      const cellDate = formatDateUTC(new Date(Date.UTC(nextYear, nextMonthIdx, day)));

      const cell = this.createDayCell(day, cellDate, true, visibleTasks);
      gridDays.appendChild(cell);
    }

    wrapper.appendChild(gridDays);
    this.container.appendChild(wrapper);
  }

  private createDayCell(
    dayNum: number,
    cellDateIso: string,
    isOutsideMonth: boolean,
    tasks: ScheduleTask[]
  ): HTMLElement {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    if (isOutsideMonth) cell.classList.add('outside-month');

    const dayNumberEl = document.createElement('div');
    dayNumberEl.className = 'day-number';
    dayNumberEl.textContent = `${dayNum}`;
    cell.appendChild(dayNumberEl);

    // Find all tasks that overlap with this date
    const dayTasks = tasks.filter(t => isDateInRange(cellDateIso, t.startDate, t.endDate));

    for (const task of dayTasks) {
      const eventItem = document.createElement('div');
      eventItem.className = 'calendar-event-item';

      let catClass = 'event-hw';
      if (task.category === 'avionics-sw') catClass = 'event-sw';
      else if (task.category === 'milestone') catClass = 'event-milestone';
      else if (task.category === 'university') catClass = 'event-university';
      else if (task.category === 'work-session') catClass = 'event-session';

      eventItem.classList.add(catClass);
      
      const isStart = task.startDate === cellDateIso;
      const prefix = task.isMilestone ? '◆ ' : (isStart ? '▶ ' : '');

      eventItem.textContent = `${prefix}${task.title}`;
      eventItem.title = `${task.title} (${task.startDate} to ${task.endDate})\nCategory: ${task.category}\nAssignees: ${task.assignees.join(', ')}`;
      
      eventItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTaskSelect(task);
      });

      cell.appendChild(eventItem);
    }

    return cell;
  }
}
