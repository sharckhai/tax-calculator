"use client";

import type { MonthData, ExpenseItem } from "@/lib/types";
import { ExpenseSection } from "@/components/expense-section";

interface RecurringExpensesProps {
  monthData: MonthData;
  onChange: (partial: Partial<MonthData>) => void;
}

export function RecurringExpenses({ monthData, onChange }: RecurringExpensesProps) {
  const businessRecurring = monthData.expensesBusiness.filter((e) => e.isRecurring);
  const businessNonRecurring = monthData.expensesBusiness.filter((e) => !e.isRecurring);

  const privateRecurring = monthData.expensesPrivate.filter((e) => e.isRecurring);
  const privateNonRecurring = monthData.expensesPrivate.filter((e) => !e.isRecurring);

  function handleBusinessChange(items: ExpenseItem[]) {
    onChange({ expensesBusiness: [...items, ...businessNonRecurring] });
  }

  function handlePrivateChange(items: ExpenseItem[]) {
    onChange({ expensesPrivate: [...items, ...privateNonRecurring] });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Recurring Expenses</h1>

      <ExpenseSection
        title="Business"
        isRecurring
        expenses={businessRecurring}
        onChange={handleBusinessChange}
      />

      <ExpenseSection
        title="Private"
        isRecurring
        expenses={privateRecurring}
        onChange={handlePrivateChange}
      />
    </div>
  );
}
