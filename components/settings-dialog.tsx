"use client";

import type { Settings, IncomeTaxMethod } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";

interface SettingsDialogProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsDialog({ settings, onChange }: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
