"use client";

import { useState } from "react";
import type { ArchivedMonth, MonthData, Settings } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SettingsDialog } from "./settings-dialog";
import { formatMonthLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface SidebarProps {
  draftMonths: MonthData[];
  activeMonth: string;
  archives: ArchivedMonth[];
  selectedArchive: string | null;
  settings: Settings;
  onSelectMonth: (month: string) => void;
  onSelectArchive: (month: string | null) => void;
  onCreateMonth: (month: string) => void;
  onSettingsChange: (settings: Settings) => void;
}

export function Sidebar({
  draftMonths,
  activeMonth,
  archives,
  selectedArchive,
  settings,
  onSelectMonth,
  onSelectArchive,
  onCreateMonth,
  onSettingsChange,
}: SidebarProps) {
  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState("");

  function handleCreate() {
    if (!newMonthValue) return;
    onCreateMonth(newMonthValue);
    setNewMonthValue("");
    setNewMonthOpen(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Income Calculator</h2>
        <Popover open={newMonthOpen} onOpenChange={setNewMonthOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">New month</p>
              <input
                type="month"
                value={newMonthValue}
                onChange={(e) => setNewMonthValue(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
              <Button size="sm" className="w-full" onClick={handleCreate} disabled={!newMonthValue}>
                Create
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Separator />
      {draftMonths.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Drafts
          </p>
        </div>
      )}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 pb-4">
          {draftMonths.map((m) => (
            <Button
              key={m.month}
              variant={selectedArchive === null && activeMonth === m.month ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onSelectArchive(null);
                onSelectMonth(m.month);
              }}
            >
              {formatMonthLabel(m.month)}
            </Button>
          ))}
        </div>
      </ScrollArea>
      {archives.length > 0 && (
        <>
          <Separator />
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Archived
            </p>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-1 pb-4">
              {archives.map((a) => (
                <Button
                  key={a.month}
                  variant={selectedArchive === a.month ? "secondary" : "ghost"}
                  className={cn("w-full justify-start")}
                  onClick={() => onSelectArchive(a.month)}
                >
                  {formatMonthLabel(a.month)}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
      <div className="mt-auto">
        <Separator />
        <div className="p-4">
          <SettingsDialog settings={settings} onChange={onSettingsChange} />
        </div>
      </div>
    </div>
  );
}
