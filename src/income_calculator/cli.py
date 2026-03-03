#!/usr/bin/env python3
"""
CLI interface for the Freelancer Tax & VAT Calculator
"""

import json
import sys
from pathlib import Path
from tax_calculator import LineItem, Settings, calc_month


def load_data_from_json(file_path: str) -> tuple[list[LineItem], list[LineItem], Settings]:
    """
    Load calculation data from a JSON file.

    Args:
        file_path: Path to JSON file

    Returns:
        Tuple of (revenues, expenses, settings)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Parse settings
    settings_data = data.get('settings', {})
    settings = Settings(
        vat_rate=settings_data.get('vat_rate', 0.19),
        vat_mode=settings_data.get('vat_mode', 'gross'),
        is_vat_liable=settings_data.get('is_vat_liable', True),
        income_tax_method=settings_data.get('income_tax_method', 'flat_rate'),
        flat_income_tax_rate=settings_data.get('flat_income_tax_rate', 0.30),
    )

    # If using simple_brackets, load bracket parameters if provided
    if settings.income_tax_method == 'simple_brackets':
        if 'basic_allowance' in settings_data:
            settings.basic_allowance = settings_data['basic_allowance']
        if 'bracket_rates' in settings_data:
            settings.bracket_rates = [tuple(b) for b in settings_data['bracket_rates']]

    # Parse revenues
    revenues = []
    for item_data in data.get('revenues', []):
        revenues.append(LineItem(
            amount=item_data['amount'],
            amount_type=item_data.get('amount_type', settings.vat_mode),
            vat_rate=item_data.get('vat_rate'),
            is_business=True
        ))

    # Parse expenses
    expenses = []
    for item_data in data.get('expenses', []):
        expenses.append(LineItem(
            amount=item_data['amount'],
            amount_type=item_data.get('amount_type', settings.vat_mode),
            vat_rate=item_data.get('vat_rate'),
            is_business=item_data.get('is_business', True)
        ))

    return revenues, expenses, settings


def format_currency(amount: float) -> str:
    """Format a number as currency (EUR)."""
    return f"€{amount:,.2f}"


def print_results(results: dict, settings: Settings):
    """
    Print calculation results in a readable format.

    Args:
        results: Dictionary from calc_month()
        settings: Settings used for calculation
    """
    print("\n" + "="*60)
    print("FREELANCER TAX & VAT CALCULATOR - MONTHLY REPORT")
    print("="*60)

    # Settings summary
    print("\n📋 Settings:")
    print(f"  VAT Rate: {settings.vat_rate * 100:.0f}%")
    print(f"  VAT Mode: {settings.vat_mode}")
    print(f"  VAT Liable: {'Yes' if settings.is_vat_liable else 'No'}")
    print(f"  Income Tax Method: {settings.income_tax_method}")
    if settings.income_tax_method == 'flat_rate':
        print(f"  Flat Tax Rate: {settings.flat_income_tax_rate * 100:.0f}%")

    # Revenue breakdown
    print("\n💰 REVENUE:")
    print(f"  Net:   {format_currency(results['revenue_net_total'])}")
    print(f"  VAT:   {format_currency(results['revenue_vat_total'])}")
    print(f"  Gross: {format_currency(results['revenue_gross_total'])}")

    # Expense breakdown
    print("\n💸 BUSINESS EXPENSES:")
    print(f"  Net:   {format_currency(results['expenses_business_net_total'])}")
    print(f"  VAT:   {format_currency(results['expenses_business_vat_total'])}")
    print(f"  Gross: {format_currency(results['expenses_business_gross_total'])}")

    # VAT settlement
    print("\n🧾 VAT SETTLEMENT:")
    print(f"  Output VAT (collected): {format_currency(results['output_vat'])}")
    print(f"  Input VAT (deductible): {format_currency(results['input_vat'])}")
    if results['vat_payable'] > 0:
        print(f"  💳 VAT Payable:         {format_currency(results['vat_payable'])}")
    if results['vat_refund'] > 0:
        print(f"  💚 VAT Refund:          {format_currency(results['vat_refund'])}")

    # Profit & income tax
    print("\n📊 PROFIT & INCOME TAX:")
    print(f"  Monthly Profit:              {format_currency(results['profit_month'])}")
    print(f"  Estimated Yearly Profit:     {format_currency(results['profit_year_est'])}")
    print(f"  Estimated Yearly Income Tax: {format_currency(results['income_tax_year_est'])}")
    print(f"  📅 Monthly Income Tax Est:   {format_currency(results['income_tax_month_est'])}")

    # Cash flow
    print("\n💵 CASH FLOW ESTIMATE:")
    print(f"  Cash In:        {format_currency(results['cash_in'])}")
    print(f"  Cash Out:       {format_currency(results['cash_out'])}")
    print(f"  (includes VAT payable + estimated income tax)")
    print(f"  ✨ Cash Left:   {format_currency(results['cash_left_est'])}")

    print("\n" + "="*60 + "\n")


def main():
    """Main CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python cli.py <input.json>")
        print("\nExample:")
        print("  python cli.py sample_input.json")
        sys.exit(1)

    input_file = sys.argv[1]

    if not Path(input_file).exists():
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)

    try:
        revenues, expenses, settings = load_data_from_json(input_file)
        results = calc_month(revenues, expenses, settings)
        print_results(results, settings)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()