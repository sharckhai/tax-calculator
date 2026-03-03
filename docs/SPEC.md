# Freelancer Tax & VAT Calculator — Next.js Spec

## 1. Overview

Single-page Next.js app for freelancers (German tax system) to track monthly income, expenses, and estimate taxes. No auth, no multi-page routing. Data persisted in localStorage.

## 2. Data Model

```typescript
// lib/types.ts

type AmountType = "gross" | "net";
type IncomeTaxMethod = "flat_rate" | "simple_brackets";

interface Settings {
  vatRate: number;              // default 0.19 (19%)
  isVatLiable: boolean;         // default true
  incomeTaxMethod: IncomeTaxMethod;
  flatIncomeTaxRate: number;    // default 0.30 (30%)
  bracketRates: [number, number][]; // German 2024 progressive brackets
}

interface RevenueItem {
  id: string;
  label: string;
  hourlyRate: number;           // if > 0 with hours > 0, amount = hourlyRate * hours
  hours: number;
  amount: number;               // auto-computed or manual
  amountType: AmountType;
  vatRate?: number;             // per-item override
}

interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
  amountType: AmountType;
  vatRate?: number;
  isRecurring: boolean;
}

interface MonthData {
  month: string;                // "YYYY-MM"
  settings: Settings;
  revenues: RevenueItem[];
  expensesBusiness: ExpenseItem[];
  lastModified: string;
}

interface CalculationResult {
  revenueNetTotal: number;
  revenueVatTotal: number;
  revenueGrossTotal: number;
  expensesBusinessNetTotal: number;
  expensesBusinessVatTotal: number;
  expensesBusinessGrossTotal: number;
  outputVat: number;
  inputVat: number;
  vatPayable: number;
  vatRefund: number;
  profitMonth: number;
  profitYearEst: number;
  incomeTaxYearEst: number;
  incomeTaxMonthEst: number;
  cashIn: number;
  cashOut: number;
  cashLeftEst: number;
  savingsVat: number;
  savingsIncomeTax: number;
  savingsTotal: number;
}

interface ArchivedMonth extends MonthData {
  results: CalculationResult;
  archivedAt: string;
}
```

**Differences from Python app:**
- `daily_rate`/`days` → `hourlyRate`/`hours`
- Private expenses dropped (not in user requirements)
- camelCase naming throughout
- UUID `id` on all items for React keys

## 3. Calculation Engine

Direct port of `src/income_calculator/calculator.py` to TypeScript.

### VAT Split

```
From gross: net = gross / (1 + vatRate), vat = gross - net
From net:   vat = net * vatRate, gross = net + vat
```

### Revenue/Expense Processing

For each line item:
1. Use item's `vatRate` if set, otherwise fall back to `settings.vatRate`
2. Use item's `amountType` directly (`"gross"` or `"net"`)
3. Split into (net, vat, gross) via VAT split
4. VAT is only tracked if `settings.isVatLiable` is true

### VAT Settlement

```
outputVat  = sum of VAT on revenues (if isVatLiable)
inputVat   = sum of VAT on business expenses (if isVatLiable)
vatPayable = max(0, outputVat - inputVat)
vatRefund  = max(0, inputVat - outputVat)
```

### Profit & Income Tax

```
profitMonth   = revenueNetTotal - expensesBusinessNetTotal
profitYearEst = profitMonth * 12
```

**Flat rate:** `incomeTaxYearEst = profitYearEst * flatIncomeTaxRate`

**Progressive brackets (German 2024 defaults):**

| From     | To        | Rate |
|----------|-----------|------|
| €0       | €11,604   | 0%   |
| €11,604  | €17,005   | 14%  |
| €17,005  | €66,760   | 24%  |
| €66,760  | €277,825  | 42%  |
| €277,825 | ∞         | 45%  |

Bracket calculation: iterate brackets, tax each slice at its marginal rate (same logic as Python `estimate_income_tax_year`). If profit ≤ 0, income tax = 0.

```
incomeTaxMonthEst = incomeTaxYearEst / 12
```

### Revenue Amount

Two modes per revenue line:
- **Hourly:** if `hourlyRate > 0 && hours > 0`, amount = hourlyRate × hours (auto-computed, read-only)
- **Direct:** user enters `amount` directly (for flat-fee projects). hourlyRate and hours are 0/empty.

### Cash Flow

```
cashIn         = revenueGrossTotal
cashOut        = expensesBusinessGrossTotal + vatPayable + incomeTaxMonthEst
cashLeftEst    = cashIn - cashOut
savingsVat     = vatPayable
savingsIncomeTax = incomeTaxMonthEst
savingsTotal   = savingsVat + savingsIncomeTax
```

## 4. UI Layout

```
┌──────────────┬─────────────────────────────────────┐
│   SIDEBAR    │         MAIN CONTENT                │
│   (280px)    │                                     │
│              │  ┌─────────────────────────────────┐ │
│  Current     │  │  Revenue Inputs                 │ │
│  month       │  │  [rate] × [hours] = [amount]    │ │
│              │  │  [+ Add revenue]                │ │
│  ──────────  │  └─────────────────────────────────┘ │
│              │                                     │
│  Previous    │  ┌─────────────────────────────────┐ │
│  months      │  │  Recurring Expenses             │ │
│  · 2026-02   │  │  [label] [amount] [gross/net]   │ │
│  · 2026-01   │  └─────────────────────────────────┘ │
│  · ...       │                                     │
│              │  ┌─────────────────────────────────┐ │
│  ──────────  │  │  One-Time Expenses              │ │
│  ⚙ Settings  │  │  [label] [amount] [gross/net]   │ │
│              │  └─────────────────────────────────┘ │
│              │                                     │
│              │  ┌───────────┬─────────────────────┐ │
│              │  │ You       │ Business            │ │
│              │  │ Receive   │ Expenses            │ │
│              │  ├───────────┼─────────────────────┤ │
│              │  │ Set Aside │ Yours to            │ │
│              │  │ (VAT+Tax) │ Keep                │ │
│              │  └───────────┴─────────────────────┘ │
│              │                                     │
│              │  [Finish Month & Archive]           │
└──────────────┴─────────────────────────────────────┘
```

Mobile (< 768px): sidebar becomes a Sheet (slide-out drawer).

## 5. Component Structure

```
app/
  layout.tsx
  page.tsx
  globals.css

components/
  ui/                        ← shadcn generated
  sidebar.tsx                ← month list + settings trigger
  month-header.tsx           ← current month label
  revenue-section.tsx        ← revenue card list + add button
  revenue-row.tsx            ← single row: rate × hours = amount
  expense-section.tsx        ← expense card list (used for both recurring & one-time)
  expense-row.tsx            ← single expense row
  results-summary.tsx        ← 4-card output grid
  settings-dialog.tsx        ← settings modal
  archive-viewer.tsx         ← read-only view of archived month

lib/
  types.ts
  calculator.ts              ← pure functions (splitVat, calcMonth, etc.)
  storage.ts                 ← localStorage CRUD
  defaults.ts                ← default Settings, bracket rates, empty MonthData
  utils.ts                   ← formatCurrency, generateId, getCurrentMonth
```

### shadcn Components Needed

Card, Input, Select, Button, Dialog, Sheet, Separator, Badge, Tooltip, ScrollArea

## 6. Storage

**localStorage** — no server-side persistence needed (no auth, single user).

```
Keys:
  income-calc:current         → MonthData (active month)
  income-calc:archive:YYYY-MM → ArchivedMonth (per month)
```

### Month Archive Flow

1. User clicks "Finish Month & Archive"
2. Current month + results saved to `income-calc:archive:YYYY-MM`
3. New month generated: only `isRecurring` expenses carry forward, revenues cleared
4. Sidebar updates with new archive entry

## 7. State Management

`useState` at page level. No external state library needed.

- `monthData: MonthData` — the active month (loaded from localStorage on mount)
- `archives: ArchivedMonth[]` — list of archived months (loaded on mount)
- `results: CalculationResult` — derived via `useMemo` from `monthData`
- Auto-save to localStorage on `monthData` changes (debounced 300ms via `useEffect`)
- Calculations run on every keystroke (pure arithmetic, fast enough)

## 8. Output: Results Summary

Four cards in a 2x2 grid showing only what matters:

| Card | Value | Detail |
|------|-------|--------|
| **You Receive** | `revenueGrossTotal` | Net amount as subtitle |
| **Business Expenses** | `expensesBusinessGrossTotal` | Item count |
| **Set Aside** | `savingsTotal` (amber) | VAT: X / Tax: X breakdown |
| **Yours to Keep** | `cashLeftEst` (green/red) | After all deductions |

Clicking a card could show a detail dialog with full breakdown.

## 9. Settings Dialog

- VAT rate (%) — number input, default 19
- Income tax method — select: flat rate / progressive brackets
- Flat tax rate (%) — shown only when flat_rate selected, default 30
- Progressive brackets use hardcoded German 2024 defaults (not editable)

## 10. Key UX Decisions

- **Real-time calculation** — no "Calculate" button, results update as you type
- **Recurring badge** — recurring expenses show a small badge
- **Archive is read-only** — clicking a past month shows it in the main area with a "Back to current" button
- **Currency formatting** — always German locale: `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })` → `1.234,56 €`
- **Dark mode** — supported from the start via Tailwind `dark:` classes + theme toggle (use `next-themes`)

## 11. Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- shadcn/ui
- localStorage for persistence
- `next-themes` for dark mode toggle
- No backend, no database, no auth

## 12. Out of Scope

- Trade tax (Gewerbesteuer), solidarity surcharge, church tax
- Social insurance contributions
- Multi-year carryovers / depreciation
- User authentication
- Multi-device sync
- Backward compatibility with Python app JSON files
