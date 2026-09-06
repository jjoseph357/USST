import { BacklogItem } from '../types/schedule';

export interface BacklogViewOptions {
  container: HTMLElement;
  items: BacklogItem[];
}

export class BacklogView {
  private container: HTMLElement;
  private items: BacklogItem[];

  private totalTerms = 2;
  private customEffort = 9.0;

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

    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.gap = '1.25rem';

    // 1. Software Backlog Card
    const swCard = document.createElement('div');
    swCard.className = 'card';
    swCard.innerHTML = `
      <div class="card-header">
        <div class="card-title">Software Backlog &amp; Sizing (Whiteboard 1)</div>
        <span class="status-badge">Allocated in person-terms</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 70px;">Priority</th>
              <th>Task</th>
              <th style="width: 140px;">Sizing (Members / Term)</th>
              <th style="width: 100px;">Status</th>
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
        <div class="card-title">Hardware Backlog &amp; Priorities (Whiteboard 1)</div>
        <span class="status-badge">STM32 Architecture</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 70px;">Priority</th>
              <th>Item</th>
              <th style="width: 100px;">Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody id="hw-backlog-rows"></tbody>
        </table>
      </div>
    `;
    leftCol.appendChild(hwCard);
    layout.appendChild(leftCol);

    // Right Column: Capacity Calculator Card
    const rightCol = document.createElement('div');
    rightCol.className = 'card';

    const swItems = this.items.filter(i => i.subsystem === 'Software');
    const tableSwSum = swItems.reduce((sum, item) => sum + (item.sizingTerms || 0), 0);
    const headcount = (this.customEffort / this.totalTerms).toFixed(1);

    rightCol.innerHTML = `
      <div class="card-header">
        <div class="card-title">Capacity Model</div>
      </div>

      <div class="capacity-metric-box">
        <div class="capacity-number-large">${headcount}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">
          Active Members Required Per Term
        </div>
      </div>

      <div class="code-snippet">
        Capacity Formula:<br>
        Effort / Terms = ${this.customEffort.toFixed(1)} / ${this.totalTerms} = ${headcount} members/term
      </div>

      <div style="margin-top: 1rem;">
        <div class="form-field">
          <label>Estimated Software Effort (Person-Terms)</label>
          <div style="display: flex; gap: 0.4rem;">
            <input type="number" id="effort-input" class="text-input" value="${this.customEffort}" step="0.1" min="1" />
            <button class="btn btn-default" id="btn-sync-sum" title="Sync from table sum (${tableSwSum.toFixed(1)})" style="white-space: nowrap; font-size: 0.72rem;">
              Sum (${tableSwSum.toFixed(1)})
            </button>
            <button class="btn btn-default" id="btn-reset-wb" title="Reset to Whiteboard baseline (9.0)" style="white-space: nowrap; font-size: 0.72rem;">
              Reset (9.0)
            </button>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.3rem;">
            Whiteboard baseline is 9.0 person-terms (accounts for unestimated maintenance and buffers). Sized table items sum to ${tableSwSum.toFixed(1)}.
          </div>
        </div>

        <div class="form-field">
          <label>Academic Terms for Scope</label>
          <input type="number" id="terms-input" class="text-input" value="${this.totalTerms}" min="1" max="4" />
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.3rem;">
            Standard academic cycle is 2 terms (Fall and Winter).
          </div>
        </div>
      </div>

      <div style="margin-top: 1.25rem; padding: 0.75rem; background: var(--bg-surface-raised); border-radius: 4px; border: 1px solid var(--border-subtle); font-size: 0.76rem; color: var(--text-muted); line-height: 1.6;">
        <strong style="color: var(--text-main);">Avionics Subsystem Context:</strong><br>
        STM32 microcontroller core. Hardware priorities center on power rail stability, latching camera controls, and supercapacitors. Software scope encompasses Zephyr RTOS, an Unscented Kalman Filter (UKF) for apogee detection, and full-stack ground station telemetry.
      </div>
    `;

    layout.appendChild(rightCol);
    this.container.appendChild(layout);

    // Populate tables
    const swTbody = swCard.querySelector('#sw-backlog-rows') as HTMLTableSectionElement;
    for (const item of swItems) {
      const tr = document.createElement('tr');
      const sizingDisplay = item.sizingTerms !== undefined ? `${item.sizingTerms.toFixed(1)}` : '—';
      tr.innerHTML = `
        <td><span class="priority-tag">P${item.priority}</span></td>
        <td style="font-weight: 500;">${item.title}</td>
        <td><strong style="color: var(--text-main); font-family: var(--font-mono);">${sizingDisplay}</strong></td>
        <td><span class="status-badge">${item.status}</span></td>
        <td style="color: var(--text-muted); font-size: 0.75rem;">${item.notes}</td>
      `;
      swTbody.appendChild(tr);
    }

    const hwItems = this.items.filter(i => i.subsystem === 'Hardware');
    const hwTbody = hwCard.querySelector('#hw-backlog-rows') as HTMLTableSectionElement;
    for (const item of hwItems) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="priority-tag">P${item.priority}</span></td>
        <td style="font-weight: 500;">${item.title}</td>
        <td><span class="status-badge">${item.status}</span></td>
        <td style="color: var(--text-muted); font-size: 0.75rem;">${item.notes}</td>
      `;
      hwTbody.appendChild(tr);
    }

    // Input listeners
    const termsInput = rightCol.querySelector('#terms-input') as HTMLInputElement;
    termsInput?.addEventListener('input', () => {
      const val = parseInt(termsInput.value, 10);
      if (val > 0) {
        this.totalTerms = val;
        this.render();
      }
    });

    const effortInput = rightCol.querySelector('#effort-input') as HTMLInputElement;
    effortInput?.addEventListener('input', () => {
      const val = parseFloat(effortInput.value);
      if (!isNaN(val) && val > 0) {
        this.customEffort = val;
        this.render();
      }
    });

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
