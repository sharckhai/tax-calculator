"use client";

import { useState } from "react";
import type { ExpenseItem } from "@/lib/types";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ExpenseRow } from "./expense-row";
import { createExpenseItem } from "@/lib/defaults";
import { ChevronRight, Plus, Receipt } from "lucide-react";

interface ExpenseSectionProps {
  title: string;
  isRecurring: boolean;
  expenses: ExpenseItem[];
  onChange: (expenses: ExpenseItem[]) => void;
}

export function ExpenseSection({ title, isRecurring, expenses, onChange }: ExpenseSectionProps) {
  const [open, setOpen] = useState(true);

  function handleAdd() {
    if (!open) setOpen(true);
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center gap-1.5 cursor-pointer">
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
            <CardTitle className="text-lg">{title}</CardTitle>
          </CollapsibleTrigger>
          <CardDescription>{expenses.length} item{expenses.length !== 1 ? "s" : ""}</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardAction>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">No expenses yet</p>
                <p className="text-xs">Add your first expense to get started</p>
              </div>
            ) : (
              <div className="divide-y">
                {expenses.map((item, i) => (
                  <ExpenseRow
                    key={item.id}
                    item={item}
                    onChange={(updated) => handleChange(i, updated)}
                    onRemove={() => handleRemove(i)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
