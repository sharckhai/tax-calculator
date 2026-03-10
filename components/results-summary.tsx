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
          <CardTitle className="text-sm font-medium text-muted-foreground">You Receive</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(results.revenueGrossTotal)}</p>
          <p className="text-xs text-muted-foreground">Net: {formatCurrency(results.revenueNetTotal)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Business Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(results.recurringExpensesGrossTotal)}</p>
          <p className="text-xs text-muted-foreground">
            Recurring (monthly)
            {results.oneTimeExpensesGrossTotal > 0 && (
              <> · One-time: {formatCurrency(results.oneTimeExpensesGrossTotal)}</>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-x-0 border-warning/30 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-warning-foreground">Set Aside</CardTitle>
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

      <Card className={cn(
        "rounded-none border-x-0 sm:rounded-xl sm:border-x",
        results.cashLeftEst >= 0 ? "border-success/30" : "border-danger/30"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn(
            "text-sm font-medium",
            results.cashLeftEst >= 0
              ? "text-success-foreground"
              : "text-danger-foreground"
          )}>
            Yours to Keep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn(
            "text-2xl font-bold tabular-nums",
            results.cashLeftEst >= 0
              ? "text-success-foreground"
              : "text-danger-foreground"
          )}>
            {formatCurrency(results.cashLeftEst)}
          </p>
          <p className="text-xs text-muted-foreground">After all deductions</p>
        </CardContent>
      </Card>
    </div>
  );
}
