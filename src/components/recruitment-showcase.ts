import { SubsystemProject } from '../types/schedule';
import {
  SUBSYSTEMS_DATA,
  SELLING_POINTS_DATA
} from '../data/seed-schedule';
import { getIconSvg, IconName } from '../utils/icons';

export interface RecruitmentShowcaseOptions {
  container: HTMLElement;
  onNavigateToView: (view: 'roadmap' | 'backlog', filterTrack?: string) => void;
  onOpenQrModal: (mode?: 'discord' | 'website') => void;
}

export class RecruitmentShowcase {
  private container: HTMLElement;
  private onNavigateToView: (view: 'roadmap' | 'backlog', filterTrack?: string) => void;
  private onOpenQrModal: (mode?: 'discord' | 'website') => void;
  private countdownTimerId: number | null = null;
  private activeCameraFeed: 'rocket' | 'livestream' | 'ground' = 'rocket';

  constructor(options: RecruitmentShowcaseOptions) {
    this.container = options.container;
    this.onNavigateToView = options.onNavigateToView;
    this.onOpenQrModal = options.onOpenQrModal;

    this.render();
    this.startCountdown();
  }

  public destroy() {
    if (this.countdownTimerId !== null) {
      clearInterval(this.countdownTimerId);
    }
  }

  private getSubsystemIconName(subNumber: number): IconName {
    switch (subNumber) {
      case 1: return 'cpu';
      case 2: return 'zap';
      case 3: return 'code';
      case 4: return 'radio';
      case 5: return 'globe';
      case 6: return 'tool';
      default: return 'cpu';
    }
  }

  public render() {
    this.container.innerHTML = `
      <!-- Hero Section -->
      <section class="recruitment-hero">
        <div class="hero-content">
          <div class="hero-meta-bar">
            <span class="badge badge-primary">
              ${getIconSvg('rocket', 14)} Launch Canada 2027
            </span>
            <span class="badge badge-secondary">Target Apogee: 30,000 ft AGL</span>
          </div>

          <h1 class="hero-headline">
            Rocket flight computers, real-time firmware, and telemetry
          </h1>

          <p class="hero-lead">
            The University of Saskatchewan Space Team (USST) Avionics Division designs, builds, and flies custom electronic hardware and real-time flight software for competition rocketry. We are currently architecting our in-house STM32 flight computer and Zephyr RTOS system for Launch Canada 2027.
          </p>

          <!-- Launch Countdown Clock -->
          <div class="countdown-card" id="launch-countdown-card" aria-label="Countdown to Launch Canada 2027">
            <div class="countdown-header">
              <span class="status-indicator"></span>
              <span class="countdown-title">Launch Canada 2027 Countdown (August 10, 2027)</span>
            </div>
            <div class="countdown-grid">
              <div class="countdown-unit">
                <span class="countdown-num" id="cd-days">---</span>
                <span class="countdown-lbl">Days</span>
              </div>
              <div class="countdown-sep" aria-hidden="true">:</div>
              <div class="countdown-unit">
                <span class="countdown-num" id="cd-hours">--</span>
                <span class="countdown-lbl">Hours</span>
              </div>
              <div class="countdown-sep" aria-hidden="true">:</div>
              <div class="countdown-unit">
                <span class="countdown-num" id="cd-mins">--</span>
                <span class="countdown-lbl">Minutes</span>
              </div>
              <div class="countdown-sep" aria-hidden="true">:</div>
              <div class="countdown-unit">
                <span class="countdown-num" id="cd-secs">--</span>
                <span class="countdown-lbl">Seconds</span>
              </div>
            </div>
          </div>

          <!-- Hero Action Buttons -->
          <div class="hero-actions-row">
            <a href="https://discord.gg/VB9yJc5Qg" target="_blank" rel="noopener noreferrer" class="btn btn-discord" id="btn-hero-discord">
              ${getIconSvg('discord')} <span>Join Discord</span>
            </a>
            <button class="btn btn-primary" id="btn-hero-projects">
              ${getIconSvg('cpu')} <span>Explore 6 Projects</span>
            </button>
            <button class="btn btn-outline" id="btn-hero-sessions">
              ${getIconSvg('mapPin')} <span>Weekly Work Sessions</span>
            </button>
            <button class="btn btn-outline" id="btn-hero-roadmap">
              ${getIconSvg('calendar')} <span>Mission Roadmap</span>
            </button>
            <button class="btn btn-outline" id="btn-hero-qr" title="Scan Discord QR">
              ${getIconSvg('phone')} <span>Mobile QR</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 3 Key Reasons to Join -->
      <section class="showcase-section">
        <div class="section-header">
          <span class="section-tag">Why Join Avionics</span>
          <h2 class="section-title">Hands-on aerospace engineering from day one</h2>
          <p class="section-desc">Practical design, testing, and flight operations experience on a university team.</p>
        </div>

        <div class="selling-points-grid">
          ${SELLING_POINTS_DATA.map((sp, idx) => {
      const iconName: IconName = idx === 0 ? 'zap' : (idx === 1 ? 'cpu' : 'rocket');
      return `
              <div class="selling-card">
                <div class="selling-card-top">
                  <div class="selling-icon-wrapper">
                    ${getIconSvg(iconName, 20)}
                  </div>
                  <span class="badge ${idx === 0 ? 'badge-primary' : (idx === 1 ? 'badge-info' : 'badge-warning')}">
                    ${sp.statBadge || `Point 0${sp.number}`}
                  </span>
                </div>
                <h3 class="selling-title">${sp.title}</h3>
                <p class="selling-tagline">${sp.tagline}</p>
                <p class="selling-desc">${sp.description}</p>
              </div>
            `;
    }).join('')}
        </div>
      </section>

      <!-- The 6 Key Subsystems & Projects -->
      <section class="showcase-section" id="projects-section">
        <div class="section-header">
          <span class="section-tag">What You Can Work On</span>
          <h2 class="section-title">6 Core Engineering Projects</h2>
          <p class="section-desc">
            Every subsystem has beginner-friendly starter tasks and advanced development items. Click any project to view open tasks.
          </p>
        </div>

        <div class="subsystems-grid">
          ${SUBSYSTEMS_DATA.map(sub => this.renderSubsystemCard(sub)).join('')}
        </div>
      </section>

      <!-- Flight Footage Card (Clean & Compact) -->
      <section class="showcase-section">
        <div class="flight-compact-card">
          <div class="flight-card-head">
            <div>
              <span class="section-tag">Flight Footage</span>
              <h3 class="flight-card-title">Launch Canada in Action</h3>
              <p class="flight-card-desc">Watch our competition launch footage from on-board, livestream broadcast, and ground optical tracking.</p>
            </div>
            <div class="cam-tabs-group" role="tablist" aria-label="Camera angles">
              <button class="cam-tab-btn ${this.activeCameraFeed === 'rocket' ? 'active' : ''}" data-feed="rocket">
                <span class="status-indicator"></span> CAM 1 (On-Board @ 40s)
              </button>
              <button class="cam-tab-btn ${this.activeCameraFeed === 'livestream' ? 'active' : ''}" data-feed="livestream">
                ${getIconSvg('tv', 14)} CAM 2 (Stream)
              </button>
              <button class="cam-tab-btn ${this.activeCameraFeed === 'ground' ? 'active' : ''}" data-feed="ground">
                ${getIconSvg('telescope', 14)} CAM 3 (Ground)
              </button>
            </div>
          </div>

          <div class="flight-player-wrapper">
            <video id="flight-video-player" class="flight-video-player" playsinline controls preload="metadata" muted>
              <source src="/videos/lc2026_launch.mp4#t=40" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
          </div>

          <div class="flight-player-footer">
            <div class="flight-feed-info" id="flight-feed-caption">
              <strong>CAM 1 (On-Board):</strong> Camera starts at 40s solid motor ignition. Notice vehicle ascent stability.
            </div>
            <button class="btn btn-xs btn-outline" id="btn-replay-40">
              ${getIconSvg('rotateCcw', 12)} Replay from 0:40
            </button>
          </div>
        </div>
      </section>

      <!-- Join the Team & Work Sessions Info -->
      <section class="showcase-section" id="sessions-section">
        <div class="work-session-join-card">
          <div class="join-card-content">
            <span class="badge badge-primary">Get Involved</span>
            <h2>Weekly Work Sessions</h2>
            <p>
              We meet twice every week in the USask Engineering Building. No experience required — drop in, meet the team leads, grab a seat, and start building.
            </p>

            <div class="session-details-grid">
              <div class="session-detail-item">
                <div class="session-detail-icon">${getIconSvg('mapPin', 20)}</div>
                <div>
                  <div class="session-detail-label">Location</div>
                  <div class="session-detail-val">Engineering Building, Room 2C01</div>
                </div>
              </div>
              <div class="session-detail-item">
                <div class="session-detail-icon">${getIconSvg('clock', 20)}</div>
                <div>
                  <div class="session-detail-label">Meeting Times</div>
                  <div class="session-detail-val">Thursdays @ 6:00 PM &amp; Saturdays @ 1:00 PM</div>
                </div>
              </div>
              <div class="session-detail-item">
                <div class="session-detail-icon">${getIconSvg('discord', 20)}</div>
                <div>
                  <div class="session-detail-label">Discord Community</div>
                  <div class="session-detail-val">
                    <a href="https://discord.gg/VB9yJc5Qg" target="_blank" rel="noopener noreferrer" class="link-discord-subtle">
                      discord.gg/VB9yJc5Qg
                    </a>
                  </div>
                </div>
              </div>
              <div class="session-detail-item">
                <div class="session-detail-icon">${getIconSvg('mail', 20)}</div>
                <div>
                  <div class="session-detail-label">Contact</div>
                  <div class="session-detail-val">avionics-leads@usst.ca</div>
                </div>
              </div>
            </div>

            <div class="join-actions">
              <a href="https://discord.gg/VB9yJc5Qg" target="_blank" rel="noopener noreferrer" class="btn btn-discord" id="btn-join-discord">
                ${getIconSvg('discord')} <span>Join Discord Server</span>
              </a>
              <button class="btn btn-outline" id="btn-join-qr">
                ${getIconSvg('phone')} <span>Scan Discord QR</span>
              </button>
              <button class="btn btn-secondary" id="btn-join-plan">
                ${getIconSvg('calendar')} <span>View Mission Roadmap</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;

    this.bindEvents();
    this.updateCountdownDisplay();
  }

  private renderSubsystemCard(sub: SubsystemProject): string {
    const iconName = this.getSubsystemIconName(sub.number);
    const badgeClass = sub.category === 'Hardware' ? 'badge-info' : (sub.category === 'Software' ? 'badge-primary' : 'badge-warning');

    return `
      <div class="subsystem-card" id="${sub.id}" data-subsystem-number="${sub.number}">
        <div class="subsystem-card-top">
          <div class="subsystem-icon-box">
            ${getIconSvg(iconName, 20)}
          </div>
          <div class="subsystem-meta">
            <span class="badge ${badgeClass}">${sub.category}</span>
            <span class="subsystem-num">Project 0${sub.number}</span>
          </div>
        </div>

        <h3 class="subsystem-title">${sub.title}</h3>
        <p class="subsystem-goal">${sub.goal}</p>

        <div class="subsystem-starter-callout">
          <div class="subsystem-starter-title">${getIconSvg('leaf', 14)} Starter Mini-Project</div>
          <div class="subsystem-starter-text">${sub.starterProjects[0]}</div>
        </div>

        <div class="subsystem-tech-stack">
          ${sub.techStack.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
        </div>

        <div class="subsystem-card-footer">
          <button class="btn btn-outline btn-block btn-subsystem-tasks" data-subsystem-id="${sub.number}">
            ${getIconSvg('list', 14)} <span>View tasks in backlog</span>
          </button>
        </div>
      </div>
    `;
  }

  private bindVideoEvents() {
    const player = this.container.querySelector('#flight-video-player') as HTMLVideoElement | null;
    const caption = this.container.querySelector('#flight-feed-caption');
    const replayBtn = this.container.querySelector('#btn-replay-40') as HTMLElement | null;

    if (!player) return;

    const enforce40s = () => {
      if (this.activeCameraFeed === 'rocket' && player.currentTime < 40) {
        player.currentTime = 40;
      }
    };

    player.addEventListener('loadedmetadata', enforce40s);
    player.addEventListener('play', () => {
      if (this.activeCameraFeed === 'rocket' && player.currentTime < 39.5) {
        player.currentTime = 40;
      }
    });

    replayBtn?.addEventListener('click', () => {
      if (this.activeCameraFeed === 'rocket') {
        player.currentTime = 40;
        player.play().catch(() => {});
      } else {
        player.currentTime = 0;
        player.play().catch(() => {});
      }
    });

    // Cam Tab switcher
    this.container.querySelectorAll('.cam-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const feed = btn.getAttribute('data-feed') as 'rocket' | 'livestream' | 'ground';
        if (!feed || feed === this.activeCameraFeed) return;

        this.activeCameraFeed = feed;

        this.container.querySelectorAll('.cam-tab-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-feed') === feed);
        });

        if (feed === 'rocket') {
          player.src = '/videos/lc2026_launch.mp4#t=40';
          player.muted = true;
          player.load();
          if (caption) {
            caption.innerHTML = '<strong>CAM 1 (On-Board):</strong> Camera starts at 40s solid motor ignition. Notice vehicle ascent stability.';
          }
          if (replayBtn) replayBtn.style.display = 'inline-flex';
        } else if (feed === 'livestream') {
          player.src = '/videos/ScreenRecording_08-17-2026%2018-50-51_1.mov';
          player.muted = false;
          player.load();
          if (caption) {
            caption.innerHTML = '<strong>CAM 2 (Livestream):</strong> Official Launch Canada broadcast stream tracking launch countdown and flight.';
          }
          if (replayBtn) replayBtn.style.display = 'none';
        } else if (feed === 'ground') {
          player.src = '/videos/IMG_8186.MOV';
          player.muted = false;
          player.load();
          if (caption) {
            caption.innerHTML = '<strong>CAM 3 (Ground):</strong> Spectator pad tracking and audio recorded from the launch range.';
          }
          if (replayBtn) replayBtn.style.display = 'none';
        }
      });
    });
  }

  private bindEvents() {
    this.bindVideoEvents();

    // Scroll jumps
    this.container.querySelector('#btn-hero-projects')?.addEventListener('click', () => {
      this.container.querySelector('#projects-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    this.container.querySelector('#btn-hero-sessions')?.addEventListener('click', () => {
      this.container.querySelector('#sessions-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Navigation jumps
    this.container.querySelector('#btn-hero-roadmap')?.addEventListener('click', () => {
      this.onNavigateToView('roadmap');
    });

    this.container.querySelector('#btn-hero-qr')?.addEventListener('click', () => {
      this.onOpenQrModal('discord');
    });

    this.container.querySelector('#btn-join-qr')?.addEventListener('click', () => {
      this.onOpenQrModal('discord');
    });

    this.container.querySelector('#btn-join-plan')?.addEventListener('click', () => {
      this.onNavigateToView('roadmap');
    });

    // Subsystem task jump buttons
    this.container.querySelectorAll('.btn-subsystem-tasks').forEach(btn => {
      btn.addEventListener('click', () => {
        const subId = btn.getAttribute('data-subsystem-id');
        this.onNavigateToView('backlog', `subsystem-${subId}`);
      });
    });
  }

  private startCountdown() {
    this.countdownTimerId = window.setInterval(() => {
      this.updateCountdownDisplay();
    }, 1000);
  }

  private updateCountdownDisplay() {
    // Launch Canada 2027: August 10, 2027 09:00:00 MDT
    const targetDate = new Date('2027-08-10T09:00:00-06:00').getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, targetDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const daysEl = this.container.querySelector('#cd-days');
    const hoursEl = this.container.querySelector('#cd-hours');
    const minsEl = this.container.querySelector('#cd-mins');
    const secsEl = this.container.querySelector('#cd-secs');

    if (daysEl) daysEl.textContent = String(days);
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
  }
}
