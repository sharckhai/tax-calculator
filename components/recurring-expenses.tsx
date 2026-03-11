"use client";

import type { MonthData, ExpenseItem } from "@/lib/types";
import { ExpenseSection } from "@/components/expense-section";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface RecurringExpensesProps {
  monthData: MonthData;
  onChange: (partial: Partial<MonthData>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function RecurringExpenses({ monthData, onChange, onSave, saving }: RecurringExpensesProps) {
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

      <Button onClick={onSave} className="w-full" variant="outline" disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
