"use client";

import type { YearlyResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatShortMonthLabel, cn } from "@/lib/utils";

interface YearDashboardProps {
  yearResult: YearlyResult;
}

export function YearDashboard({ yearResult }: YearDashboardProps) {
  if (yearResult.monthCount === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No data for {yearResult.year}. Create months to see the yearly overview.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(yearResult.revenueGrossTotal)}</p>
            <p className="text-xs text-muted-foreground">Net: {formatCurrency(yearResult.revenueNetTotal)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(yearResult.expensesBusinessGrossTotal)}</p>
            <p className="text-xs text-muted-foreground">
              Recurring: {formatCurrency(yearResult.recurringExpensesGrossTotal)} · One-time: {formatCurrency(yearResult.oneTimeExpensesGrossTotal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(yearResult.profitTotal)}</p>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">VAT Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-warning-foreground">{formatCurrency(yearResult.vatPayableTotal)}</p>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">Income Tax Est.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-warning-foreground">{formatCurrency(yearResult.incomeTaxTotal)}</p>
          </CardContent>
        </Card>

        <Card className={cn(
          yearResult.cashLeftTotal >= 0 ? "border-success/30" : "border-danger/30"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className={cn(
              "text-sm font-medium",
              yearResult.cashLeftTotal >= 0 ? "text-success-foreground" : "text-danger-foreground"
            )}>Cash Left</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              yearResult.cashLeftTotal >= 0 ? "text-success-foreground" : "text-danger-foreground"
            )}>{formatCurrency(yearResult.cashLeftTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Cash Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearResult.months.map(({ month, result }) => (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{formatShortMonthLabel(month)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.revenueGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.expensesBusinessGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.profitMonth)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.vatPayable)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.incomeTaxMonthEst)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.cashLeftEst)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.revenueGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.expensesBusinessGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.profitTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.vatPayableTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.incomeTaxTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.cashLeftTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
