"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import type { MonthData, YearlyResult } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, formatShortMonthLabel } from "@/lib/utils";
import { calcHoursMetrics, calcExpenseInsights, type ExpenseInsights } from "@/lib/dashboard-metrics";
import { ChevronRight } from "lucide-react";

interface YearDashboardProps {
  yearResult: YearlyResult;
  monthsData: MonthData[];
  showYear?: boolean;
}

const lineChartConfig = {
  revenue: { label: "Revenue", color: "var(--success-foreground)" },
  expenses: { label: "Expenses", color: "var(--danger-foreground)" },
  cashLeft: { label: "Yours to Keep", color: "var(--chart-1)" },
} satisfies ChartConfig;

const expenseBarConfig = {
  recurring: { label: "Recurring", color: "var(--warning-foreground)" },
  oneTime: { label: "One-Time", color: "var(--chart-3)" },
} satisfies ChartConfig;

const hoursChartConfig = {
  hours: { label: "Hours", color: "var(--chart-2)" },
} satisfies ChartConfig;

const PIE_COLORS = ["var(--warning-foreground)", "var(--chart-3)"];

function ExpenseInsightsSection({ title, insights }: { title: string; insights: ExpenseInsights }) {
  const pieData = [
    { name: "Recurring", value: insights.recurringTotal },
    { name: "One-Time", value: insights.oneTimeTotal },
  ];

  return (
    <CollapsibleSection title={title} defaultOpen>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.topExpenses.map((e) => (
                <TableRow key={e.label}>
                  <TableCell className="font-medium">{e.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(e.totalAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.occurrences}</TableCell>
                  <TableCell>
                    <Badge variant={e.isRecurring ? "default" : "secondary"}>
                      {e.isRecurring ? "Recurring" : "One-time"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {(insights.recurringTotal > 0 || insights.oneTimeTotal > 0) && (
          <div className="flex flex-col items-center justify-center">
            <ChartContainer config={expenseBarConfig} className="h-[250px] w-full max-w-[300px]">
              <PieChart accessibilityLayer>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="text-center text-sm text-muted-foreground mt-2">
              <span>Recurring: {formatCurrency(insights.recurringTotal)}</span>
              <span className="mx-2">·</span>
              <span>One-Time: {formatCurrency(insights.oneTimeTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">Monthly Expense Breakdown</p>
        <ChartContainer config={expenseBarConfig} className="h-[250px] w-full">
          <BarChart data={insights.monthlyExpenses} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="recurring" stackId="expenses" fill="var(--color-recurring)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="oneTime" stackId="expenses" fill="var(--color-oneTime)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </CollapsibleSection>
  );
}

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

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
              {title}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function YearDashboard({ yearResult, monthsData, showYear = false }: YearDashboardProps) {
  const hoursMetrics = useMemo(
    () => calcHoursMetrics(monthsData, yearResult.revenueNetTotal),
    [monthsData, yearResult.revenueNetTotal],
  );

  const businessInsights = useMemo(
    () => calcExpenseInsights(monthsData, "expensesBusiness"),
    [monthsData],
  );

  const privateInsights = useMemo(
    () => calcExpenseInsights(monthsData, "expensesPrivate"),
    [monthsData],
  );

  if (yearResult.monthCount === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No data{yearResult.year !== "all" ? ` for ${yearResult.year}` : ""}. Create months to see the overview.
      </p>
    );
  }

  const mc = yearResult.monthCount;
  const totalAllCosts = yearResult.expensesBusinessGrossTotal + yearResult.expensesPrivateGrossTotal;

  const hoursMap = new Map(
    monthsData.map((md) => [md.month, md.revenues.reduce((sum, r) => sum + r.hours, 0)]),
  );

  const lineChartData = yearResult.months.map(({ month, result }) => ({
    month: formatShortMonthLabel(month, showYear),
    revenue: result.revenueGrossTotal,
    revenueNet: result.revenueNetTotal,
    expenses: result.expensesBusinessGrossTotal,
    cashLeft: result.cashLeftEst,
    hours: hoursMap.get(month) ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(yearResult.revenueGrossTotal)}
          valueClassName="text-success-foreground"
        />
        <SummaryCard
          title="Total Tax"
          value={formatCurrency(yearResult.incomeTaxTotal + yearResult.vatPayableTotal)}
          valueClassName="text-orange-700"
        />
        <SummaryCard
          title="Total Business Costs"
          value={formatCurrency(yearResult.expensesBusinessGrossTotal)}
          valueClassName="text-danger-foreground"
        />
        <SummaryCard
          title="Total Private Costs"
          value={formatCurrency(yearResult.expensesPrivateGrossTotal)}
          valueClassName="text-danger-foreground"
        />
      </div>

      {/* Hours & Rate cards */}
      {hoursMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Hours Worked"
            value={`${hoursMetrics.totalHours.toFixed(1)}h`}
          />
          <SummaryCard
            title="Effective Hourly Rate"
            value={formatCurrency(hoursMetrics.effectiveHourlyRate)}
            valueClassName="text-success-foreground"
          />
          <SummaryCard
            title="Avg Monthly Revenue"
            value={formatCurrency(yearResult.revenueGrossTotal / mc)}
          />
        </div>
      )}

      {/* Monthly overview line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <LineChart data={lineChartData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <p className="text-sm font-medium mb-1.5">{label}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-success-foreground" />
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="ml-auto font-mono font-medium tabular-nums">{formatCurrency(data.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-orange-500" />
                        <span className="text-muted-foreground">Hours</span>
                        <span className="ml-auto font-mono font-medium tabular-nums">{data.hours}h</span>
                      </div>
                      {data.hours > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-success-foreground" />
                          <span className="text-muted-foreground">Avg Rate</span>
                          <span className="ml-auto font-mono font-medium tabular-nums">{formatCurrency(data.revenueNet / data.hours)}/h</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cashLeft" stroke="var(--color-cashLeft)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly averages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Business Expenses */}
      {businessInsights.topExpenses.length > 0 && (
        <ExpenseInsightsSection title="Business Expenses" insights={businessInsights} />
      )}

      {/* Private Expenses */}
      {privateInsights.topExpenses.length > 0 && (
        <ExpenseInsightsSection title="Private Expenses" insights={privateInsights} />
      )}

      {/* Hours trend bar chart */}
      {hoursMetrics && (
        <CollapsibleSection title="Hours Trend">
          <ChartContainer config={hoursChartConfig} className="h-[250px] w-full">
            <BarChart data={hoursMetrics.monthlyHours} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => `${value}h`} />}
              />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="hours" position="top" fontSize={11} formatter={(v: number) => `${v}h`} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CollapsibleSection>
      )}

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
                    <TableCell className="font-medium">{formatShortMonthLabel(month, showYear)}</TableCell>
                    <TableCell className="text-right tabular-nums text-success-foreground">{formatCurrency(result.revenueGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums text-danger-foreground">{formatCurrency(result.expensesBusinessGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums text-danger-foreground">{formatCurrency(result.expensesPrivateGrossTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums text-success-foreground">{formatCurrency(result.profitMonth)}</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-700">{formatCurrency(result.vatPayable)}</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-700">{formatCurrency(result.incomeTaxMonthEst)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-success-foreground">{formatCurrency(yearResult.revenueGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-danger-foreground">{formatCurrency(yearResult.expensesBusinessGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-danger-foreground">{formatCurrency(yearResult.expensesPrivateGrossTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-success-foreground">{formatCurrency(yearResult.profitTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-orange-700">{formatCurrency(yearResult.vatPayableTotal)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-orange-700">{formatCurrency(yearResult.incomeTaxTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
