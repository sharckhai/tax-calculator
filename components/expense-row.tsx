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
    <div className="flex items-center gap-2 py-2">
      <Input
        placeholder="Label"
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        className="w-32 sm:w-48"
      />
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
      <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
