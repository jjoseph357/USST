import {
  ScheduleTask,
  CategoryFilterState
} from '../types/schedule';
import { ROADMAP_PHASES_DATA } from '../data/seed-schedule';
import { getIconSvg } from '../utils/icons';

export interface RoadmapViewOptions {
  container: HTMLElement;
  tasks: ScheduleTask[];
  filters: CategoryFilterState;
  onTaskSelect: (task: ScheduleTask) => void;
}

export class RoadmapView {
  private container: HTMLElement;
  private tasks: ScheduleTask[];
  private onTaskSelect: (task: ScheduleTask) => void;

  constructor(options: RoadmapViewOptions) {
    this.container = options.container;
    this.tasks = options.tasks;
    this.onTaskSelect = options.onTaskSelect;

    this.render();
  }

  public update(tasks: ScheduleTask[], _filters?: CategoryFilterState) {
    this.tasks = tasks;
    this.render();
  }

  public setSubView(_subView: string) {
    this.render();
  }

  public render() {
    this.container.innerHTML = `
      <div class="roadmap-page">
        <!-- Roadmap Mission Header -->
        <div class="roadmap-mission-header">
          <div class="roadmap-header-left">
            <span class="badge badge-primary">${getIconSvg('calendar', 14)} Mission Timeline</span>
            <h2 class="roadmap-title">Flight readiness &amp; engineering roadmap</h2>
            <p class="roadmap-subtitle">
              The 7 development phases leading to Launch Canada 2027: balancing formal aerospace review gates (IDR, PDR, CDR, FRR) with university academic terms.
            </p>
          </div>
          <div class="roadmap-header-right">
            <div class="gate-countdown-box">
              <span class="gate-tag">Next Major Review Gate</span>
              <div class="gate-title">Critical Design Review (CDR)</div>
              <div class="gate-date">December 15, 2026 • PCB Spin 1 Freeze</div>
              <div class="gate-action-hint">Click any milestone below to inspect deliverables</div>
            </div>
          </div>
        </div>

        <!-- 7-Phase Interactive Flight Roadmap -->
        <div class="phases-timeline-wrapper">
          <div class="phases-stepper">
            ${ROADMAP_PHASES_DATA.map(phase => `
              <div class="phase-step-card ${phase.phaseNumber === 1 ? 'phase-current' : ''}">
                <div class="phase-step-header">
                  <div class="phase-badge-group">
                    <span class="phase-step-num-badge">Phase 0${phase.phaseNumber}</span>
                    ${phase.phaseNumber === 1 ? '<span class="status-live-pill"><span class="status-indicator"></span> Current Active Phase</span>' : ''}
                  </div>
                  <div class="phase-step-dates font-mono">${phase.dateRange}</div>
                </div>

                <h3 class="phase-step-name">${phase.phaseName}</h3>
                <p class="phase-step-summary">${phase.summary}</p>

                <div class="phase-milestones-list">
                  ${phase.milestones.map(m => `
                    <div class="phase-milestone-item ${m.isMajorReview ? 'milestone-major' : ''} ${m.isAcademicBreak ? 'milestone-break' : ''}" data-milestone-id="${m.id}" data-milestone-name="${m.name}" role="button" tabindex="0" title="Click to view deliverables &amp; specs">
                      <div class="phase-m-head">
                        <span class="phase-m-name">
                          ${m.isMajorReview ? getIconSvg('star', 14) : ''}
                          <span>${m.name}</span>
                        </span>
                        <span class="phase-m-badge ${m.isMajorReview ? 'badge-warning' : (m.isAcademicBreak ? 'badge-neutral' : 'badge-primary')}">
                          ${m.isMajorReview ? 'Review Gate' : (m.isAcademicBreak ? 'Academic Break' : m.subsystemTag)}
                        </span>
                      </div>
                      <div class="phase-m-date font-mono">
                        ${getIconSvg('calendar', 13)} ${m.dateRange}
                      </div>
                      <div class="phase-m-desc">${m.keyDeliverables}</div>
                      <div class="phase-m-inspect-hint">
                        <span>Inspect specs</span> ${getIconSvg('chevronRight', 12)}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindMilestoneClicks();
  }

  private bindMilestoneClicks() {
    this.container.querySelectorAll('.phase-milestone-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-milestone-id');
        const name = el.getAttribute('data-milestone-name');

        const matched = this.tasks.find(t =>
          t.id === id ||
          (id && t.id.includes(id.replace('m-', ''))) ||
          (id && id.replace('m-', '').includes(t.id)) ||
          t.title.toLowerCase() === name?.toLowerCase()
        );

        if (matched) {
          this.onTaskSelect(matched);
        } else {
          for (const p of ROADMAP_PHASES_DATA) {
            const m = p.milestones.find(ms => ms.id === id);
            if (m) {
              this.onTaskSelect({
                id: m.id,
                title: m.name,
                category: m.subsystemTag === 'Hardware' ? 'avionics-hw' : (m.subsystemTag === 'Software' ? 'avionics-sw' : (m.subsystemTag === 'Academic' ? 'university' : 'milestone')),
                startDate: m.startDate,
                endDate: m.endDate,
                progress: 0,
                dependencies: [],
                assignees: [m.subsystemTag === 'Academic' ? 'All Students' : 'Avionics Leads'],
                notes: m.keyDeliverables,
                isMilestone: m.isMajorReview
              });
              break;
            }
          }
        }
      });
    });
  }
}
