import { ScheduleTask } from '../types/schedule';
import { diffDays, formatFullDisplayDate } from '../domain/date-utils';

export class TaskInspectorModal {
  private backdrop: HTMLElement;
  private currentTask: ScheduleTask | null = null;
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
  }

  public open(task: ScheduleTask, allTasks: ScheduleTask[]) {
    this.currentTask = task;
    this.allTasks = allTasks;
    this.render();
    this.backdrop.classList.add('open');
  }

  public close() {
    this.backdrop.classList.remove('open');
  }

  private render() {
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
          <button class="modal-close-icon" id="inspector-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="padding: 0.65rem 0.85rem; background: var(--bg-surface-raised); border: 1px solid var(--border-default); border-radius: 4px; margin-bottom: 1rem; font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
            <strong style="color: var(--text-main);">Controlled by Google Sheets:</strong><br>
            All dates and dependencies are synced from the shared Google Sheet. To adjust timelines, update the corresponding row in your team's spreadsheet.
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Category</div>
              <div style="font-size: 0.85rem; font-weight: 500; margin-top: 0.2rem;">${task.category}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Type</div>
              <div style="font-size: 0.85rem; font-weight: 500; margin-top: 0.2rem;">${task.isMilestone ? 'Milestone' : 'Task / Phase'}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Start Date</div>
              <div style="font-size: 0.85rem; font-family: var(--font-mono); margin-top: 0.2rem;">${formatFullDisplayDate(task.startDate)}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Target Completion</div>
              <div style="font-size: 0.85rem; font-family: var(--font-mono); margin-top: 0.2rem;">${formatFullDisplayDate(task.endDate)}</div>
            </div>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Duration</div>
            <div style="font-size: 0.85rem; font-family: var(--font-mono); margin-top: 0.2rem;">${days} calendar day${days > 1 ? 's' : ''}</div>
          </div>

          ${predecessorTitles.length ? `
            <div style="margin-bottom: 0.75rem;">
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Predecessors</div>
              <ul style="margin-left: 1.2rem; font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">
                ${predecessorTitles.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${task.assignees.length ? `
            <div style="margin-bottom: 0.75rem;">
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Assigned Leads</div>
              <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">${task.assignees.join(', ')}</div>
            </div>
          ` : ''}

          ${task.notes ? `
            <div style="margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">Scope &amp; Technical Notes</div>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.3rem; line-height: 1.5;">${task.notes}</p>
            </div>
          ` : ''}
        </div>
        <div class="modal-foot">
          <button class="btn btn-default" id="inspector-dismiss">Close</button>
        </div>
      </div>
    `;

    this.backdrop.querySelector('#inspector-close')?.addEventListener('click', () => this.close());
    this.backdrop.querySelector('#inspector-dismiss')?.addEventListener('click', () => this.close());
  }
}
