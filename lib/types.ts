export type AmountType = "gross" | "net";
export type IncomeTaxMethod = "flat_rate" | "simple_brackets";

export interface Settings {
  vatRate: number;
  isVatLiable: boolean;
  incomeTaxMethod: IncomeTaxMethod;
  flatIncomeTaxRate: number;
  bracketRates: [number, number][];
}

export interface RevenueItem {
  id: string;
  label: string;
  hourlyRate: number;
  hours: number;
  amount: number;
  amountType: AmountType;
  vatRate?: number;
}

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
  amountType: AmountType;
  vatRate?: number;
  isRecurring: boolean;
}

export interface MonthData {
  month: string;
  settings: Settings;
  revenues: RevenueItem[];
  expensesBusiness: ExpenseItem[];
  lastModified: string;
}

export interface CalculationResult {
  revenueNetTotal: number;
  revenueVatTotal: number;
  revenueGrossTotal: number;
  expensesBusinessNetTotal: number;
  expensesBusinessVatTotal: number;
  expensesBusinessGrossTotal: number;
  outputVat: number;
  inputVat: number;
  vatPayable: number;
  vatRefund: number;
  profitMonth: number;
  profitYearEst: number;
  incomeTaxYearEst: number;
  incomeTaxMonthEst: number;
  cashIn: number;
  cashOut: number;
  cashLeftEst: number;
  savingsVat: number;
  savingsIncomeTax: number;
  savingsTotal: number;
}

export interface ArchivedMonth extends MonthData {
  results: CalculationResult;
  archivedAt: string;
}
