import type { Settings, MonthData, RevenueItem, ExpenseItem } from "./types";

export const DEFAULT_BRACKET_RATES: [number, number][] = [
  [11604, 0.0],
  [17005, 0.14],
  [66760, 0.24],
  [277825, 0.42],
  [Infinity, 0.45],
];

export const DEFAULT_SETTINGS: Settings = {
  vatRate: 0.19,
  isVatLiable: true,
  incomeTaxMethod: "flat_rate",
  flatIncomeTaxRate: 0.3,
  bracketRates: DEFAULT_BRACKET_RATES,
};

export function createRevenueItem(): RevenueItem {
  return {
    id: crypto.randomUUID(),
    label: "",
    hourlyRate: 0,
    hours: 0,
    amount: 0,
    amountType: "net",
  };
}

export function createExpenseItem(isRecurring: boolean): ExpenseItem {
  return {
    id: crypto.randomUUID(),
    label: "",
    amount: 0,
    amountType: "gross",
    isRecurring,
  };
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function createEmptyMonth(month?: string): MonthData {
  return {
    month: month ?? getCurrentMonth(),
    settings: { ...DEFAULT_SETTINGS, bracketRates: [...DEFAULT_BRACKET_RATES] },
    revenues: [],
    expensesBusiness: [],
    expensesPrivate: [],
    lastModified: new Date().toISOString(),
  };
}
