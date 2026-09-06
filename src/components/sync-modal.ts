import { GoogleSyncConfig } from '../types/schedule';
import { loadSyncConfig, saveSyncConfig } from '../services/google-sync';

export interface SyncModalOptions {
  onPull: (config: GoogleSyncConfig) => Promise<void>;
  onPush: (config: GoogleSyncConfig) => Promise<void>;
  onExportCsv: () => void;
  onImportCsv: (csvText: string) => void;
  onResetSeed: () => void;
}

export class SyncModal {
  private overlay: HTMLElement;
  private options: SyncModalOptions;

  constructor(options: SyncModalOptions) {
    this.options = options;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  public open() {
    this.render();
    this.overlay.classList.add('open');
  }

  public close() {
    this.overlay.classList.remove('open');
  }

  private render() {
    const config = loadSyncConfig();

    this.overlay.innerHTML = `
      <div class="modal-card" style="max-width: 650px;">
        <div class="modal-header">
          <div class="modal-title">Google Sheets & Shared Drive Sync</div>
          <button class="modal-close-btn" id="sync-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 1.25rem; padding: 0.85rem 1rem; background: var(--cat-hw-bg); border-left: 4px solid var(--cat-hw); border-radius: var(--radius-sm); font-size: 0.82rem; color: #e2e8f0;">
            <strong>Google Drive Permission Model:</strong><br>
            Store your Google Sheet in your team's Shared Google Drive. Only team members granted Edit access to the Google Drive sheet can commit modifications to the master schedule.
          </div>

          <div class="form-group">
            <label class="form-label">Google Apps Script Web App URL</label>
            <input type="text" id="sync-apps-script-url" class="form-input" value="${config.appsScriptUrl || ''}" placeholder="https://script.google.com/macros/s/.../exec" />
            <div class="help-text">
              Deploy the provided <code>Code.gs</code> in your Google Sheet's Apps Script editor. Set access to your team or organization.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Google Spreadsheet ID or Link</label>
            <input type="text" id="sync-sheet-id" class="form-input" value="${config.spreadsheetId || ''}" placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" />
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-pull-sheets">
              ⬇ Pull from Google Sheets
            </button>
            <button class="btn btn-secondary" id="btn-push-sheets">
              ⬆ Push Changes to Sheets
            </button>
          </div>

          <div id="sync-status-msg" style="margin-top: 0.75rem; font-size: 0.82rem; min-height: 1.2rem;"></div>

          <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 1.5rem 0;" />

          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem;">Offline & Local Data Utilities</h4>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-export-csv">
              Export Schedule (CSV)
            </button>
            <label class="btn btn-secondary" style="cursor: pointer;">
              Import Schedule (CSV)
              <input type="file" id="file-import-csv" accept=".csv" style="display: none;" />
            </label>
            <button class="btn btn-secondary" id="btn-reset-seed" style="color: var(--warning);">
              Reset to Brainstorm Data
            </button>
          </div>

          <div style="margin-top: 1.5rem; padding: 0.85rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.78rem; color: #94a3b8;">
            <strong>Setup Guide in 3 Steps:</strong>
            <ol style="margin-left: 1.25rem; margin-top: 0.4rem; line-height: 1.6;">
              <li>Create a sheet in your Shared Google Drive and open <em>Extensions &gt; Apps Script</em>.</li>
              <li>Paste the contents of <code>google-apps-script/Code.gs</code> from this repository and run <code>setupSpreadsheet()</code>.</li>
              <li>Click <em>Deploy &gt; New deployment &gt; Web app</em> and paste the resulting URL above.</li>
            </ol>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-save-sync-config">Save Configuration</button>
        </div>
      </div>
    `;

    this.overlay.querySelector('#sync-modal-close')?.addEventListener('click', () => this.close());
    
    const statusMsg = this.overlay.querySelector('#sync-status-msg') as HTMLElement;

    const saveConfig = () => {
      const appsScriptUrl = (this.overlay.querySelector('#sync-apps-script-url') as HTMLInputElement).value.trim();
      const spreadsheetId = (this.overlay.querySelector('#sync-sheet-id') as HTMLInputElement).value.trim();
      const newConfig: GoogleSyncConfig = {
        ...config,
        appsScriptUrl,
        spreadsheetId
      };
      saveSyncConfig(newConfig);
      return newConfig;
    };

    this.overlay.querySelector('#btn-save-sync-config')?.addEventListener('click', () => {
      saveConfig();
      statusMsg.style.color = 'var(--success)';
      statusMsg.textContent = 'Configuration saved.';
      setTimeout(() => this.close(), 500);
    });

    this.overlay.querySelector('#btn-pull-sheets')?.addEventListener('click', async () => {
      const currentConfig = saveConfig();
      if (!currentConfig.appsScriptUrl) {
        statusMsg.style.color = 'var(--warning)';
        statusMsg.textContent = 'Please enter your Google Apps Script URL above.';
        return;
      }
      statusMsg.style.color = 'var(--accent-blue)';
      statusMsg.textContent = 'Connecting and fetching from Google Sheets...';
      try {
        await this.options.onPull(currentConfig);
        statusMsg.style.color = 'var(--success)';
        statusMsg.textContent = 'Successfully pulled latest schedule from Google Sheets!';
      } catch (err: any) {
        statusMsg.style.color = 'var(--danger)';
        statusMsg.textContent = `Sync failed: ${err.message}`;
      }
    });

    this.overlay.querySelector('#btn-push-sheets')?.addEventListener('click', async () => {
      const currentConfig = saveConfig();
      if (!currentConfig.appsScriptUrl) {
        statusMsg.style.color = 'var(--warning)';
        statusMsg.textContent = 'Please enter your Google Apps Script URL above.';
        return;
      }
      statusMsg.style.color = 'var(--accent-blue)';
      statusMsg.textContent = 'Pushing updates to Google Sheets...';
      try {
        await this.options.onPush(currentConfig);
        statusMsg.style.color = 'var(--success)';
        statusMsg.textContent = 'Successfully committed updates to Google Sheets!';
      } catch (err: any) {
        statusMsg.style.color = 'var(--danger)';
        statusMsg.textContent = `Push failed: ${err.message}`;
      }
    });

    this.overlay.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      this.options.onExportCsv();
    });

    const fileInput = this.overlay.querySelector('#file-import-csv') as HTMLInputElement;
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          this.options.onImportCsv(text);
          statusMsg.style.color = 'var(--success)';
          statusMsg.textContent = 'CSV imported successfully!';
        }
      };
      reader.readAsText(file);
    });

    this.overlay.querySelector('#btn-reset-seed')?.addEventListener('click', () => {
      if (confirm('Reset all schedule data back to the original brainstorm whiteboard data?')) {
        this.options.onResetSeed();
        statusMsg.style.color = 'var(--success)';
        statusMsg.textContent = 'Reset to whiteboard baseline.';
        setTimeout(() => this.close(), 600);
      }
    });
  }
}
