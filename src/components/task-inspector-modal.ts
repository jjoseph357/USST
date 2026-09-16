import { ScheduleTask, BacklogItem } from '../types/schedule';
import { diffDays, formatFullDisplayDate } from '../domain/date-utils';
import { getIconSvg } from '../utils/icons';

export class TaskInspectorModal {
  private backdrop: HTMLElement;
  private currentTask: ScheduleTask | null = null;
  private currentBacklogItem: BacklogItem | null = null;
  private allTasks: ScheduleTask[] = [];

  constructor() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    document.body.appendChild(this.backdrop);

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.backdrop.classList.contains('open')) {
        this.close();
      }
    });
  }

  public open(task: ScheduleTask, allTasks: ScheduleTask[]) {
    this.currentTask = task;
    this.currentBacklogItem = null;
    this.allTasks = allTasks;
    this.renderTask();
    this.backdrop.classList.add('open');
  }

  public openBacklogItem(item: BacklogItem) {
    this.currentBacklogItem = item;
    this.currentTask = null;
    this.renderBacklogItem();
    this.backdrop.classList.add('open');
  }

  public close() {
    this.backdrop.classList.remove('open');
  }

  private renderTask() {
    if (!this.currentTask) return;
    const task = this.currentTask;
    const days = diffDays(task.startDate, task.endDate) + 1;

    const predecessorTitles = task.dependencies
      .map(id => this.allTasks.find(t => t.id === id)?.title || id)
      .filter(Boolean);

    this.backdrop.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-head">
          <h3>${task.title}</h3>
          <button class="modal-close-icon" id="inspector-close" aria-label="Close modal">${getIconSvg('x', 18)}</button>
        </div>
        <div class="modal-body">
          <div class="modal-notice">
            <strong>Roadmap Milestone:</strong> Part of the USST Avionics flight preparation for Launch Canada 2027.
          </div>

          <div class="inspector-grid-2">
            <div>
              <div class="inspector-label">Category</div>
              <div class="inspector-val">${task.category}</div>
            </div>
            <div>
              <div class="inspector-label">Type</div>
              <div class="inspector-val">${task.isMilestone ? 'Review Gate / Milestone' : 'Engineering Phase'}</div>
            </div>
          </div>

          <div class="inspector-grid-2">
            <div>
              <div class="inspector-label">Start Date</div>
              <div class="inspector-val font-mono">${formatFullDisplayDate(task.startDate)}</div>
            </div>
            <div>
              <div class="inspector-label">Target Completion</div>
              <div class="inspector-val font-mono">${formatFullDisplayDate(task.endDate)}</div>
            </div>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <div class="inspector-label">Duration</div>
            <div class="inspector-val font-mono">${days} calendar day${days > 1 ? 's' : ''}</div>
          </div>

          ${predecessorTitles.length ? `
            <div style="margin-bottom: 0.75rem;">
              <div class="inspector-label">Predecessor Dependencies</div>
              <ul class="predecessor-list">
                ${predecessorTitles.map(t => `<li>${getIconSvg('chevronRight', 12)} <span>${t}</span></li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${task.assignees.length ? `
            <div style="margin-bottom: 0.75rem;">
              <div class="inspector-label">Assigned Leads</div>
              <div class="inspector-subval">${task.assignees.join(', ')}</div>
            </div>
          ` : ''}

          ${task.notes ? `
            <div style="margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
              <div class="inspector-label">Scope &amp; Technical Deliverables</div>
              <p class="inspector-notes">${task.notes}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.backdrop.querySelector('#inspector-close')?.addEventListener('click', () => this.close());
  }

  private renderBacklogItem() {
    if (!this.currentBacklogItem) return;
    const item = this.currentBacklogItem;

    this.backdrop.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-head">
          <div>
            <div class="chip-row" style="margin-bottom: 0.35rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <span class="badge ${item.subsystem === 'Hardware' ? 'badge-info' : 'badge-primary'}">${item.subsystem}</span>
              ${item.subsystemName ? `<span class="badge badge-neutral">${item.subsystemName}</span>` : ''}
              <span class="badge badge-warning">Priority ${item.priority}</span>
              ${item.isStarterProject ? `<span class="badge badge-success">${getIconSvg('leaf', 11)} Starter Mini-Project</span>` : ''}
            </div>
            <h3 style="font-size: 1.15rem; line-height: 1.3;">${item.title}</h3>
          </div>
          <button class="modal-close-icon" id="inspector-close" aria-label="Close modal">${getIconSvg('x', 18)}</button>
        </div>
        <div class="modal-body">
          <div class="modal-notice">
            <strong>Work Session Task:</strong> Available to pick up and build during weekly USST Avionics work sessions.
          </div>

          <div class="inspector-grid-2">
            <div>
              <div class="inspector-label">Effort Sizing</div>
              <div class="inspector-val font-mono">${item.sizingTerms !== undefined ? `${item.sizingTerms} Member-Terms` : 'General Task'}</div>
            </div>
            <div>
              <div class="inspector-label">Current Status</div>
              <div class="inspector-val" style="text-transform: capitalize;">${item.status.replace('-', ' ')}</div>
            </div>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <div class="inspector-label">Technical Track</div>
            <div class="inspector-val" style="text-transform: capitalize;">${item.track || item.subsystem}</div>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <div class="inspector-label">Description &amp; Objectives</div>
            <p class="inspector-notes">${item.notes}</p>
          </div>

          <div class="inspector-callout-box">
            <div class="inspector-callout-title">
              ${getIconSvg('info', 14)} How to get started on this task
            </div>
            <div class="inspector-callout-text" style="margin-bottom: 0.65rem;">
              Attend our next Avionics work session or reach out in our Discord server. Leads provide hardware schematics, dev boards, simulation models, and repo access.
            </div>
            <a href="https://discord.gg/VB9yJc5Qg" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-discord">
              ${getIconSvg('discord', 12)} Join Discord discussion
            </a>
          </div>
        </div>
      </div>
    `;

    this.backdrop.querySelector('#inspector-close')?.addEventListener('click', () => this.close());
  }
}
