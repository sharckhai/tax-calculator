"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { MonthData } from "./types";
import { DEFAULT_BRACKET_RATES } from "./defaults";

interface DataFile {
  activeMonth: string;
  activeView?: "month" | "dashboard" | "settings" | "recurring";
  months: MonthData[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_PATH = path.join(DATA_DIR, "data.json");
const LEGACY_PATH = path.join(DATA_DIR, "current.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function migrateLegacy(raw: Record<string, unknown>): MonthData {
  const settings = raw.settings as Record<string, unknown> | undefined;
  const revenues = (raw.revenues as Record<string, unknown>[]) ?? [];
  const expBiz =
    (raw.expenses_business as Record<string, unknown>[]) ??
    (raw.expensesBusiness as Record<string, unknown>[]) ??
    [];
  const expPriv =
    (raw.expenses_private as Record<string, unknown>[]) ??
    (raw.expensesPrivate as Record<string, unknown>[]) ??
    [];

  return {
    month: raw.month as string,
    settings: {
      vatRate: (settings?.vat_rate ?? settings?.vatRate ?? 0.19) as number,
      isVatLiable: (settings?.isVatLiable ?? true) as boolean,
      incomeTaxMethod: (settings?.income_tax_method ??
        settings?.incomeTaxMethod ??
        "flat_rate") as MonthData["settings"]["incomeTaxMethod"],
      flatIncomeTaxRate: (settings?.flat_income_tax_rate ??
        settings?.flatIncomeTaxRate ??
        0.3) as number,
      bracketRates: (settings?.bracketRates ??
        DEFAULT_BRACKET_RATES) as MonthData["settings"]["bracketRates"],
    },
    revenues: revenues.map((r) => ({
      id: (r.id as string) ?? crypto.randomUUID(),
      label: (r.label as string) ?? "",
      hourlyRate: (r.hourlyRate as number) ?? 0,
      hours: (r.hours as number) ?? 0,
      amount: (r.amount as number) ?? 0,
      amountType: (r.amount_type ?? r.amountType ?? "net") as "gross" | "net",
      vatRate: r.vat_rate != null ? (r.vat_rate as number) : r.vatRate != null ? (r.vatRate as number) : undefined,
    })),
    expensesBusiness: expBiz.map((e) => ({
      id: (e.id as string) ?? crypto.randomUUID(),
      label: (e.label as string) ?? "",
      amount: (e.amount as number) ?? 0,
      amountType: (e.amount_type ?? e.amountType ?? "gross") as "gross" | "net",
      vatRate: e.vat_rate != null ? (e.vat_rate as number) : e.vatRate != null ? (e.vatRate as number) : undefined,
      isRecurring: (e.is_recurring ?? e.isRecurring ?? false) as boolean,
    })),
    expensesPrivate: expPriv.map((e) => ({
      id: (e.id as string) ?? crypto.randomUUID(),
      label: (e.label as string) ?? "",
      amount: (e.amount as number) ?? 0,
      amountType: (e.amount_type ?? e.amountType ?? "gross") as "gross" | "net",
      vatRate: e.vat_rate != null ? (e.vat_rate as number) : e.vatRate != null ? (e.vatRate as number) : undefined,
      isRecurring: (e.is_recurring ?? e.isRecurring ?? false) as boolean,
    })),
    lastModified: (raw.last_modified ?? raw.lastModified ?? new Date().toISOString()) as string,
  };
}

async function readData(): Promise<DataFile> {
  await ensureDir();

  // Try data.json first
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as DataFile;
    // Restore Infinity in bracketRates (JSON serializes Infinity as null)
    for (const m of data.months) {
      m.settings.bracketRates = m.settings.bracketRates.map(
        ([threshold, rate]) => [threshold ?? Infinity, rate] as [number, number]
      );
    }
    return data;
  } catch {
    // data.json doesn't exist, try legacy migration
  }

  // Try legacy current.json
  try {
    const raw = await fs.readFile(LEGACY_PATH, "utf-8");
    const legacy = JSON.parse(raw);
    const month = migrateLegacy(legacy);
    const data: DataFile = { activeMonth: month.month, months: [month] };
    await writeData(data);
    await fs.unlink(LEGACY_PATH);
    return data;
  } catch {
    // No legacy file either
  }

  return { activeMonth: "", months: [] };
}

async function writeData(data: DataFile): Promise<void> {
  await ensureDir();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function loadAllMonths(): Promise<MonthData[]> {
  const data = await readData();
  return data.months.sort((a, b) => b.month.localeCompare(a.month));
}

export async function loadCurrentMonth(): Promise<MonthData | null> {
  const data = await readData();
  if (!data.activeMonth) return null;
  return data.months.find((m) => m.month === data.activeMonth) ?? null;
}

export async function saveMonth(monthData: MonthData): Promise<void> {
  const data = await readData();
  const idx = data.months.findIndex((m) => m.month === monthData.month);
  if (idx >= 0) {
    data.months[idx] = monthData;
  } else {
    data.months.push(monthData);
  }
  await writeData(data);
}

export async function deleteMonth(month: string): Promise<void> {
  const data = await readData();
  data.months = data.months.filter((m) => m.month !== month);
  if (data.activeMonth === month) {
    data.activeMonth = data.months[0]?.month ?? "";
  }
  await writeData(data);
}

export async function setActiveMonth(month: string): Promise<void> {
  const data = await readData();
  data.activeMonth = month;
  await writeData(data);
}

export async function getActiveMonth(): Promise<string> {
  const data = await readData();
  return data.activeMonth;
}

export async function getActiveView(): Promise<"month" | "dashboard" | "settings" | "recurring"> {
  const data = await readData();
  return data.activeView ?? "dashboard";
}

export async function setActiveView(view: "month" | "dashboard" | "settings" | "recurring"): Promise<void> {
  const data = await readData();
  data.activeView = view;
  await writeData(data);
}

export async function renameMonth(oldMonth: string, newMonth: string): Promise<void> {
  const data = await readData();
  const month = data.months.find((m) => m.month === oldMonth);
  if (!month) return;
  month.month = newMonth;
  if (data.activeMonth === oldMonth) {
    data.activeMonth = newMonth;
  }
  await writeData(data);
}
