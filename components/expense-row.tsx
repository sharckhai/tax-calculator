"use client";

import type { ExpenseItem, AmountType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ExpenseRowProps {
  item: ExpenseItem;
  onChange: (updated: ExpenseItem) => void;
  onRemove: () => void;
}

export function ExpenseRow({ item, onChange, onRemove }: ExpenseRowProps) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      {/* Row 1 on mobile: Label + Delete */}
      <div className="flex items-center gap-2 sm:contents">
        <Input
          placeholder="Label"
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          className="flex-1 sm:w-48 sm:flex-initial"
        />
        <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0 sm:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>
      {/* Row 2 on mobile: Amount + Type + Badge */}
      <div className="flex items-center gap-2 sm:contents">
        <Input
          type="number"
          placeholder="Amount"
          value={item.amount || ""}
          onChange={(e) => onChange({ ...item, amount: Number(e.target.value) })}
          className="w-28"
        />
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
        {item.isRecurring && (
          <Badge variant="secondary" className="shrink-0">Recurring</Badge>
        )}
      </div>
      {/* Desktop delete button */}
      <Button variant="ghost" size="icon" onClick={onRemove} className="hidden shrink-0 sm:inline-flex">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
