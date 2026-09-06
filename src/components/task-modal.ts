import { ScheduleTask, TaskCategory } from '../types/schedule';

export interface TaskModalOptions {
  onSave: (task: ScheduleTask, isNew: boolean) => void;
  onDelete: (taskId: string) => void;
}

export class TaskModal {
  private overlay: HTMLElement;
  private onSave: (task: ScheduleTask, isNew: boolean) => void;
  private onDelete: (taskId: string) => void;

  private currentTask: ScheduleTask | null = null;
  private allTasks: ScheduleTask[] = [];
  private isNew = false;

  constructor(options: TaskModalOptions) {
    this.onSave = options.onSave;
    this.onDelete = options.onDelete;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  public open(task: ScheduleTask | null, allTasks: ScheduleTask[]) {
    this.allTasks = allTasks;
    this.isNew = task === null;

    if (task) {
      this.currentTask = { ...task, dependencies: [...task.dependencies], assignees: [...task.assignees] };
    } else {
      const today = new Date().toISOString().split('T')[0];
      this.currentTask = {
        id: `task-${Date.now().toString(36)}`,
        title: '',
        category: 'avionics-hw',
        startDate: today,
        endDate: today,
        progress: 0,
        dependencies: [],
        assignees: [],
        notes: '',
        isMilestone: false
      };
    }

    this.render();
    this.overlay.classList.add('open');
  }

  public close() {
    this.overlay.classList.remove('open');
  }

  private render() {
    if (!this.currentTask) return;
    const task = this.currentTask;

    const otherTasks = this.allTasks.filter(t => t.id !== task.id);

    this.overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">${this.isNew ? 'Add New Schedule Item' : 'Edit Schedule Item'}</div>
          <button class="modal-close-btn" id="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input type="text" id="task-title" class="form-input" value="${task.title}" placeholder="e.g. Power Testing" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="task-category" class="form-select">
                <option value="avionics-hw" ${task.category === 'avionics-hw' ? 'selected' : ''}>Avionics Hardware</option>
                <option value="avionics-sw" ${task.category === 'avionics-sw' ? 'selected' : ''}>Avionics Software</option>
                <option value="milestone" ${task.category === 'milestone' ? 'selected' : ''}>Milestones & Reviews</option>
                <option value="university" ${task.category === 'university' ? 'selected' : ''}>University Dates</option>
                <option value="work-session" ${task.category === 'work-session' ? 'selected' : ''}>Work Sessions</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Milestone Marker</label>
              <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="task-is-milestone" ${task.isMilestone ? 'checked' : ''} />
                <span>Display as Milestone Diamond</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="task-start-date" class="form-input" value="${task.startDate}" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" id="task-end-date" class="form-input" value="${task.endDate}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Progress: <span id="progress-val">${task.progress}%</span></label>
            <input type="range" id="task-progress" class="form-input" min="0" max="100" value="${task.progress}" />
          </div>

          <div class="form-group">
            <label class="form-label">Predecessor Dependencies</label>
            <select id="task-dependencies" class="form-select" multiple size="4" style="height: auto;">
              ${otherTasks.map(t => `
                <option value="${t.id}" ${task.dependencies.includes(t.id) ? 'selected' : ''}>
                  ${t.title} (${t.startDate} to ${t.endDate})
                </option>
              `).join('')}
            </select>
            <div class="help-text">Hold Ctrl / Cmd to select multiple predecessor tasks.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Assignees (Comma-separated)</label>
            <input type="text" id="task-assignees" class="form-input" value="${task.assignees.join(', ')}" placeholder="e.g. Lead, RF Team" />
          </div>

          <div class="form-group">
            <label class="form-label">Notes & Scope</label>
            <textarea id="task-notes" class="form-textarea" rows="2" placeholder="Subsystem scope and notes...">${task.notes || ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          ${!this.isNew ? '<button class="btn btn-secondary" id="btn-delete" style="color: var(--danger); margin-right: auto;">Delete</button>' : ''}
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save">Save Changes</button>
        </div>
      </div>
    `;

    // Hook listeners
    this.overlay.querySelector('#modal-close')?.addEventListener('click', () => this.close());
    this.overlay.querySelector('#btn-cancel')?.addEventListener('click', () => this.close());

    const progressSlider = this.overlay.querySelector('#task-progress') as HTMLInputElement;
    const progressVal = this.overlay.querySelector('#progress-val') as HTMLElement;
    progressSlider?.addEventListener('input', () => {
      progressVal.textContent = `${progressSlider.value}%`;
    });

    this.overlay.querySelector('#btn-delete')?.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
        this.onDelete(task.id);
        this.close();
      }
    });

    this.overlay.querySelector('#btn-save')?.addEventListener('click', () => {
      const title = (this.overlay.querySelector('#task-title') as HTMLInputElement).value.trim();
      if (!title) {
        alert('Please enter a task title.');
        return;
      }

      const category = (this.overlay.querySelector('#task-category') as HTMLSelectElement).value as TaskCategory;
      const isMilestone = (this.overlay.querySelector('#task-is-milestone') as HTMLInputElement).checked;
      let startDate = (this.overlay.querySelector('#task-start-date') as HTMLInputElement).value;
      let endDate = (this.overlay.querySelector('#task-end-date') as HTMLInputElement).value;
      const progress = parseInt((this.overlay.querySelector('#task-progress') as HTMLInputElement).value, 10);
      const assigneesStr = (this.overlay.querySelector('#task-assignees') as HTMLInputElement).value;
      const notes = (this.overlay.querySelector('#task-notes') as HTMLTextAreaElement).value.trim();

      const depSelect = this.overlay.querySelector('#task-dependencies') as HTMLSelectElement;
      const selectedDeps: string[] = [];
      for (let i = 0; i < depSelect.options.length; i++) {
        if (depSelect.options[i].selected) {
          selectedDeps.push(depSelect.options[i].value);
        }
      }

      if (endDate < startDate) {
        endDate = startDate;
      }

      const assignees = assigneesStr.split(',').map(s => s.trim()).filter(Boolean);

      const updated: ScheduleTask = {
        ...task,
        title,
        category,
        isMilestone,
        startDate,
        endDate,
        progress,
        dependencies: selectedDeps,
        assignees,
        notes
      };

      this.onSave(updated, this.isNew);
      this.close();
    });
  }
}
