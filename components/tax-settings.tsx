"use client";

import type { Settings, IncomeTaxMethod } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaxSettingsProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function TaxSettings({ settings, onChange }: TaxSettingsProps) {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tax Settings</h1>

      <Card className="rounded-none sm:rounded-lg -mx-6 sm:mx-0">
        <CardHeader>
          <CardTitle>VAT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">VAT Rate (%)</label>
            <Input
              type="number"
              value={Math.round(settings.vatRate * 100)}
              onChange={(e) => onChange({ ...settings, vatRate: Number(e.target.value) / 100 })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">VAT Liable</label>
            <Select
              value={settings.isVatLiable ? "yes" : "no"}
              onValueChange={(v) => onChange({ ...settings, isVatLiable: v === "yes" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No (Kleinunternehmer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none sm:rounded-lg -mx-6 sm:mx-0">
        <CardHeader>
          <CardTitle>Income Tax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Income Tax Method</label>
            <Select
              value={settings.incomeTaxMethod}
              onValueChange={(v: IncomeTaxMethod) => onChange({ ...settings, incomeTaxMethod: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat_rate">Flat Rate</SelectItem>
                <SelectItem value="simple_brackets">Progressive Brackets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.incomeTaxMethod === "flat_rate" && (
            <div>
              <label className="text-sm font-medium mb-1 block">Flat Tax Rate (%)</label>
              <Input
                type="number"
                value={Math.round(settings.flatIncomeTaxRate * 100)}
                onChange={(e) => onChange({ ...settings, flatIncomeTaxRate: Number(e.target.value) / 100 })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
