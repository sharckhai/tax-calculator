"use client";

import type { ArchivedMonth } from "@/lib/types";
import { RevenueSection } from "./revenue-section";
import { ExpenseSection } from "./expense-section";
import { ResultsSummary } from "./results-summary";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface ArchiveViewerProps {
  archive: ArchivedMonth;
  onBack: () => void;
}

export function ArchiveViewer({ archive, onBack }: ArchiveViewerProps) {
  const recurring = archive.expensesBusiness.filter((e) => e.isRecurring);
  const oneTime = archive.expensesBusiness.filter((e) => !e.isRecurring);
  const noop = () => {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{formatMonthLabel(archive.month)}</h1>
        <span className="text-sm text-muted-foreground">(Archived)</span>
      </div>

      <div className="pointer-events-none opacity-80">
        <RevenueSection revenues={archive.revenues} onChange={noop} />
      </div>

      {recurring.length > 0 && (
        <div className="pointer-events-none opacity-80">
          <ExpenseSection title="Recurring Expenses" isRecurring expenses={recurring} onChange={noop} />
        </div>
      )}

      {oneTime.length > 0 && (
        <div className="pointer-events-none opacity-80">
          <ExpenseSection title="One-Time Expenses" isRecurring={false} expenses={oneTime} onChange={noop} />
        </div>
      )}

      <ResultsSummary results={archive.results} />
    </div>
  );
}
