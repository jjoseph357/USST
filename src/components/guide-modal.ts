import { getIconSvg } from '../utils/icons';

export class GuideModal {
  private backdrop: HTMLElement;
  private activeTab: 'recruitment' | 'work-session' = 'recruitment';
  private onNavigateToView: (view: 'recruitment' | 'roadmap' | 'backlog') => void;

  constructor(onNavigateToView: (view: 'recruitment' | 'roadmap' | 'backlog') => void) {
    this.onNavigateToView = onNavigateToView;
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

  public open(defaultTab: 'recruitment' | 'work-session' = 'recruitment') {
    this.activeTab = defaultTab;
    this.render();
    this.backdrop.classList.add('open');
  }

  public close() {
    this.backdrop.classList.remove('open');
  }

  private render() {
    this.backdrop.innerHTML = `
      <div class="modal-dialog guide-modal-dialog">
        <div class="modal-head">
          <div class="brand-group">
            <span class="badge badge-secondary">Presenter Guide</span>
            <h3 style="font-size: 1.15rem; margin: 0.25rem 0 0 0;">Event playbook</h3>
          </div>
          <button class="modal-close-icon" id="guide-close" aria-label="Close modal">${getIconSvg('x', 18)}</button>
        </div>

        <div class="modal-body" style="padding: 1.25rem 1.5rem;">
          <!-- Guide Tab Switcher -->
          <div class="guide-mode-tabs" role="tablist" style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
            <button class="btn btn-sm ${this.activeTab === 'recruitment' ? 'btn-primary' : 'btn-outline'}" id="tab-guide-recruitment" style="flex: 1;">
              ${getIconSvg('rocket', 14)} At recruitment events
            </button>
            <button class="btn btn-sm ${this.activeTab === 'work-session' ? 'btn-primary' : 'btn-outline'}" id="tab-guide-session" style="flex: 1;">
              ${getIconSvg('calendar', 14)} During work sessions
            </button>
          </div>

          ${this.activeTab === 'recruitment' ? `
            <!-- Recruitment Playbook -->
            <div class="guide-tab-content">
              <div class="guide-step-card">
                <div class="guide-step-num">1</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Hook them with Launch Canada flight footage</strong>
                  <p class="guide-step-desc">
                    Show <strong>CAM 1 (On-Board)</strong>, which automatically starts at 0:40 right when the solid rocket motor ignites, or switch to <strong>Multi-Cam Grid</strong>.
                  </p>
                  <button class="btn btn-xs btn-default guide-action-btn" id="guide-jump-video">
                    ${getIconSvg('video', 12)} Go to flight video
                  </button>
                </div>
              </div>

              <div class="guide-step-card">
                <div class="guide-step-num">2</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Ask their major and use the role matcher</strong>
                  <p class="guide-step-desc">
                    Ask what degree they are taking. Click their discipline (Hardware, Firmware, RF, Controls, Full-Stack, or Mechanical) to instantly highlight relevant starter mini-projects.
                  </p>
                  <button class="btn btn-xs btn-default guide-action-btn" id="guide-jump-matcher">
                    ${getIconSvg('compass', 12)} Go to role matcher
                  </button>
                </div>
              </div>

              <div class="guide-step-card">
                <div class="guide-step-num">3</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Highlight first-year starter mini-projects</strong>
                  <p class="guide-step-desc">
                    Reassure new members that no previous rocketry or PCB experience is required. New recruits work on scoped onboarding tasks with 1-on-1 lead mentorship.
                  </p>
                </div>
              </div>

              <div class="guide-step-card">
                <div class="guide-step-num">4</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Give meeting details and scan Discord QR</strong>
                  <p class="guide-step-desc">
                    We meet weekly in <strong>Engineering Building, Room 2C01 (Classroom)</strong> on Saturdays at 12:00 PM. Have them scan the QR code or click below to join Discord.
                  </p>
                  <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <a href="https://discord.gg/VB9yJc5Qg" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-discord">
                      ${getIconSvg('discord', 12)} Join Discord (https://discord.gg/VB9yJc5Qg)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- Work Session Playbook -->
            <div class="guide-tab-content">
              <div class="guide-step-card">
                <div class="guide-step-num">1</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Review the mission roadmap and upcoming review gates</strong>
                  <p class="guide-step-desc">
                    Open the <strong>Mission Roadmap</strong> to check progress on the 7 flight phases. Highlight the upcoming <strong>Critical Design Review (CDR - Dec 15)</strong> and PCB Spin 1 freeze.
                  </p>
                  <button class="btn btn-xs btn-default guide-action-btn" id="guide-jump-roadmap">
                    ${getIconSvg('calendar', 12)} Open mission roadmap
                  </button>
                </div>
              </div>

              <div class="guide-step-card">
                <div class="guide-step-num">2</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Prioritize tasks from the technical backlog</strong>
                  <p class="guide-step-desc">
                    Filter by discipline or subsystem. Ensure leads and senior members are focused on <strong>Priority 1</strong> tasks (STM32 schematic routing, power bring-up, watchdog timer).
                  </p>
                  <button class="btn btn-xs btn-default guide-action-btn" id="guide-jump-backlog">
                    ${getIconSvg('list', 12)} Open technical backlog
                  </button>
                </div>
              </div>

              <div class="guide-step-card">
                <div class="guide-step-num">3</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Onboard new attendees with starter mini-projects</strong>
                  <p class="guide-step-desc">
                    Click the <strong>Starter Tasks</strong> filter button in the backlog to see all 7 starter tasks (3.3 member-terms total) ready for new members to pick up.
                  </p>
                  <button class="btn btn-xs btn-default guide-action-btn" id="guide-jump-starter">
                    ${getIconSvg('leaf', 12)} View starter tasks
                  </button>
                </div>
              </div>

              <div class="guide-step-card">
                <div class="guide-step-num">4</div>
                <div class="guide-step-body">
                  <strong class="guide-step-title">Inspect deliverables, dependencies, and sizing</strong>
                  <p class="guide-step-desc">
                    Click any task row or milestone card to view the Task Inspector modal for full technical scope, predecessor dependencies, and assigned leads.
                  </p>
                </div>
              </div>
            </div>
          `}

          <div class="booth-tip-box" style="margin-top: 1.25rem;">
            ${getIconSvg('info', 16)}
            <div>
              <strong>Quick Shortcut:</strong> Press <kbd>P</kbd> to toggle full-screen Booth Display Mode.
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents() {
    this.backdrop.querySelector('#guide-close')?.addEventListener('click', () => this.close());

    this.backdrop.querySelector('#tab-guide-recruitment')?.addEventListener('click', () => {
      this.activeTab = 'recruitment';
      this.render();
    });

    this.backdrop.querySelector('#tab-guide-session')?.addEventListener('click', () => {
      this.activeTab = 'work-session';
      this.render();
    });

    this.backdrop.querySelector('#guide-jump-video')?.addEventListener('click', () => {
      this.close();
      this.onNavigateToView('recruitment');
      setTimeout(() => {
        document.getElementById('flight-video-theater')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    this.backdrop.querySelector('#guide-jump-matcher')?.addEventListener('click', () => {
      this.close();
      this.onNavigateToView('recruitment');
      setTimeout(() => {
        document.getElementById('role-matcher-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    this.backdrop.querySelector('#guide-jump-roadmap')?.addEventListener('click', () => {
      this.close();
      this.onNavigateToView('roadmap');
    });

    this.backdrop.querySelector('#guide-jump-backlog')?.addEventListener('click', () => {
      this.close();
      this.onNavigateToView('backlog');
    });

    this.backdrop.querySelector('#guide-jump-starter')?.addEventListener('click', () => {
      this.close();
      this.onNavigateToView('backlog');
      window.location.hash = '#backlog';
    });
  }
}
