import { html, mount } from './dom';

let host: HTMLElement | null = null;

export function toast(message: string, opts: { undo?: () => void; tone?: 'info' | 'error' } = {}) {
  host ??= document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast-${opts.tone ?? 'info'}`;
  el.setAttribute('role', opts.tone === 'error' ? 'alert' : 'status');
  mount(el, html`<span>${message}</span>${opts.undo ? html`<button class="btn btn-xs" data-undo>Undo</button>` : ''}<button class="icon-btn" data-dismiss aria-label="Dismiss">×</button>`);
  const close = () => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 180);
  };
  el.querySelector('[data-undo]')?.addEventListener('click', () => {
    opts.undo?.();
    close();
  });
  el.querySelector('[data-dismiss]')?.addEventListener('click', close);
  host.appendChild(el);
  setTimeout(close, opts.tone === 'error' ? 9000 : 6000);
}
