"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { MonthData, ArchivedMonth, Settings, RevenueItem, ExpenseItem } from "@/lib/types";
import { calcMonth } from "@/lib/calculator";
import { createEmptyMonth } from "@/lib/defaults";
import {
  loadCurrentMonth,
  saveMonth,
  loadAllMonths,
  loadArchives,
  saveArchive,
  setActiveMonth,
  deleteMonth,
} from "@/lib/storage";
import { Sidebar } from "@/components/sidebar";
import { MonthHeader } from "@/components/month-header";
import { RevenueSection } from "@/components/revenue-section";
import { ExpenseSection } from "@/components/expense-section";
import { ResultsSummary } from "@/components/results-summary";
import { ArchiveViewer } from "@/components/archive-viewer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Archive } from "lucide-react";

export default function Page() {
  const [draftMonths, setDraftMonths] = useState<MonthData[]>([]);
  const [activeMonthKey, setActiveMonthKey] = useState<string>("");
  const [archives, setArchives] = useState<ArchivedMonth[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

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
    setArchives(loadArchives());
  }, []);

  const monthData = draftMonths.find((m) => m.month === activeMonthKey) ?? null;

  // Debounced auto-save
  useEffect(() => {
    if (!monthData) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMonth({ ...monthData, lastModified: new Date().toISOString() });
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [monthData]);

  const results = useMemo(() => {
    if (!monthData) return null;
    return calcMonth(monthData);
  }, [monthData]);

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
      setSelectedArchive(null);
      return;
    }
    const newMonth = createEmptyMonth(month);
    // Carry forward settings from the current month if available
    if (monthData) {
      newMonth.settings = { ...monthData.settings };
    }
    saveMonth(newMonth);
    setActiveMonth(month);
    setDraftMonths(loadAllMonths());
    setActiveMonthKey(month);
    setSelectedArchive(null);
  }

  function handleSelectMonth(month: string) {
    setActiveMonthKey(month);
    setActiveMonth(month);
    setSidebarOpen(false);
  }

  function handleArchive() {
    if (!monthData || !results) return;
    const archived: ArchivedMonth = {
      ...monthData,
      results,
      archivedAt: new Date().toISOString(),
    };
    saveArchive(archived);
    deleteMonth(monthData.month);

    // Switch to another draft or create a new one
    const remaining = loadAllMonths();
    if (remaining.length > 0) {
      setActiveMonthKey(remaining[0].month);
      setActiveMonth(remaining[0].month);
    } else {
      const fresh = createEmptyMonth();
      saveMonth(fresh);
      setActiveMonth(fresh.month);
      setActiveMonthKey(fresh.month);
    }
    setDraftMonths(loadAllMonths());
    setArchives(loadArchives());
  }

  // Loading state
  if (!monthData || !results) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const recurring = monthData.expensesBusiness.filter((e) => e.isRecurring);
  const oneTime = monthData.expensesBusiness.filter((e) => !e.isRecurring);

  function handleRecurringChange(items: ExpenseItem[]) {
    handleExpensesChange([...items, ...oneTime]);
  }

  function handleOneTimeChange(items: ExpenseItem[]) {
    handleExpensesChange([...recurring, ...items]);
  }

  const selectedArchiveData = archives.find((a) => a.month === selectedArchive);

  const sidebarContent = (
    <Sidebar
      draftMonths={draftMonths}
      activeMonth={activeMonthKey}
      archives={archives}
      selectedArchive={selectedArchive}
      settings={monthData.settings}
      onSelectMonth={handleSelectMonth}
      onSelectArchive={(month) => {
        setSelectedArchive(month);
        setSidebarOpen(false);
      }}
      onCreateMonth={handleCreateMonth}
      onSettingsChange={handleSettingsChange}
    />
  );

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
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {selectedArchiveData ? (
            <ArchiveViewer
              archive={selectedArchiveData}
              onBack={() => setSelectedArchive(null)}
            />
          ) : (
            <>
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

              <Button onClick={handleArchive} className="w-full" variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Finish Month & Archive
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
