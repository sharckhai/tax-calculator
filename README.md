# Freelancer Tax & VAT Calculator

A Python calculator for freelancers to estimate monthly VAT settlement, profit, and income tax.

## Features

- **VAT Calculation**: Supports gross, net, and VAT amount inputs with flexible VAT rates (19%, 7%, or custom)
- **VAT Settlement**: Calculates VAT payable or refund (output VAT - input VAT)
- **Profit Calculation**: Net revenue minus net business expenses
- **Income Tax Estimation**: Two methods:
  - Flat rate (simple percentage)
  - Progressive brackets (German-style tax system)
- **Cash Flow Estimate**: Shows estimated cash position after taxes

## Installation

No external dependencies required for basic usage. For tests:

```bash
pip install pytest
```

## Usage

### CLI Interface

Run the calculator with a JSON input file:

```bash
python cli.py sample_input.json
```

### JSON Input Format

```json
{
  "settings": {
    "vat_rate": 0.19,
    "vat_mode": "gross",
    "is_vat_liable": true,
    "income_tax_method": "flat_rate",
    "flat_income_tax_rate": 0.30
  },
  "revenues": [
    {
      "amount": 5000.0,
      "amount_type": "gross"
    }
  ],
  "expenses": [
    {
      "amount": 300.0,
      "amount_type": "gross",
      "is_business": true
    }
  ]
}
```

### Settings Options

- `vat_rate`: Default VAT rate (e.g., 0.19 for 19%)
- `vat_mode`: `"gross"` or `"net"` - how amounts are entered by default
- `is_vat_liable`: `true` if subject to VAT, `false` for Kleinunternehmer
- `income_tax_method`: `"flat_rate"` or `"simple_brackets"`
- `flat_income_tax_rate`: Tax rate for flat_rate method (e.g., 0.30 for 30%)

### Revenue/Expense Item Options

- `amount`: The monetary amount
- `amount_type`: `"gross"`, `"net"`, or `"vat"` (optional, defaults to vat_mode)
- `vat_rate`: Override the default VAT rate for this item (optional)
- `is_business`: `true` for business expenses, `false` for private (expenses only)

## Examples

### Example 1: Basic Calculation (Gross Amounts)

```bash
python cli.py sample_input.json
```

Input:
- Revenue: €5,000 gross + €2,380 gross (19% VAT)
- Business expenses: €300 + €119 gross (19% VAT)
- Private expenses: €500 gross (not deductible)

### Example 2: Progressive Tax Brackets

```bash
python cli.py sample_progressive_tax.json
```

Uses German-style progressive tax brackets with basic allowance.

## Running Tests

```bash
python -m pytest test_tax_calculator.py -v
```

Or simply:

```bash
python test_tax_calculator.py
```

## Code Structure

- `tax_calculator.py`: Core calculation logic
  - `split_vat()`: Convert between net/gross/VAT
  - `calc_month()`: Main monthly calculation
  - `estimate_income_tax_year()`: Income tax estimation
- `cli.py`: Command-line interface
- `test_tax_calculator.py`: Test suite

## Output Example

```
============================================================
FREELANCER TAX & VAT CALCULATOR - MONTHLY REPORT
============================================================

📋 Settings:
  VAT Rate: 19%
  VAT Mode: gross
  VAT Liable: Yes
  Income Tax Method: flat_rate
  Flat Tax Rate: 30%

💰 REVENUE:
  Net:   €6,201.68
  VAT:   €1,178.32
  Gross: €7,380.00

💸 BUSINESS EXPENSES:
  Net:   €352.10
  VAT:   €66.90
  Gross: €419.00

🧾 VAT SETTLEMENT:
  Output VAT (collected): €1,178.32
  Input VAT (deductible): €66.90
  💳 VAT Payable:         €1,111.42

📊 PROFIT & INCOME TAX:
  Monthly Profit:              €5,849.58
  Estimated Yearly Profit:     €70,194.96
  Estimated Yearly Income Tax: €21,058.49
  📅 Monthly Income Tax Est:   €1,754.87

💵 CASH FLOW ESTIMATE:
  Cash In:        €7,380.00
  Cash Out:       €3,285.29
  (includes VAT payable + estimated income tax)
  ✨ Cash Left:   €4,094.71
```

## Important Notes

### What This Calculator Does

- Provides monthly estimates for planning purposes
- Calculates VAT settlement based on invoices and expenses
- Estimates income tax based on annualized profit

### What This Calculator Does NOT Do

- ELSTER submission
- Gewerbesteuer (trade tax)
- Solidaritätszuschlag (solidarity surcharge)
- Kirchensteuer (church tax)
- Social insurance (KV/PV/RV)
- Multi-year carryovers
- Depreciation
- Complex VAT exceptions

### Legal Disclaimer

This calculator is for estimation purposes only. Always consult with a tax advisor (Steuerberater) for accurate tax calculations and compliance with German tax law.

## License

MIT License - feel free to use and modify for your needs.