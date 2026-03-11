"use client";

import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts";
import type { YearlyResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatShortMonthLabel } from "@/lib/utils";

interface YearDashboardProps {
  yearResult: YearlyResult;
}

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--success-foreground)" },
  expenses: { label: "Expenses", color: "var(--danger-foreground)" },
  setAside: { label: "Set Aside", color: "var(--warning-foreground)" },
  cashLeft: { label: "Yours to Keep", color: "var(--chart-1)" },
} satisfies ChartConfig;

function SummaryCard({ title, value, subtitle, valueClassName }: { title: string; value: string; subtitle?: string; valueClassName?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold tabular-nums ${valueClassName ?? ""}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function YearDashboard({ yearResult }: YearDashboardProps) {
  if (yearResult.monthCount === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No data for {yearResult.year}. Create months to see the yearly overview.
      </p>
    );
  }

  const mc = yearResult.monthCount;
  const totalAllCosts = yearResult.expensesBusinessGrossTotal + yearResult.expensesPrivateGrossTotal;

  const chartData = yearResult.months.map(({ month, result }) => ({
    month: formatShortMonthLabel(month),
    revenue: result.revenueGrossTotal,
    expenses: result.expensesBusinessGrossTotal,
    setAside: result.savingsTotal,
    cashLeft: result.cashLeftEst,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(yearResult.revenueGrossTotal)}
          subtitle={`Net: ${formatCurrency(yearResult.revenueNetTotal)}`}
          valueClassName="text-success-foreground"
        />
        <SummaryCard
          title="Total Tax"
          value={formatCurrency(yearResult.incomeTaxTotal)}
          valueClassName="text-warning-foreground"
        />
        <SummaryCard
          title="Total Business Costs"
          value={formatCurrency(yearResult.expensesBusinessGrossTotal)}
          subtitle={`Recurring: ${formatCurrency(yearResult.recurringExpensesGrossTotal)} · One-time: ${formatCurrency(yearResult.oneTimeExpensesGrossTotal)}`}
          valueClassName="text-danger-foreground"
        />
        <SummaryCard
          title="Total Private Costs"
          value={formatCurrency(yearResult.expensesPrivateGrossTotal)}
          valueClassName="text-danger-foreground"
        />
        <SummaryCard
          title="Monthly Avg All Costs"
          value={formatCurrency(totalAllCosts / mc)}
        />
        <SummaryCard
          title="Monthly Avg Private Costs"
          value={formatCurrency(yearResult.expensesPrivateGrossTotal / mc)}
        />
        <SummaryCard
          title="Monthly Avg One-Time Expenses"
          value={formatCurrency(yearResult.oneTimeExpensesGrossTotal / mc)}
        />
      </div>

      {/* Overview chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false}>
                <LabelList dataKey="revenue" position="top" fontSize={11} formatter={(v: number) => formatCurrency(v)} />
              </Line>
              <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false}>
                <LabelList dataKey="expenses" position="bottom" fontSize={11} formatter={(v: number) => formatCurrency(v)} />
              </Line>
              <Line type="monotone" dataKey="setAside" stroke="var(--color-setAside)" strokeWidth={2} dot={false}>
                <LabelList dataKey="setAside" position="top" fontSize={11} formatter={(v: number) => formatCurrency(v)} />
              </Line>
              <Line type="monotone" dataKey="cashLeft" stroke="var(--color-cashLeft)" strokeWidth={2} dot={false}>
                <LabelList dataKey="cashLeft" position="bottom" fontSize={11} formatter={(v: number) => formatCurrency(v)} />
              </Line>
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

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
                  <TableHead className="text-right">Business</TableHead>
                  <TableHead className="text-right">Private</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearResult.months.map(({ month, result }) => (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{formatShortMonthLabel(month)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.revenueGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.expensesBusinessGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.expensesPrivateGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.profitMonth)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.vatPayable)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(result.incomeTaxMonthEst)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.revenueGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.expensesBusinessGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.expensesPrivateGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.profitTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.vatPayableTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatCurrency(yearResult.incomeTaxTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
