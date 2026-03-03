"use client";

import type { ExpenseItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpenseRow } from "./expense-row";
import { createExpenseItem } from "@/lib/defaults";
import { Plus } from "lucide-react";

interface ExpenseSectionProps {
  title: string;
  isRecurring: boolean;
  expenses: ExpenseItem[];
  onChange: (expenses: ExpenseItem[]) => void;
}

export function ExpenseSection({ title, isRecurring, expenses, onChange }: ExpenseSectionProps) {
  function handleAdd() {
    onChange([...expenses, createExpenseItem(isRecurring)]);
  }

  function handleChange(index: number, updated: ExpenseItem) {
    const next = [...expenses];
    next[index] = updated;
    onChange(next);
  }

  function handleRemove(index: number) {
    onChange(expenses.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 && (
          <p className="text-sm text-muted-foreground mb-2">No expenses yet.</p>
        )}
        <div className="space-y-1">
          {expenses.map((item, i) => (
            <ExpenseRow
              key={item.id}
              item={item}
              onChange={(updated) => handleChange(i, updated)}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="mt-3">
          <Plus className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
      </CardContent>
    </Card>
  );
}
