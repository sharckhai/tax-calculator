"use client";

import type { RevenueItem, AmountType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueRowProps {
  item: RevenueItem;
  onChange: (updated: RevenueItem) => void;
  onRemove: () => void;
}

export function RevenueRow({ item, onChange, onRemove }: RevenueRowProps) {
  const isHourly = item.hourlyRate > 0 && item.hours > 0;
  const computedAmount = isHourly ? item.hourlyRate * item.hours : item.amount;

  return (
    <div className="flex items-center gap-2 py-2">
      <Input
        placeholder="Label"
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        className="w-32 sm:w-40"
      />
      <Input
        type="number"
        placeholder="€/h"
        value={item.hourlyRate || ""}
        onChange={(e) => onChange({ ...item, hourlyRate: Number(e.target.value) })}
        className="w-20"
      />
      <span className="text-muted-foreground">×</span>
      <Input
        type="number"
        placeholder="Hours"
        value={item.hours || ""}
        onChange={(e) => onChange({ ...item, hours: Number(e.target.value) })}
        className="w-20"
      />
      <span className="text-muted-foreground">=</span>
      {isHourly ? (
        <span className="w-28 text-right text-sm font-medium tabular-nums">
          {formatCurrency(computedAmount)}
        </span>
      ) : (
        <Input
          type="number"
          placeholder="Amount"
          value={item.amount || ""}
          onChange={(e) => onChange({ ...item, amount: Number(e.target.value) })}
          className="w-28"
        />
      )}
      <Select
        value={item.amountType}
        onValueChange={(v: AmountType) => onChange({ ...item, amountType: v })}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="net">Net</SelectItem>
          <SelectItem value="gross">Gross</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
