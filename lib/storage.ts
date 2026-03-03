import type { MonthData } from "./types";

const MONTH_PREFIX = "income-calc:month:";
const ACTIVE_KEY = "income-calc:active";

// Legacy keys for migration
const LEGACY_CURRENT_KEY = "income-calc:current";
const LEGACY_ARCHIVE_PREFIX = "income-calc:archive:";

export function loadMonth(month: string): MonthData | null {
  const raw = localStorage.getItem(`${MONTH_PREFIX}${month}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function saveMonth(data: MonthData): void {
  localStorage.setItem(`${MONTH_PREFIX}${data.month}`, JSON.stringify(data));
}

export function deleteMonth(month: string): void {
  localStorage.removeItem(`${MONTH_PREFIX}${month}`);
  if (getActiveMonth() === month) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function loadAllMonths(): MonthData[] {
  const months: MonthData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MONTH_PREFIX)) {
      months.push(JSON.parse(localStorage.getItem(key)!));
    }
  }
  return months.sort((a, b) => b.month.localeCompare(a.month));
}

export function getActiveMonth(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveMonth(month: string): void {
  localStorage.setItem(ACTIVE_KEY, month);
}

// Migrate archived months to regular months
function migrateArchives() {
  const keysToMigrate: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LEGACY_ARCHIVE_PREFIX)) keysToMigrate.push(key);
  }
  for (const key of keysToMigrate) {
    const raw = JSON.parse(localStorage.getItem(key)!);
    const { results, archivedAt, ...monthData } = raw;
    saveMonth(monthData as MonthData);
    localStorage.removeItem(key);
  }
}

// Convenience wrappers that operate on the active month
export function loadCurrentMonth(): MonthData | null {
  migrateArchives();

  // Migrate legacy single-key storage
  const legacy = localStorage.getItem(LEGACY_CURRENT_KEY);
  if (legacy) {
    const data: MonthData = JSON.parse(legacy);
    saveMonth(data);
    setActiveMonth(data.month);
    localStorage.removeItem(LEGACY_CURRENT_KEY);
    return data;
  }

  const active = getActiveMonth();
  if (!active) return null;
  return loadMonth(active);
}

export function saveCurrentMonth(data: MonthData): void {
  saveMonth(data);
  setActiveMonth(data.month);
}

export function renameMonth(oldMonth: string, newMonth: string): void {
  const data = loadMonth(oldMonth);
  if (!data) return;
  deleteMonth(oldMonth);
  data.month = newMonth;
  saveMonth(data);
  if (getActiveMonth() === oldMonth) {
    setActiveMonth(newMonth);
  }
}
