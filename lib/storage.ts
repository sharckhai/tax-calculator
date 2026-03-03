import type { MonthData, ArchivedMonth } from "./types";

const MONTH_PREFIX = "income-calc:month:";
const ACTIVE_KEY = "income-calc:active";
const ARCHIVE_PREFIX = "income-calc:archive:";

// Legacy key for migration
const LEGACY_CURRENT_KEY = "income-calc:current";

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

// Convenience wrappers that operate on the active month
export function loadCurrentMonth(): MonthData | null {
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

export function loadArchives(): ArchivedMonth[] {
  const archives: ArchivedMonth[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(ARCHIVE_PREFIX)) {
      archives.push(JSON.parse(localStorage.getItem(key)!));
    }
  }
  return archives.sort((a, b) => b.month.localeCompare(a.month));
}

export function saveArchive(archive: ArchivedMonth): void {
  localStorage.setItem(`${ARCHIVE_PREFIX}${archive.month}`, JSON.stringify(archive));
}
