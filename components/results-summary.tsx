"use client";

import type { CalculationResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ResultsSummaryProps {
  results: CalculationResult;
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-success-foreground">{formatCurrency(results.revenueGrossTotal)}</p>
          <p className="text-xs text-muted-foreground">Net: {formatCurrency(results.revenueNetTotal)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-danger-foreground">{formatCurrency(results.recurringExpensesGrossTotal + results.oneTimeExpensesGrossTotal)}</p>
          <p className="text-xs text-muted-foreground">
            Recurring: {formatCurrency(results.recurringExpensesGrossTotal)}
            {results.oneTimeExpensesGrossTotal > 0 && (
              <> · One-time: {formatCurrency(results.oneTimeExpensesGrossTotal)}</>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Set Aside</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-warning-foreground">
            {formatCurrency(results.savingsTotal)}
          </p>
          <p className="text-xs text-muted-foreground">
            VAT: {formatCurrency(results.savingsVat)} / Tax: {formatCurrency(results.savingsIncomeTax)}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Yours to Keep</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn(
            "text-2xl font-bold tabular-nums",
            results.cashLeftEst >= 0 ? "text-success-foreground" : "text-danger-foreground"
          )}>
            {formatCurrency(results.cashLeftEst)}
          </p>
          <p className="text-xs text-muted-foreground">After all deductions</p>
        </CardContent>
      </Card>
    </div>
  );
}
