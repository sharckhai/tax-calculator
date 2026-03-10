import type { MonthData, CalculationResult, YearlyResult } from "./types";
import { calcMonth } from "./calculator";

export function getAvailableYears(allMonths: MonthData[]): string[] {
  const years = new Set(allMonths.map((m) => m.month.split("-")[0]));
  return [...years].sort((a, b) => b.localeCompare(a));
}

export function calcYear(allMonths: MonthData[], year: string): YearlyResult {
  const filtered = allMonths.filter((m) => m.month.startsWith(year + "-"));
  const months = filtered
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ month: m.month, result: calcMonth(m) }));

  const sum = (fn: (r: CalculationResult) => number) =>
    Math.round(months.reduce((acc, { result }) => acc + fn(result), 0) * 100) / 100;

  return {
    year,
    monthCount: months.length,
    months,
    revenueNetTotal: sum((r) => r.revenueNetTotal),
    revenueGrossTotal: sum((r) => r.revenueGrossTotal),
    expensesBusinessGrossTotal: sum((r) => r.expensesBusinessGrossTotal),
    recurringExpensesGrossTotal: sum((r) => r.recurringExpensesGrossTotal),
    oneTimeExpensesGrossTotal: sum((r) => r.oneTimeExpensesGrossTotal),
    vatPayableTotal: sum((r) => r.vatPayable),
    profitTotal: sum((r) => r.profitMonth),
    incomeTaxTotal: sum((r) => r.incomeTaxMonthEst),
    cashInTotal: sum((r) => r.cashIn),
    cashOutTotal: sum((r) => r.cashOut),
    cashLeftTotal: sum((r) => r.cashLeftEst),
    savingsTotal: sum((r) => r.savingsTotal),
  };
}
