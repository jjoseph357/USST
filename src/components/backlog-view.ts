import { BacklogItem } from '../types/schedule';

export interface BacklogViewOptions {
  container: HTMLElement;
  items: BacklogItem[];
  onItemUpdate?: (items: BacklogItem[]) => void;
}

export class BacklogView {
  private container: HTMLElement;
  private items: BacklogItem[];

  private totalTerms = 2;
  private customEffort: number = 9.0;

  constructor(options: BacklogViewOptions) {
    this.container = options.container;
    this.items = options.items;

    this.render();
  }

  public update(items: BacklogItem[]) {
    this.items = items;
    this.render();
  }

  public render() {
    this.container.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'backlog-layout';

    // Left Column: Tables for Software & Hardware
    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.gap = '1.5rem';

    // 1. Software Backlog Card
    const swCard = document.createElement('div');
    swCard.className = 'card';
    swCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">Software Backlog & Sizing (Whiteboard 1)</div>
        <span class="status-pill status-in-progress">Allocated per academic term</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Task</th>
              <th>Sizing (Members / Term)</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody id="sw-backlog-rows"></tbody>
        </table>
      </div>
    `;
    leftCol.appendChild(swCard);

    // 2. Hardware Backlog Card
    const hwCard = document.createElement('div');
    hwCard.className = 'card';
    hwCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">Hardware Backlog & Priorities (Whiteboard 1)</div>
        <span class="status-pill status-completed">STM32 Architecture</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Item</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody id="hw-backlog-rows"></tbody>
        </table>
      </div>
    `;
    leftCol.appendChild(hwCard);

    layout.appendChild(leftCol);

    // Right Column: Capacity Model Calculator Card
    const rightCol = document.createElement('div');
    rightCol.className = 'card';

    const swItems = this.items.filter(i => i.subsystem === 'Software');
    const tableSwSum = swItems.reduce((sum, item) => sum + (item.sizingTerms || 0), 0);
    const effectiveEffort = this.customEffort !== undefined ? this.customEffort : 9.0;
    const requiredHeadcount = (effectiveEffort / this.totalTerms).toFixed(1);

    rightCol.innerHTML = `
      <div class="card-header">
        <div class="card-title">Workforce Capacity Model</div>
      </div>
      
      <div class="capacity-metric">
        <div class="capacity-number">${requiredHeadcount}</div>
        <div class="capacity-label">Team Members Required Per Term</div>
      </div>

      <div class="formula-box">
        <strong>Capacity Formula:</strong><br>
        Effort / Terms = ${effectiveEffort.toFixed(1)} / ${this.totalTerms} = ${requiredHeadcount} members/term
      </div>

      <div style="margin-top: 1.25rem;">
        <div class="form-group">
          <label class="form-label">Total Estimated Software Effort (Person-Terms):</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="number" id="effort-input" class="form-input" value="${effectiveEffort}" step="0.1" min="1" />
            <button class="btn btn-secondary" id="btn-sync-sum" title="Sync from table sum (${tableSwSum.toFixed(1)})" style="white-space: nowrap; font-size: 0.75rem;">
              Sum (${tableSwSum.toFixed(1)})
            </button>
            <button class="btn btn-secondary" id="btn-reset-wb" title="Reset to Whiteboard baseline (9.0)" style="white-space: nowrap; font-size: 0.75rem;">
              WB (9.0)
            </button>
          </div>
          <div class="help-text">Whiteboard baseline is 9.0 person-terms (accounts for unestimated maintenance and buffers). Sized table items sum to ${tableSwSum.toFixed(1)}.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Academic Terms for Scope:</label>
          <input type="number" id="terms-input" class="form-input" value="${this.totalTerms}" min="1" max="4" />
          <div class="help-text">Standard academic schedule is 2 terms (Fall and Winter).</div>
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; color: #f8fafc;">Avionics Architecture Summary</h4>
        <p style="font-size: 0.78rem; color: #94a3b8; line-height: 1.5;">
          The avionics suite centers on the STM32 MCU. Power stability is reinforced with supercapacitors and dual-path USB/battery power management. Software is migrating to Zephyr RTOS with an Unscented Kalman Filter (UKF) for apogee detection.
        </p>
      </div>
    `;

    layout.appendChild(rightCol);
    this.container.appendChild(layout);

    // Populate Software Table Rows
    const swTbody = swCard.querySelector('#sw-backlog-rows') as HTMLTableSectionElement;
    for (const item of swItems) {
      const tr = document.createElement('tr');
      const sizingDisplay = item.sizingTerms !== undefined ? `${item.sizingTerms.toFixed(1)}` : '—';
      tr.innerHTML = `
        <td><span class="priority-badge">${item.priority}</span></td>
        <td style="font-weight: 600;">${item.title}</td>
        <td><strong style="color: var(--accent-blue);">${sizingDisplay}</strong></td>
        <td><span class="status-pill status-${item.status}">${item.status}</span></td>
        <td style="color: var(--text-secondary); font-size: 0.78rem;">${item.notes}</td>
      `;
      swTbody.appendChild(tr);
    }

    // Populate Hardware Table Rows
    const hwItems = this.items.filter(i => i.subsystem === 'Hardware');
    const hwTbody = hwCard.querySelector('#hw-backlog-rows') as HTMLTableSectionElement;
    for (const item of hwItems) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="priority-badge">${item.priority}</span></td>
        <td style="font-weight: 600;">${item.title}</td>
        <td><span class="status-pill status-${item.status}">${item.status}</span></td>
        <td style="color: var(--text-secondary); font-size: 0.78rem;">${item.notes}</td>
      `;
      hwTbody.appendChild(tr);
    }

    // Terms input change event listener
    const termsInput = rightCol.querySelector('#terms-input') as HTMLInputElement;
    if (termsInput) {
      termsInput.addEventListener('input', () => {
        const val = parseInt(termsInput.value, 10);
        if (val > 0) {
          this.totalTerms = val;
          this.render();
        }
      });
    }

    const effortInput = rightCol.querySelector('#effort-input') as HTMLInputElement;
    if (effortInput) {
      effortInput.addEventListener('input', () => {
        const val = parseFloat(effortInput.value);
        if (!isNaN(val) && val > 0) {
          this.customEffort = val;
          this.render();
        }
      });
    }

    rightCol.querySelector('#btn-sync-sum')?.addEventListener('click', () => {
      this.customEffort = tableSwSum;
      this.render();
    });

    rightCol.querySelector('#btn-reset-wb')?.addEventListener('click', () => {
      this.customEffort = 9.0;
      this.render();
    });
  }
}
