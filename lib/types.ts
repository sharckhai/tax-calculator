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
  expensesPrivate: ExpenseItem[];
  lastModified: string;
}

export interface YearlyResult {
  year: string;
  monthCount: number;
  months: { month: string; result: CalculationResult }[];
  revenueNetTotal: number;
  revenueGrossTotal: number;
  expensesBusinessGrossTotal: number;
  recurringExpensesGrossTotal: number;
  oneTimeExpensesGrossTotal: number;
  vatPayableTotal: number;
  profitTotal: number;
  incomeTaxTotal: number;
  cashInTotal: number;
  cashOutTotal: number;
  cashLeftTotal: number;
  savingsTotal: number;
}

export interface CalculationResult {
  revenueNetTotal: number;
  revenueVatTotal: number;
  revenueGrossTotal: number;
  expensesBusinessNetTotal: number;
  expensesBusinessVatTotal: number;
  expensesBusinessGrossTotal: number;
  recurringExpensesGrossTotal: number;
  oneTimeExpensesGrossTotal: number;
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

