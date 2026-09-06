import { GoogleSyncConfig } from '../types/schedule';
import { loadSyncConfig, saveSyncConfig } from '../services/google-sync';

export interface SetupModalOptions {
  onSync: (config: GoogleSyncConfig) => Promise<void>;
  onExportCsv: () => void;
  onImportCsv: (csvText: string) => void;
}

export class SetupModal {
  private backdrop: HTMLElement;
  private options: SetupModalOptions;

  constructor(options: SetupModalOptions) {
    this.options = options;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    document.body.appendChild(this.backdrop);

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });
  }

  public open() {
    this.render();
    this.backdrop.classList.add('open');
  }

  public close() {
    this.backdrop.classList.remove('open');
  }

  private render() {
    const config = loadSyncConfig();

    this.backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 680px;">
        <div class="modal-head">
          <h3>Google Sheets Setup &amp; Sync</h3>
          <button class="modal-close-icon" id="setup-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="padding: 0.75rem 1rem; background: var(--bg-surface-raised); border: 1px solid var(--border-default); border-radius: 4px; margin-bottom: 1.25rem;">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem;">Access Control via Shared Google Drive</div>
            <div style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.5;">
              Place the Google Sheet in your team's Shared Google Drive. Only team members with Edit permissions in Google Drive can alter dates or milestones. The website syncs directly from the sheet.
            </div>
          </div>

          <div class="form-field">
            <label>Google Apps Script Web App URL</label>
            <input type="text" id="setup-apps-script-url" class="text-input" value="${config.appsScriptUrl || ''}" placeholder="https://script.google.com/macros/s/.../exec" />
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.3rem;">
              Generated after deploying the provided script in your Google Sheet.
            </div>
          </div>

          <div class="form-field">
            <label>Spreadsheet Link or ID (Optional reference)</label>
            <input type="text" id="setup-sheet-id" class="text-input" value="${config.spreadsheetId || ''}" placeholder="https://docs.google.com/spreadsheets/d/..." />
          </div>

          <div style="display: flex; gap: 0.5rem; margin-top: 1rem; align-items: center;">
            <button class="btn btn-primary" id="btn-save-sync">
              Save &amp; Fetch Schedule
            </button>
            <button class="btn btn-default" id="btn-copy-script">
              Copy Apps Script (Code.gs)
            </button>
          </div>

          <div id="setup-status-msg" style="margin-top: 0.6rem; font-size: 0.78rem; min-height: 1.2rem;"></div>

          <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
            <h4 style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.6rem;">Setup Instructions</h4>
            <ol class="step-instruction-list">
              <li><strong>Create Sheet:</strong> Create a new spreadsheet in your team's Shared Google Drive.</li>
              <li><strong>Open Apps Script:</strong> In the top menu, go to <em>Extensions &gt; Apps Script</em>.</li>
              <li><strong>Paste Code:</strong> Click <em>Copy Apps Script (Code.gs)</em> above, replace any default code in the editor, and click <em>Run</em> with <code>setupSpreadsheet</code> selected. This builds the formatted <em>Schedule</em> and <em>Backlog</em> tabs pre-filled with the whiteboard schedule.</li>
              <li><strong>Deploy:</strong> Click <em>Deploy &gt; New deployment &gt; Web app</em>. Set <em>Execute as</em> to <strong>Me</strong> and <em>Who has access</em> to <strong>Anyone</strong>. Copy the URL and paste it into the field above.</li>
            </ol>
          </div>

          <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
            <h4 style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-dim); text-transform: uppercase;">Offline Data</h4>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-default" id="btn-export-csv" style="font-size: 0.75rem;">Export CSV</button>
              <label class="btn btn-default" style="font-size: 0.75rem; cursor: pointer;">
                Import CSV
                <input type="file" id="setup-file-import" accept=".csv" style="display: none;" />
              </label>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-default" id="setup-modal-dismiss">Close</button>
        </div>
      </div>
    `;

    this.backdrop.querySelector('#setup-modal-close')?.addEventListener('click', () => this.close());
    this.backdrop.querySelector('#setup-modal-dismiss')?.addEventListener('click', () => this.close());

    const statusMsg = this.backdrop.querySelector('#setup-status-msg') as HTMLElement;

    this.backdrop.querySelector('#btn-save-sync')?.addEventListener('click', async () => {
      const appsScriptUrl = (this.backdrop.querySelector('#setup-apps-script-url') as HTMLInputElement).value.trim();
      const spreadsheetId = (this.backdrop.querySelector('#setup-sheet-id') as HTMLInputElement).value.trim();

      const newConfig: GoogleSyncConfig = {
        ...config,
        appsScriptUrl,
        spreadsheetId
      };
      saveSyncConfig(newConfig);

      if (!appsScriptUrl) {
        statusMsg.style.color = 'var(--cat-milestone)';
        statusMsg.textContent = 'Configuration saved. Connect an Apps Script URL to fetch live sheet data.';
        return;
      }

      statusMsg.style.color = 'var(--accent)';
      statusMsg.textContent = 'Connecting and fetching schedule from Google Sheets...';

      try {
        await this.options.onSync(newConfig);
        statusMsg.style.color = 'var(--cat-sw)';
        statusMsg.textContent = 'Successfully synced with Google Sheets.';
        setTimeout(() => this.close(), 700);
      } catch (err: any) {
        statusMsg.style.color = '#ef4444';
        statusMsg.textContent = `Sync failed: ${err.message}`;
      }
    });

    this.backdrop.querySelector('#btn-copy-script')?.addEventListener('click', async () => {
      const copyBtn = this.backdrop.querySelector('#btn-copy-script') as HTMLElement;
      try {
        const scriptResponse = await fetch('/google-apps-script/Code.gs');
        const scriptText = scriptResponse.ok ? await scriptResponse.text() : '// Copy google-apps-script/Code.gs from the repo.';
        await navigator.clipboard.writeText(scriptText);
        copyBtn.textContent = 'Copied to Clipboard';
        setTimeout(() => { copyBtn.textContent = 'Copy Apps Script (Code.gs)'; }, 2000);
      } catch {
        copyBtn.textContent = 'See Code.gs in repo';
      }
    });

    this.backdrop.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      this.options.onExportCsv();
    });

    const fileInput = this.backdrop.querySelector('#setup-file-import') as HTMLInputElement;
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          this.options.onImportCsv(text);
          statusMsg.style.color = 'var(--cat-sw)';
          statusMsg.textContent = 'CSV schedule imported.';
        }
      };
      reader.readAsText(file);
    });
  }
}
