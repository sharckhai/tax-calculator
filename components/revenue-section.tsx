"use client";

import type { RevenueItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueRow } from "./revenue-row";
import { createRevenueItem } from "@/lib/defaults";
import { Plus } from "lucide-react";

interface RevenueSectionProps {
  revenues: RevenueItem[];
  onChange: (revenues: RevenueItem[]) => void;
}

export function RevenueSection({ revenues, onChange }: RevenueSectionProps) {
  function handleAdd() {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        {revenues.length === 0 && (
          <p className="text-sm text-muted-foreground mb-2">No revenue items yet.</p>
        )}
        <div className="space-y-1">
          {revenues.map((item, i) => (
            <RevenueRow
              key={item.id}
              item={item}
              onChange={(updated) => handleChange(i, updated)}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="mt-3">
          <Plus className="h-4 w-4 mr-1" />
          Add Revenue
        </Button>
      </CardContent>
    </Card>
  );
}
