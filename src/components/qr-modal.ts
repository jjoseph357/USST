import { generateQrSvg } from '../utils/qr-generator';
import { getIconSvg } from '../utils/icons';

export const DISCORD_JOIN_URL = 'https://discord.gg/VB9yJc5Qg';

export type QrTargetMode = 'discord' | 'website';

export class QrModal {
  private backdrop: HTMLElement;
  private currentMode: QrTargetMode = 'discord';
  private currentUrl: string = DISCORD_JOIN_URL;

  constructor() {
    this.currentUrl = DISCORD_JOIN_URL;

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

  public open(mode: QrTargetMode = 'discord', customUrl?: string) {
    this.currentMode = mode;
    if (customUrl) {
      this.currentUrl = customUrl;
    } else {
      this.currentUrl = mode === 'discord' ? DISCORD_JOIN_URL : (window.location.origin + window.location.pathname);
    }
    this.render();
    this.backdrop.classList.add('open');
  }

  public close() {
    this.backdrop.classList.remove('open');
  }

  private setMode(mode: QrTargetMode) {
    this.currentMode = mode;
    this.currentUrl = mode === 'discord' ? DISCORD_JOIN_URL : (window.location.origin + window.location.pathname);
    this.render();
  }

  private render() {
    let svgHtml = '';
    try {
      svgHtml = generateQrSvg(this.currentUrl, 7, 4);
    } catch {
      try {
        svgHtml = generateQrSvg(DISCORD_JOIN_URL, 7, 4);
        this.currentUrl = DISCORD_JOIN_URL;
      } catch {
        svgHtml = '<div class="qr-error-box">Failed to render QR matrix</div>';
      }
    }

    const isDiscord = this.currentMode === 'discord';

    this.backdrop.innerHTML = `
      <div class="modal-dialog qr-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
        <div class="modal-head">
          <div class="brand-group">
            <span class="badge badge-secondary">${isDiscord ? 'Community Access' : 'Mobile Web App'}</span>
            <h3 id="qr-modal-title" class="modal-title">${isDiscord ? 'Join USST Discord' : 'Scan to open on phone'}</h3>
          </div>
          <button class="modal-close-icon" id="qr-close" aria-label="Close modal">${getIconSvg('x', 18)}</button>
        </div>

        <div class="modal-body qr-modal-body">
          <!-- Segmented Tab Switcher (shadcn tabs style) -->
          <div class="segmented-control" role="tablist" aria-label="QR Destination">
            <button class="segmented-btn ${isDiscord ? 'active' : ''}" id="btn-qr-tab-discord" role="tab" aria-selected="${isDiscord}">
              ${getIconSvg('discord', 15)} <span>USST Discord</span>
            </button>
            <button class="segmented-btn ${!isDiscord ? 'active' : ''}" id="btn-qr-tab-web" role="tab" aria-selected="${!isDiscord}">
              ${getIconSvg('phone', 15)} <span>Mobile Web App</span>
            </button>
          </div>

          <p class="qr-intro-text">
            ${isDiscord
              ? 'Scan this QR code with your phone camera to join the <strong>USST Avionics Discord</strong> server and connect with team leads and members.'
              : 'Scan this QR code to view avionics technical specifications, flight roadmap, and backlog on your smartphone.'}
          </p>

          <div class="qr-svg-wrapper">
            ${svgHtml}
          </div>

          <div class="qr-link-box">
            <label class="qr-link-label" for="qr-url-input">
              ${isDiscord ? 'Direct Discord Join Link' : 'Website Mobile URL'}
            </label>
            <div class="qr-input-row">
              <input type="text" id="qr-url-input" value="${this.currentUrl}" readonly class="form-input font-mono" />
              <button class="btn btn-primary btn-sm" id="qr-copy-btn">
                ${getIconSvg('copy', 14)} <span>Copy</span>
              </button>
              <a href="${this.currentUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" id="qr-external-link" title="Open in new window">
                ${getIconSvg('external', 14)} <span>Open</span>
              </a>
            </div>
            <span id="qr-copy-feedback" class="qr-copy-feedback"></span>
          </div>

          <div class="booth-tip-box">
            ${getIconSvg('info', 16)}
            <div>
              <strong>Presentation Tip:</strong> Press <kbd>P</kbd> at any time to toggle full-screen Booth Display Mode.
            </div>
          </div>
        </div>
      </div>
    `;

    this.backdrop.querySelector('#qr-close')?.addEventListener('click', () => this.close());

    this.backdrop.querySelector('#btn-qr-tab-discord')?.addEventListener('click', () => {
      this.setMode('discord');
    });

    this.backdrop.querySelector('#btn-qr-tab-web')?.addEventListener('click', () => {
      this.setMode('website');
    });

    const copyBtn = this.backdrop.querySelector('#qr-copy-btn') as HTMLButtonElement;
    const feedback = this.backdrop.querySelector('#qr-copy-feedback') as HTMLElement;
    const urlInput = this.backdrop.querySelector('#qr-url-input') as HTMLInputElement;

    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(urlInput.value);
        if (feedback) feedback.textContent = 'Copied to clipboard!';
        setTimeout(() => {
          if (feedback) feedback.textContent = '';
        }, 2500);
      } catch {
        urlInput.select();
        document.execCommand('copy');
        if (feedback) feedback.textContent = 'Copied!';
        setTimeout(() => {
          if (feedback) feedback.textContent = '';
        }, 2500);
      }
    });
  }
}
