import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatShortMonthLabel(month: string, showYear = false): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  if (showYear) {
    return date.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString("de-DE", { month: "short" });
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}
