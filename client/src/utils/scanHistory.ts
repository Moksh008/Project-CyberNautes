// Client-side persistence for scan history and user preferences.
// The backend exposes no history/stats/settings endpoints, so a user's own
// completed scans and preferences are stored locally in the browser.

const HISTORY_KEY = 'sentinel_scan_history';
const SETTINGS_KEY = 'sentinel_settings';
const GITHUB_TOKEN_KEY = 'sentinel_github_token';

export interface ScanRecord {
  id: string;
  name: string;
  source: 'json' | 'github';
  repo?: string;
  assetCount: number;
  cveCount: number;
  verifiedCount: number;
  riskBefore: number;
  riskAfter: number;
  reduction: number;
  timestamp: number;
}

export interface AppSettings {
  autoRunSandbox: boolean;
  reportTheme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoRunSandbox: true,
  reportTheme: 'dark',
};

export function getScans(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanRecord[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch {
    return [];
  }
}

export function upsertScan(record: ScanRecord): ScanRecord[] {
  try {
    const scans = getScans().filter((s) => s.id !== record.id);
    scans.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(scans));
    return scans;
  } catch {
    return getScans();
  }
}

export function clearScans(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

// GitHub PAT is a sensitive credential — stored only in this browser, never in Firestore.
export function getGithubToken(): string {
  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGithubToken(token: string): void {
  try {
    if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token);
    else localStorage.removeItem(GITHUB_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
