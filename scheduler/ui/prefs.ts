/** Per-viewer UI conveniences. Shared data never goes here. */
export interface Prefs {
  theme: 'light' | 'dark' | 'system';
  mapHideDone: boolean;
  mapCritical: boolean;
  mapZoom: number;
  boardHideDone: boolean;
  dismissedGuestBanner: boolean;
}

const KEY = 'usst_ui_prefs_v1';

const defaults: Prefs = {
  theme: 'system',
  mapHideDone: false,
  mapCritical: true,
  mapZoom: 1,
  boardHideDone: false,
  dismissedGuestBanner: false
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
