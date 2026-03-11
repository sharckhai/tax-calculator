"use client";

import { useState } from "react";
import type { MonthData } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMonthLabel } from "@/lib/utils";
import { Plus, MoreHorizontal, Pencil, Trash2, BarChart3, Settings, Repeat } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getYearOptions() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current - 2; y <= current + 2; y++) {
    years.push(y);
  }
  return years;
}

function MonthYearPicker({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: string;
  year: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={onYearChange}>
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {getYearOptions().map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SidebarProps {
  draftMonths: MonthData[];
  activeMonth: string;
  onSelectMonth: (month: string) => void;
  onCreateMonth: (month: string) => void;
  onDeleteMonth: (month: string) => void;
  onRenameMonth: (oldMonth: string, newMonth: string) => void;
  activeView: "month" | "dashboard" | "settings" | "recurring";
  onViewChange: (view: "month" | "dashboard" | "settings" | "recurring") => void;
}

export function Sidebar({
  draftMonths,
  activeMonth,
  onSelectMonth,
  onCreateMonth,
  onDeleteMonth,
  onRenameMonth,
  activeView,
  onViewChange,
}: SidebarProps) {
  const now = new Date();
  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [newMonth, setNewMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [newYear, setNewYear] = useState(String(now.getFullYear()));

  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameMonth, setRenameMonth] = useState("");
  const [renameYear, setRenameYear] = useState("");

  function handleCreate() {
    const monthStr = `${newYear}-${newMonth}`;
    onCreateMonth(monthStr);
    setNewMonthOpen(false);
  }

  function startRename(month: string) {
    const [y, m] = month.split("-");
    setRenameTarget(month);
    setRenameMonth(m);
    setRenameYear(y);
  }

  function handleRename() {
    if (!renameTarget) return;
    const newMonthStr = `${renameYear}-${renameMonth}`;
    if (newMonthStr !== renameTarget) {
      onRenameMonth(renameTarget, newMonthStr);
    }
    setRenameTarget(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="font-semibold text-lg">Income Calculator</h2>
      </div>
      <Separator />
      <div className="px-4 pt-3 space-y-2">
        <Button
          variant={activeView === "dashboard" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange(activeView === "dashboard" ? "month" : "dashboard")}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeView === "settings" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange(activeView === "settings" ? "month" : "settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Tax Settings
        </Button>
        <Button
          variant={activeView === "recurring" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange(activeView === "recurring" ? "month" : "recurring")}
        >
          <Repeat className="h-4 w-4 mr-2" />
          Recurring Expenses
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4 pt-3">
        <div className="flex items-center justify-between mt-3 mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monate</h3>
          <Popover open={newMonthOpen} onOpenChange={setNewMonthOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <p className="text-sm font-medium">New month</p>
                <MonthYearPicker
                  month={newMonth}
                  year={newYear}
                  onMonthChange={setNewMonth}
                  onYearChange={setNewYear}
                />
                <Button size="sm" className="w-full" onClick={handleCreate}>
                  Create
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1 pb-4">
          {[...draftMonths].sort((a, b) => b.month.localeCompare(a.month)).map((m, i, sorted) => {
            const year = m.month.split("-")[0];
            const prevYear = i > 0 ? sorted[i - 1].month.split("-")[0] : null;
            const showYear = year !== prevYear;
            return (
            <div key={m.month}>
              {showYear && (
                <p className={`text-sm font-semibold text-muted-foreground tracking-wide ${i > 0 ? "mt-4" : ""} mb-1`}>
                  {year}
                </p>
              )}
            <div className="group relative flex items-center">
              {renameTarget === m.month ? (
                <Popover open onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start">
                      {formatMonthLabel(m.month)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Rename month</p>
                      <MonthYearPicker
                        month={renameMonth}
                        year={renameYear}
                        onMonthChange={setRenameMonth}
                        onYearChange={setRenameYear}
                      />
                      <Button size="sm" className="w-full" onClick={handleRename}>
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  <Button
                    variant={activeView === "month" && activeMonth === m.month ? "secondary" : "ghost"}
                    className="w-full justify-start pr-8"
                    onClick={() => onSelectMonth(m.month)}
                  >
                    {formatMonthLabel(m.month)}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startRename(m.month)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeleteMonth(m.month)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
