import type { Task } from '../../app.js';
import type { SyncStatus } from '../../firebase.js';
import {
  BLOCKS,
  TASKS,
  TEAM_MEMBERS,
  blockMap,
  createNewTask,
  addBlock,
  updateBlock,
  addCrewMember,
  setActiveUser,
  getActiveUser,
  activeFilters,
  FUN_COLOR_PALETTE
} from '../../app.js';
import { html, mount, icon, type Safe } from './dom';

function dialogEl(): HTMLDialogElement {
  return document.getElementById('dialog') as HTMLDialogElement;
}

function show(title: string, body: Safe, onSubmit: (data: FormData) => boolean | void, wide = false) {
  const dlg = dialogEl();
  dlg.classList.toggle('is-wide', wide);
  mount(
    dlg,
    html`<form method="dialog" class="dialog-form" novalidate>
      <header class="dialog-head"><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="Close">${icon('close', 16)}</button></header>
      <div class="dialog-body">${body}</div>
    </form>`
  );
  const form = dlg.querySelector('form')!;
  form.addEventListener('submit', e => {
    const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value === 'cancel') return;
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (onSubmit(new FormData(form)) !== false) dlg.close();
  });
  dlg.querySelector('[data-close]')!.addEventListener('click', () => dlg.close());
  dlg.showModal();
  dlg.querySelector<HTMLElement>('[autofocus]')?.focus();
}

const str = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const lines = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean);

export function openNewTask(defaults: { blockId?: string } = {}, onCreated: (t: Task) => void) {
  const user = getActiveUser();
  const blockId = defaults.blockId ?? (activeFilters.blockId !== 'all' ? activeFilters.blockId : BLOCKS[1]?.id ?? BLOCKS[0].id);

  show(
    'Add a task',
    html`
      <label class="field"><span>What needs doing?</span><input class="input" name="title" required autofocus placeholder="e.g. Bring up the barometer over I²C"/></label>
      <div class="field-row">
        <label class="field"><span>Subsystem</span>
          <select class="input" name="blockId">${BLOCKS.map(b => html`<option value="${b.id}" ${b.id === blockId ? 'selected' : ''}>${b.name}</option>`)}</select></label>
        <label class="field"><span>Who will do it?</span>
          <select class="input" name="owner">
            <option value="">Nobody yet</option>
            ${TEAM_MEMBERS.map(m => html`<option value="${m.id}" ${m.id === user.id ? 'selected' : ''}>${m.name}</option>`)}
          </select></label>
      </div>
      <label class="field"><span>Has to wait for <em>optional</em></span>
        <select class="input" name="after"><option value="">Nothing, it can start now</option>
          ${BLOCKS.map(b => {
            const ts = TASKS.filter(t => t.blockId === b.id && t.status !== 'done');
            return ts.length ? html`<optgroup label="${b.name}">${ts.map(t => html`<option value="${t.id}">${t.title.slice(0, 80)}</option>`)}</optgroup>` : '';
          })}
        </select></label>
      <footer class="dialog-foot">
        <button class="btn btn-ghost" value="cancel" formnovalidate>Cancel</button>
        <button class="btn btn-primary" type="submit">Add task</button>
      </footer>`,
    data => {
      const owner = str(data, 'owner');
      const after = str(data, 'after');
      const task = createNewTask({
        blockId: str(data, 'blockId'),
        title: str(data, 'title'),
        epic: '',
        status: 'todo',
        assignees: owner ? [owner] : [],
        dependsOn: after ? [after] : [],
        endDate: ''
      });
      onCreated(task);
    }
  );
}

export function openBlockEditor(blockId: string | null) {
  const existing = blockId ? blockMap[blockId] : null;
  const b = existing ?? {
    code: `Block ${BLOCKS.length}`,
    name: '',
    subtitle: '',
    color: FUN_COLOR_PALETTE[BLOCKS.length % FUN_COLOR_PALETTE.length],
    objective: '',
    deliverables: [] as string[],
    repos: [] as { name: string; url: string }[]
  };

  show(
    existing ? `Edit ${existing.code}` : 'New subsystem',
    html`
      <div class="field-row">
        <label class="field field-narrow"><span>Code</span><input class="input" name="code" required value="${b.code}"/></label>
        <label class="field"><span>Name</span><input class="input" name="name" required autofocus value="${b.name}" placeholder="e.g. Payload & Science"/></label>
      </div>
      <label class="field"><span>Summary</span><input class="input" name="subtitle" value="${b.subtitle}"/></label>
      <div class="field"><span>Colour</span>
        <div class="swatches">
          ${FUN_COLOR_PALETTE.map(c => html`<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${c === b.color ? 'checked' : ''}/><span></span></label>`)}
          <label class="swatch swatch-custom" title="Custom colour"><input type="color" name="customColor" value="${b.color}"/></label>
        </div>
      </div>
      <label class="field"><span>Objective</span><textarea class="input" name="objective" rows="2">${b.objective}</textarea></label>
      <label class="field"><span>Deliverables <em>one per line</em></span><textarea class="input" name="deliverables" rows="3">${b.deliverables.join('\n')}</textarea></label>
      <label class="field"><span>Repositories <em>one URL per line</em></span><textarea class="input mono" name="repos" rows="2" placeholder="https://github.com/USSTRocketry/Maidstone">${b.repos.map(r => r.url).join('\n')}</textarea></label>
      <footer class="dialog-foot">
        <button class="btn btn-ghost" value="cancel" formnovalidate>Cancel</button>
        <button class="btn btn-primary" type="submit">${existing ? 'Save subsystem' : 'Create subsystem'}</button>
      </footer>`,
    data => {
      const picked = str(data, 'color');
      const custom = str(data, 'customColor');
      const payload = {
        code: str(data, 'code'),
        name: str(data, 'name'),
        subtitle: str(data, 'subtitle'),
        color: picked || custom,
        objective: str(data, 'objective'),
        deliverables: lines(str(data, 'deliverables')),
        repos: lines(str(data, 'repos')).map(url => ({ name: url.replace(/^https?:\/\/github\.com\//, ''), url }))
      };
      if (existing) updateBlock(existing.id, payload);
      else addBlock(payload);
    }
  );
  const dlg = dialogEl();
  dlg.querySelector('input[name=customColor]')?.addEventListener('input', () => {
    dlg.querySelectorAll<HTMLInputElement>('input[name=color]').forEach(r => (r.checked = false));
  });
}

export function openAccount(sync: SyncStatus, actions: { signOut: () => void }) {
  const me = getActiveUser();

  show(
    'Which crew member are you?',
    html`
      <p class="muted">Pick your name so the site can show your tasks. You only need to do this once on each device.</p>
      <div class="crew-grid">
        ${TEAM_MEMBERS.map(m => html`
          <button type="button" class="crew-btn ${m.id === me.id ? 'is-on' : ''}" data-who="${m.id}" style="--c:${m.color}">
            <span class="avatar avatar-md" style="--c:${m.color}">${m.avatar}</span>
            <span><strong>${m.name}</strong><span class="muted small">${m.role}</span></span>
          </button>`)}
      </div>

      <details class="disclosure">
        <summary>My name isn't here</summary>
        <div class="field-row">
          <label class="field"><span>Your name</span><input class="input" name="newName"/></label>
          <label class="field"><span>What you work on <em>optional</em></span><input class="input" name="newRole" placeholder="e.g. Embedded"/></label>
        </div>
        <button type="submit" class="btn btn-sm">Add me</button>
      </details>

      ${sync.user ? html`
        <footer class="account-foot">
          <span class="muted small">Signed in as ${sync.user.email ?? sync.user.name}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-sync="out">Sign out</button>
        </footer>` : ''}`,
    data => {
      const created = addCrewMember({ name: str(data, 'newName'), role: str(data, 'newRole') || undefined });
      if (!created) return false;
      setActiveUser(created.id);
    },
    true
  );

  const dlg = dialogEl();
  dlg.querySelectorAll<HTMLElement>('[data-who]').forEach(btn =>
    btn.addEventListener('click', () => {
      setActiveUser(btn.dataset.who!);
      dlg.close();
    })
  );
  dlg.querySelector('[data-sync="out"]')?.addEventListener('click', () => {
    dlg.close();
    actions.signOut();
  });
}
