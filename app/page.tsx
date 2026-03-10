"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { MonthData, Settings, RevenueItem, ExpenseItem } from "@/lib/types";
import { calcMonth } from "@/lib/calculator";
import { calcYear, getAvailableYears } from "@/lib/yearly";
import { YearDashboard } from "@/components/year-dashboard";
import { createEmptyMonth } from "@/lib/defaults";
import {
  loadCurrentMonth,
  saveMonth,
  loadAllMonths,
  setActiveMonth,
  deleteMonth,
  renameMonth,
} from "@/lib/storage";
import { Sidebar } from "@/components/sidebar";
import { TaxSettings } from "@/components/tax-settings";
import { RecurringExpenses } from "@/components/recurring-expenses";
import { MonthHeader } from "@/components/month-header";
import { RevenueSection } from "@/components/revenue-section";
import { ExpenseSection } from "@/components/expense-section";
import { ResultsSummary } from "@/components/results-summary";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Save } from "lucide-react";

export default function Page() {
  const [draftMonths, setDraftMonths] = useState<MonthData[]>([]);
  const [activeMonthKey, setActiveMonthKey] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<"month" | "dashboard" | "settings" | "recurring">("month");
  const [dashboardYear, setDashboardYear] = useState(String(new Date().getFullYear()));

  // Load from localStorage on mount
  useEffect(() => {
    // Try loading existing data (handles legacy migration too)
    const current = loadCurrentMonth();
    if (current) {
      setActiveMonthKey(current.month);
    } else {
      // First visit ever — create a default month
      const fresh = createEmptyMonth();
      saveMonth(fresh);
      setActiveMonth(fresh.month);
      setActiveMonthKey(fresh.month);
    }
    setDraftMonths(loadAllMonths());
  }, []);

  const monthData = draftMonths.find((m) => m.month === activeMonthKey) ?? null;

  const results = useMemo(() => {
    if (!monthData) return null;
    return calcMonth(monthData);
  }, [monthData]);

  const availableYears = useMemo(() => getAvailableYears(draftMonths), [draftMonths]);

  const yearResult = useMemo(
    () => activeView === "dashboard" ? calcYear(draftMonths, dashboardYear) : null,
    [activeView, draftMonths, dashboardYear]
  );

  const updateMonthData = useCallback(
    (partial: Partial<MonthData>) => {
      setDraftMonths((prev) =>
        prev.map((m) => (m.month === activeMonthKey ? { ...m, ...partial } : m))
      );
    },
    [activeMonthKey]
  );

  function handleSettingsChange(settings: Settings) {
    updateMonthData({ settings });
  }

  function handleRevenuesChange(revenues: RevenueItem[]) {
    updateMonthData({ revenues });
  }

  function handleExpensesChange(expenses: ExpenseItem[]) {
    updateMonthData({ expensesBusiness: expenses });
  }

  function handleCreateMonth(month: string) {
    // Don't create if it already exists as a draft
    if (draftMonths.some((m) => m.month === month)) {
      setActiveMonthKey(month);
      setActiveMonth(month);
      return;
    }
    const newMonth = createEmptyMonth(month);
    // Carry forward settings from the current month if available
    if (monthData) {
      newMonth.settings = { ...monthData.settings };
      newMonth.expensesBusiness = monthData.expensesBusiness
        .filter((e) => e.isRecurring)
        .map((e) => ({ ...e, id: crypto.randomUUID() }));
      newMonth.expensesPrivate = monthData.expensesPrivate
        .filter((e) => e.isRecurring)
        .map((e) => ({ ...e, id: crypto.randomUUID() }));
    }
    saveMonth(newMonth);
    setActiveMonth(month);
    setDraftMonths(loadAllMonths());
    setActiveMonthKey(month);
  }

  function handleDeleteMonth(month: string) {
    deleteMonth(month);
    const remaining = loadAllMonths();
    if (month === activeMonthKey) {
      if (remaining.length > 0) {
        setActiveMonthKey(remaining[0].month);
        setActiveMonth(remaining[0].month);
      } else {
        const fresh = createEmptyMonth();
        saveMonth(fresh);
        setActiveMonth(fresh.month);
        setActiveMonthKey(fresh.month);
      }
    }
    setDraftMonths(loadAllMonths());
  }

  function handleRenameMonth(oldMonth: string, newMonth: string) {
    renameMonth(oldMonth, newMonth);
    if (activeMonthKey === oldMonth) {
      setActiveMonthKey(newMonth);
    }
    setDraftMonths(loadAllMonths());
  }

  function handleSelectMonth(month: string) {
    setActiveMonthKey(month);
    setActiveMonth(month);
    setActiveView("month");
    setSidebarOpen(false);
  }

  function handleSave() {
    if (!monthData) return;
    saveMonth({ ...monthData, lastModified: new Date().toISOString() });
  }

  const recurring = monthData?.expensesBusiness.filter((e) => e.isRecurring) ?? [];
  const oneTime = monthData?.expensesBusiness.filter((e) => !e.isRecurring) ?? [];

  function handleRecurringChange(items: ExpenseItem[]) {
    handleExpensesChange([...items, ...oneTime]);
  }

  function handleOneTimeChange(items: ExpenseItem[]) {
    handleExpensesChange([...recurring, ...items]);
  }

  const settings = monthData?.settings ?? draftMonths[0]?.settings;

  const sidebarContent = settings ? (
    <Sidebar
      draftMonths={draftMonths}
      activeMonth={activeMonthKey}
      onSelectMonth={handleSelectMonth}
      onCreateMonth={handleCreateMonth}
      onDeleteMonth={handleDeleteMonth}
      onRenameMonth={handleRenameMonth}
      activeView={activeView}
      onViewChange={setActiveView}
    />
  ) : null;

  function renderMainContent() {
    if (activeView === "settings" && settings) {
      return <TaxSettings settings={settings} onChange={handleSettingsChange} />;
    }

    if (activeView === "recurring" && monthData) {
      return <RecurringExpenses monthData={monthData} onChange={updateMonthData} />;
    }

    if (activeView === "dashboard" && yearResult) {
      return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Overview</h1>
            {availableYears.length > 0 && (
              <Select value={dashboardYear} onValueChange={setDashboardYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <YearDashboard yearResult={yearResult} />
        </div>
      );
    }

    if (!monthData || !results) {
      return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <MonthHeader month={monthData.month} />

        <RevenueSection
          revenues={monthData.revenues}
          onChange={handleRevenuesChange}
        />

        <ExpenseSection
          title="Recurring Expenses"
          isRecurring
          expenses={recurring}
          onChange={handleRecurringChange}
        />

        <ExpenseSection
          title="One-Time Expenses"
          isRecurring={false}
          expenses={oneTime}
          onChange={handleOneTimeChange}
        />

        <ResultsSummary results={results} />

        <Button onClick={handleSave} className="w-full" variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[280px] border-r flex-col bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {renderMainContent()}
      </main>
    </div>
  );
}
