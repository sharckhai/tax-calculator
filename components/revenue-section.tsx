"use client";

import { useState } from "react";
import type { RevenueItem } from "@/lib/types";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { RevenueRow } from "./revenue-row";
import { createRevenueItem } from "@/lib/defaults";
import { ChevronRight, Plus, TrendingUp } from "lucide-react";

interface RevenueSectionProps {
  revenues: RevenueItem[];
  onChange: (revenues: RevenueItem[]) => void;
}

export function RevenueSection({ revenues, onChange }: RevenueSectionProps) {
  const [open, setOpen] = useState(true);

  function handleAdd() {
    if (!open) setOpen(true);
    onChange([...revenues, createRevenueItem()]);
  }

  function handleChange(index: number, updated: RevenueItem) {
    const next = [...revenues];
    next[index] = updated;
    onChange(next);
  }

  function handleRemove(index: number) {
    onChange(revenues.filter((_, i) => i !== index));
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="rounded-none border-x-0 sm:rounded-xl sm:border-x">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center gap-1.5 cursor-pointer">
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CollapsibleTrigger>
          <CardDescription>{revenues.length} item{revenues.length !== 1 ? "s" : ""}</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardAction>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {revenues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">No revenue items yet</p>
                <p className="text-xs">Add your first revenue source to get started</p>
              </div>
            ) : (
              <div className="divide-y">
                {revenues.map((item, i) => (
                  <RevenueRow
                    key={item.id}
                    item={item}
                    onChange={(updated) => handleChange(i, updated)}
                    onRemove={() => handleRemove(i)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
