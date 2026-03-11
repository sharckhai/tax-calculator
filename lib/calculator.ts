import type { AmountType, Settings, RevenueItem, ExpenseItem, MonthData, CalculationResult } from "./types";

interface VatSplit {
  net: number;
  vat: number;
  gross: number;
}

export function splitVat(amount: number, amountType: AmountType, vatRate: number): VatSplit {
  amount = amount || 0;
  vatRate = vatRate || 0;

  if (amountType === "gross") {
    const gross = amount;
    const net = gross / (1 + vatRate);
    const vat = gross - net;
    return { net, vat, gross };
  }
  // net
  const net = amount;
  const vat = net * vatRate;
  const gross = net + vat;
  return { net, vat, gross };
}

export function estimateIncomeTaxYear(profitYear: number, method: string, settings: Settings): number {
  if (profitYear <= 0) return 0;

  if (method === "flat_rate") {
    return profitYear * settings.flatIncomeTaxRate;
  }

  // simple_brackets
  let tax = 0;
  let remaining = profitYear;
  let prevThreshold = 0;

  for (const [threshold, rate] of settings.bracketRates) {
    if (remaining <= 0) break;
    const bracketAmount = Math.min(remaining, threshold - prevThreshold);
    tax += bracketAmount * rate;
    remaining -= bracketAmount;
    prevThreshold = threshold;
    if (threshold === Infinity) break;
  }

  return tax;
}

function getRevenueAmount(item: RevenueItem): number {
  if (item.hourlyRate > 0 && item.hours > 0) {
    return item.hourlyRate * item.hours;
  }
  return item.amount;
}

export function calcMonth(monthData: MonthData): CalculationResult {
  const { settings, revenues, expensesBusiness, expensesPrivate = [] } = monthData;

  let revenueNetTotal = 0;
  let revenueVatTotal = 0;
  let revenueGrossTotal = 0;

  for (const item of revenues) {
    const vatRate = item.vatRate ?? settings.vatRate;
    const amount = getRevenueAmount(item);
    const { net, vat, gross } = splitVat(amount, item.amountType, vatRate);
    revenueNetTotal += net;
    if (settings.isVatLiable) revenueVatTotal += vat;
    revenueGrossTotal += gross;
  }

  let expensesBusinessNetTotal = 0;
  let expensesBusinessVatTotal = 0;
  let expensesBusinessGrossTotal = 0;
  let recurringExpensesGrossTotal = 0;
  let oneTimeExpensesGrossTotal = 0;

  for (const item of expensesBusiness) {
    const vatRate = item.vatRate ?? settings.vatRate;
    const { net, vat, gross } = splitVat(item.amount, item.amountType, vatRate);
    expensesBusinessNetTotal += net;
    if (settings.isVatLiable) expensesBusinessVatTotal += vat;
    expensesBusinessGrossTotal += gross;
    if (item.isRecurring) {
      recurringExpensesGrossTotal += gross;
    } else {
      oneTimeExpensesGrossTotal += gross;
    }
  }

  let expensesPrivateGrossTotal = 0;
  for (const item of expensesPrivate) {
    const vatRate = item.vatRate ?? settings.vatRate;
    const { gross } = splitVat(item.amount, item.amountType, vatRate);
    expensesPrivateGrossTotal += gross;
  }

  const outputVat = settings.isVatLiable ? revenueVatTotal : 0;
  const inputVat = settings.isVatLiable ? expensesBusinessVatTotal : 0;
  const vatPayable = Math.max(0, outputVat - inputVat);
  const vatRefund = Math.max(0, inputVat - outputVat);

  const profitMonth = revenueNetTotal - expensesBusinessNetTotal;
  const profitYearEst = profitMonth * 12;

  const incomeTaxYearEst = estimateIncomeTaxYear(profitYearEst, settings.incomeTaxMethod, settings);
  const incomeTaxMonthEst = incomeTaxYearEst / 12;

  const cashIn = revenueGrossTotal;
  const cashOut = recurringExpensesGrossTotal + vatPayable + incomeTaxMonthEst;
  const cashLeftEst = cashIn - cashOut;

  const savingsVat = vatPayable;
  const savingsIncomeTax = incomeTaxMonthEst;
  const savingsTotal = savingsVat + savingsIncomeTax;

  const r = (n: number) => Math.round(n * 100) / 100;

  return {
    revenueNetTotal: r(revenueNetTotal),
    revenueVatTotal: r(revenueVatTotal),
    revenueGrossTotal: r(revenueGrossTotal),
    expensesBusinessNetTotal: r(expensesBusinessNetTotal),
    expensesBusinessVatTotal: r(expensesBusinessVatTotal),
    expensesBusinessGrossTotal: r(expensesBusinessGrossTotal),
    recurringExpensesGrossTotal: r(recurringExpensesGrossTotal),
    oneTimeExpensesGrossTotal: r(oneTimeExpensesGrossTotal),
    outputVat: r(outputVat),
    inputVat: r(inputVat),
    vatPayable: r(vatPayable),
    vatRefund: r(vatRefund),
    profitMonth: r(profitMonth),
    profitYearEst: r(profitYearEst),
    incomeTaxYearEst: r(incomeTaxYearEst),
    incomeTaxMonthEst: r(incomeTaxMonthEst),
    cashIn: r(cashIn),
    cashOut: r(cashOut),
    cashLeftEst: r(cashLeftEst),
    savingsVat: r(savingsVat),
    savingsIncomeTax: r(savingsIncomeTax),
    savingsTotal: r(savingsTotal),
    expensesPrivateGrossTotal: r(expensesPrivateGrossTotal),
  };
}
