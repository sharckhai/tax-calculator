import type { MonthData } from "@/lib/types";
import { formatShortMonthLabel } from "@/lib/utils";

export interface HoursMetrics {
  totalHours: number;
  effectiveHourlyRate: number;
  monthlyHours: { month: string; hours: number }[];
}

export interface ExpenseEntry {
  label: string;
  totalAmount: number;
  occurrences: number;
  isRecurring: boolean;
}

export interface ExpenseInsights {
  topExpenses: ExpenseEntry[];
  recurringTotal: number;
  oneTimeTotal: number;
  monthlyExpenses: Record<string, string | number>[];
  expenseLabels: string[];
}

export function calcHoursMetrics(
  monthsData: MonthData[],
  revenueNetTotal: number,
): HoursMetrics | null {
  let totalHours = 0;
  const monthlyHours: { month: string; hours: number }[] = [];

  for (const md of monthsData) {
    let monthHours = 0;
    for (const r of md.revenues) {
      monthHours += r.hours;
    }
    totalHours += monthHours;
    monthlyHours.push({ month: formatShortMonthLabel(md.month), hours: monthHours });
  }

  if (totalHours === 0) return null;

  return {
    totalHours,
    effectiveHourlyRate: revenueNetTotal / totalHours,
    monthlyHours,
  };
}

export function calcExpenseInsights(monthsData: MonthData[], expenseField: "expensesBusiness" | "expensesPrivate"): ExpenseInsights {
  const grouped = new Map<string, { displayLabel: string; totalAmount: number; occurrences: number; isRecurring: boolean }>();

  const monthlyExpenses: Record<string, string | number>[] = [];
  let recurringTotal = 0;
  let oneTimeTotal = 0;

  for (const md of monthsData) {
    const monthRow: Record<string, string | number> = { month: formatShortMonthLabel(md.month) };

    for (const e of md[expenseField]) {
      const trimmed = e.label.trim();
      const key = trimmed.toLowerCase() || "(unlabeled)";
      const displayLabel = trimmed || "(Unlabeled)";

      const gross = e.amountType === "gross" ? e.amount : e.amount * (1 + (e.vatRate ?? 0) / 100);

      const existing = grouped.get(key);
      if (existing) {
        existing.totalAmount += gross;
        existing.occurrences += 1;
        if (e.isRecurring) existing.isRecurring = true;
      } else {
        grouped.set(key, { displayLabel, totalAmount: gross, occurrences: 1, isRecurring: e.isRecurring });
      }

      monthRow[displayLabel] = ((monthRow[displayLabel] as number) || 0) + gross;

      if (e.isRecurring) {
        recurringTotal += gross;
      } else {
        oneTimeTotal += gross;
      }
    }

    monthlyExpenses.push(monthRow);
  }

  const topExpenses = Array.from(grouped.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
    .map(({ displayLabel, totalAmount, occurrences, isRecurring }) => ({
      label: displayLabel,
      totalAmount,
      occurrences,
      isRecurring,
    }));

  const expenseLabels = topExpenses.map((e) => e.label);

  return { topExpenses, recurringTotal, oneTimeTotal, monthlyExpenses, expenseLabels };
}
