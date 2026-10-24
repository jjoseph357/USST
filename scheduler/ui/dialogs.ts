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
  updateCrewMember,
  setActiveUser,
  getActiveUser,
  activeFilters,
  FUN_AVATAR_PACK,
  FUN_COLOR_PALETTE
} from '../../app.js';
import { html, mount, icon, STATUS_META, STATUS_ORDER, type Safe } from './dom';

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

export function openNewTask(defaults: { blockId?: string; status?: Task['status']; after?: string } = {}, onCreated: (t: Task) => void) {
  const user = getActiveUser();
  const blockId = defaults.blockId ?? (activeFilters.blockId !== 'all' ? activeFilters.blockId : BLOCKS[1]?.id ?? BLOCKS[0].id);
  const epics = [...new Set(TASKS.map(t => t.epic).filter(Boolean))].sort();

  show(
    'New task',
    html`
      <label class="field"><span>Title</span><input class="input" name="title" required autofocus placeholder="e.g. Bring up BMP390 barometer over I²C"/></label>
      <div class="field-row">
        <label class="field"><span>Subsystem</span>
          <select class="input" name="blockId">${BLOCKS.map(b => html`<option value="${b.id}" ${b.id === blockId ? 'selected' : ''}>${b.code} · ${b.name}</option>`)}</select></label>
        <label class="field"><span>Status</span>
          <select class="input" name="status">${STATUS_ORDER.map(s => html`<option value="${s}" ${s === (defaults.status ?? 'todo') ? 'selected' : ''}>${STATUS_META[s].label}</option>`)}</select></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Owner</span>
          <select class="input" name="owner">
            <option value="">Unassigned</option>
            ${TEAM_MEMBERS.map(m => html`<option value="${m.id}" ${m.id === user.id ? 'selected' : ''}>${m.avatar} ${m.name}</option>`)}
          </select></label>
        <label class="field"><span>Target date <em>optional</em></span><input class="input" type="date" name="endDate"/></label>
      </div>
      <label class="field"><span>Waits on <em>optional</em></span>
        <select class="input" name="after"><option value="">Nothing, it can start now</option>
          ${BLOCKS.map(b => {
            const ts = TASKS.filter(t => t.blockId === b.id);
            return ts.length ? html`<optgroup label="${b.code} · ${b.name}">${ts.map(t => html`<option value="${t.id}" ${t.id === defaults.after ? 'selected' : ''}>${t.id} · ${t.title.slice(0, 70)}</option>`)}</optgroup>` : '';
          })}
        </select></label>
      <label class="field"><span>Epic <em>optional</em></span><input class="input" name="epic" list="newEpicList" placeholder="Group of related work"/>
        <datalist id="newEpicList">${epics.map(e => html`<option value="${e}"></option>`)}</datalist></label>
      <footer class="dialog-foot">
        <button class="btn btn-ghost" value="cancel" formnovalidate>Cancel</button>
        <button class="btn btn-primary" type="submit">Create task</button>
      </footer>`,
    data => {
      const owner = str(data, 'owner');
      const after = str(data, 'after');
      const task = createNewTask({
        blockId: str(data, 'blockId'),
        title: str(data, 'title'),
        epic: str(data, 'epic'),
        status: str(data, 'status') as Task['status'],
        assignees: owner ? [owner] : [],
        dependsOn: after ? [after] : [],
        endDate: str(data, 'endDate')
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

export function openIdentity(sync: SyncStatus, actions: { signIn: () => void; signOut: () => void }) {
  const me = getActiveUser();
  const isGuest = me.id === 'guest';

  const syncBody = sync.user
    ? html`<p class="small">Signed in as <strong>${sync.user.email ?? sync.user.name}</strong>. Your changes save to the shared board for everyone.</p>
        <button type="button" class="btn btn-sm" data-sync="out">Sign out</button>`
    : html`<p class="small">You're reading the live board. <strong>Sign in to save changes for the whole team.</strong> Until then, your edits stay in this browser only.</p>
        <button type="button" class="btn btn-primary btn-sm" data-sync="in">Sign in with Google</button>`;

  show(
    'Who are you?',
    html`
      <p class="muted small">Pick your seat on the crew so "Assign me" and "Your tasks" work. This is remembered on this device.</p>
      <div class="crew-grid">
        ${TEAM_MEMBERS.map(m => html`
          <button type="button" class="crew-btn ${m.id === me.id ? 'is-on' : ''}" data-who="${m.id}" style="--c:${m.color}">
            <span class="avatar avatar-md" style="--c:${m.color}">${m.avatar}</span>
            <span><strong>${m.name}</strong><span class="muted small">${m.role}</span></span>
          </button>`)}
        <button type="button" class="crew-btn ${isGuest ? 'is-on' : ''}" data-who="guest">
          <span class="avatar avatar-md">👀</span><span><strong>Just looking</strong><span class="muted small">Read only</span></span>
        </button>
      </div>

      <details class="disclosure">
        <summary>Not on the list? Add yourself</summary>
        <div class="field-row">
          <label class="field"><span>Name</span><input class="input" name="newName" placeholder="Your name"/></label>
          <label class="field"><span>Role</span><input class="input" name="newRole" placeholder="e.g. Embedded Dev"/></label>
        </div>
        <button type="submit" class="btn btn-sm" name="intent" value="add">Add me to the crew</button>
      </details>

      ${isGuest ? '' : html`
        <details class="disclosure">
          <summary>Edit your profile</summary>
          <div class="avatar-pick">${FUN_AVATAR_PACK.map(a => html`<label><input type="radio" name="avatar" value="${a}" ${a === me.avatar ? 'checked' : ''}/><span>${a}</span></label>`)}</div>
          <label class="field"><span>Focus</span><input class="input" name="flair" value="${me.flair}"/></label>
          <button type="submit" class="btn btn-sm" name="intent" value="profile">Save profile</button>
        </details>`}

      <section class="sync-box">
        <h3>${icon('cloud', 14)} Cloud sync</h3>
        ${syncBody}
        ${sync.error ? html`<p class="small warn">Last save failed: ${sync.error}</p>` : ''}
      </section>`,
    data => {
      const intent = str(data, 'intent');
      if (intent === 'add') {
        const created = addCrewMember({ name: str(data, 'newName'), role: str(data, 'newRole') || undefined });
        if (!created) return false;
        setActiveUser(created.id);
      } else if (intent === 'profile') {
        updateCrewMember(me.id, { avatar: str(data, 'avatar') || me.avatar, flair: str(data, 'flair') || me.flair });
      }
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
  dlg.querySelector('[data-sync="in"]')?.addEventListener('click', () => {
    dlg.close();
    actions.signIn();
  });
  dlg.querySelector('[data-sync="out"]')?.addEventListener('click', () => {
    dlg.close();
    actions.signOut();
  });
  // new FormData(form) omits the submit button's own name/value, so carry the intent in a hidden field.
  dlg.querySelectorAll<HTMLButtonElement>('button[name=intent]').forEach(btn =>
    btn.addEventListener('click', () => {
      const form = dlg.querySelector('form')!;
      let hidden = form.querySelector<HTMLInputElement>('input[type=hidden][name=intent]');
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'intent';
        form.appendChild(hidden);
      }
      hidden.value = btn.value;
    })
  );
}
