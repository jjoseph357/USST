/** Per-viewer UI conveniences. Shared data never goes here. */
export interface Prefs {
  theme: 'light' | 'dark' | 'system';
  mapShowDone: boolean;
  mapZoom: number;
  boardShowDone: boolean;
}

const KEY = 'usst_ui_prefs_v2';

const defaults: Prefs = {
  theme: 'system',
  mapShowDone: false,
  mapZoom: 1,
  boardShowDone: false
};

function load(): Prefs {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

export const prefs: Prefs = load();

export function savePrefs() {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or blocked storage: prefs just won't persist.
  }
}
