#!/usr/bin/env python3
"""
Main script for Freelancer Tax & VAT Calculator
Interactive Rich CLI — all data entered by the user.
"""

import sys
from .models import LineItem, Settings
from .calculator import calc_month
from .constants.tax import tax_setting
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()


def format_currency(amount: float) -> str:
    """Format a number as currency (EUR)."""
    return f"EUR {amount:,.2f}"


def create_settings_from_constants() -> Settings:
    """Create Settings object from tax_setting constants."""
    settings_dict = tax_setting["settings"]

    return Settings(
        vat_rate=settings_dict.get("vat_rate", 0.19),
        vat_mode="gross",
        is_vat_liable=True,
        income_tax_method=settings_dict.get("income_tax_method", "flat_rate"),
        flat_income_tax_rate=settings_dict.get("flat_income_tax_rate", 0.30)
    )


def get_expenses_from_user() -> list[tuple[str, LineItem]]:
    """
    Get business expense information from user input.
    Returns a list of tuples: (label, LineItem)
    """
    expenses = []

    print("\n" + "="*60)
    print("BUSINESS EXPENSES INPUT")
    print("="*60)
    print("\nEnter your monthly business expenses (gross amounts).")
    print("Type 'done' when finished.\n")

    while True:
        try:
            print(f"\n--- Expense #{len(expenses) + 1} ---")
            label = input("Label (or 'done'): ").strip()

            if label.lower() == 'done':
                break

            amount_str = input("Amount (EUR, gross): ").strip()
            amount = float(amount_str)

            if amount <= 0:
                print("Please enter a positive amount.")
                continue

            expenses.append((
                label,
                LineItem(amount=amount, amount_type="gross", is_business=True),
            ))

            print(f"Added: {label} — {format_currency(amount)} (gross)")

        except ValueError:
            print("Invalid input. Please enter a number or 'done'.")
        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
            sys.exit(0)

    return expenses


def get_revenues_from_user() -> list[tuple[LineItem, float, int]]:
    """
    Get revenue information from user input.
    Returns a list of tuples: (LineItem, daily_rate, days_worked)
    For total net mode: daily_rate will be the net amount, days will be 1
    """
    revenues = []

    print("\n" + "="*60)
    print("REVENUE INPUT")
    print("="*60)

    # Ask for input mode
    print("\nHow would you like to enter revenue?")
    print("  1. Daily rate + days worked")
    print("  2. Total net amount")

    while True:
        mode_input = input("\nSelect mode (1 or 2): ").strip()
        if mode_input in ['1', '2']:
            input_mode = mode_input
            break
        print("Please enter 1 or 2")

    if input_mode == '1':
        print("\nEnter your monthly revenues by daily rate and days worked.")
        print("Revenue will be calculated as: daily_rate * days (NET, before VAT)")
    else:
        print("\nEnter your monthly revenues as total net amounts (before VAT).")

    print("Type 'done' when finished.\n")

    while True:
        try:
            print(f"\n--- Revenue Item #{len(revenues) + 1} ---")

            if input_mode == '1':
                # Daily rate + days mode
                daily_rate_str = input("Daily rate (EUR/day) or 'done': ").strip()

                if daily_rate_str.lower() == 'done':
                    break

                daily_rate = float(daily_rate_str)

                if daily_rate <= 0:
                    print("Please enter a positive daily rate.")
                    continue

                days_str = input("Number of days worked: ").strip()
                days = int(days_str)

                if days <= 0:
                    print("Please enter a positive number of days.")
                    continue

                net_amount = daily_rate * days

                revenues.append((
                    LineItem(
                        amount=net_amount,
                        amount_type="net"
                    ),
                    daily_rate,
                    days
                ))

                print(f"Added: {days} days @ {format_currency(daily_rate)}/day = {format_currency(net_amount)} (net)")

            else:
                # Total net amount mode
                net_amount_str = input("Total net amount (EUR) or 'done': ").strip()

                if net_amount_str.lower() == 'done':
                    break

                net_amount = float(net_amount_str)

                if net_amount <= 0:
                    print("Please enter a positive amount.")
                    continue

                revenues.append((
                    LineItem(
                        amount=net_amount,
                        amount_type="net"
                    ),
                    net_amount,  # Store net_amount as "daily_rate" for display
                    1  # 1 "day" to indicate total amount mode
                ))

                print(f"Added: {format_currency(net_amount)} (net)")

        except ValueError:
            print("Invalid input. Please enter a number or 'done'.")
        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
            sys.exit(0)

    return revenues


def print_results(results: dict, revenue_items: list[tuple[LineItem, float, int]], expense_items: list[tuple[str, LineItem]]):
    """
    Print calculation results in a readable format with colors.
    """
    console.print()
    console.print(Panel.fit(
        "[bold cyan]FREELANCER TAX & VAT CALCULATOR - MONTHLY REPORT[/bold cyan]",
        border_style="cyan"
    ))

    # Revenue items table
    revenue_table = Table(title="[bold green]Revenue Items[/bold green]", box=box.ROUNDED, border_style="green")
    revenue_table.add_column("#", style="dim")
    revenue_table.add_column("Description", style="cyan")
    revenue_table.add_column("Net Amount", justify="right", style="bold green")

    for idx, (item, daily_rate, days) in enumerate(revenue_items, 1):
        if days == 1:
            # Total net amount mode
            description = "Total net revenue"
        else:
            # Daily rate mode
            description = f"{days} days @ {format_currency(daily_rate)}/day"

        revenue_table.add_row(
            str(idx),
            description,
            format_currency(item.amount)
        )

    revenue_table.add_section()
    revenue_table.add_row("", "[bold]TOTAL[/bold]", f"[bold green]{format_currency(results['revenue_net_total'])}[/bold green]")
    console.print(revenue_table)

    # Business expenses table
    expense_table = Table(title="[bold yellow]Business Expenses[/bold yellow]", box=box.ROUNDED, border_style="yellow")
    expense_table.add_column("Item", style="yellow")
    expense_table.add_column("Amount (Gross)", justify="right", style="bold yellow")

    for label, item in expense_items:
        expense_table.add_row(label, format_currency(item.amount))

    total_expenses = sum(item.amount for _, item in expense_items)
    expense_table.add_section()
    expense_table.add_row("[bold]TOTAL[/bold]", f"[bold yellow]{format_currency(total_expenses)}[/bold yellow]")
    console.print(expense_table)

    # Revenue & Expense breakdown
    breakdown_table = Table(title="[bold blue]Revenue & Expense Breakdown[/bold blue]", box=box.ROUNDED, border_style="blue")
    breakdown_table.add_column("Category", style="bold")
    breakdown_table.add_column("Net", justify="right", style="cyan")
    breakdown_table.add_column("VAT", justify="right", style="magenta")
    breakdown_table.add_column("Gross", justify="right", style="bold cyan")

    breakdown_table.add_row(
        "[green]Revenue[/green]",
        f"[green]{format_currency(results['revenue_net_total'])}[/green]",
        f"[green]{format_currency(results['revenue_vat_total'])}[/green]",
        f"[bold green]{format_currency(results['revenue_gross_total'])}[/bold green]"
    )
    breakdown_table.add_row(
        "[yellow]Business Expenses[/yellow]",
        f"[yellow]{format_currency(results['expenses_business_net_total'])}[/yellow]",
        f"[yellow]{format_currency(results['expenses_business_vat_total'])}[/yellow]",
        f"[bold yellow]{format_currency(results['expenses_business_gross_total'])}[/bold yellow]"
    )
    console.print(breakdown_table)

    # VAT Settlement
    vat_table = Table(title="[bold magenta]VAT Settlement[/bold magenta]", box=box.ROUNDED, border_style="magenta")
    vat_table.add_column("Description", style="bold")
    vat_table.add_column("Amount", justify="right", style="bold magenta")

    vat_table.add_row("Output VAT (collected)", format_currency(results['output_vat']))
    vat_table.add_row("Input VAT (deductible)", format_currency(results['input_vat']))
    vat_table.add_section()

    if results['vat_payable'] > 0:
        vat_table.add_row("[bold red]VAT PAYABLE[/bold red]", f"[bold red]{format_currency(results['vat_payable'])}[/bold red]")
    if results['vat_refund'] > 0:
        vat_table.add_row("[bold green]VAT REFUND[/bold green]", f"[bold green]{format_currency(results['vat_refund'])}[/bold green]")

    console.print(vat_table)

    # Profit & Tax
    profit_table = Table(title="[bold blue]Profit & Income Tax[/bold blue]", box=box.ROUNDED, border_style="blue")
    profit_table.add_column("Description", style="bold")
    profit_table.add_column("Amount", justify="right", style="bold")

    profit_table.add_row("Monthly Profit", f"[green]{format_currency(results['profit_month'])}[/green]")
    profit_table.add_section()
    profit_table.add_row("Estimated Yearly Profit", format_currency(results['profit_year_est']))
    profit_table.add_row("Estimated Yearly Income Tax", format_currency(results['income_tax_year_est']))
    profit_table.add_section()
    profit_table.add_row("[bold]Monthly Income Tax Est[/bold]", f"[bold red]{format_currency(results['income_tax_month_est'])}[/bold red]")
    console.print(profit_table)

    # Cash flow
    cash_table = Table(title="[bold cyan]Cash Flow Estimate[/bold cyan]", box=box.ROUNDED, border_style="cyan")
    cash_table.add_column("Description", style="bold")
    cash_table.add_column("Amount", justify="right", style="bold")

    cash_table.add_row("Cash In", f"[green]{format_currency(results['cash_in'])}[/green]")
    cash_table.add_row("Cash Out", f"[red]{format_currency(results['cash_out'])}[/red]")
    cash_table.add_row("[dim](includes VAT payable + estimated income tax)[/dim]", "")
    cash_table.add_section()
    cash_table.add_row("[bold]Cash Left[/bold]", f"[bold green]{format_currency(results['cash_left_est'])}[/bold green]")
    console.print(cash_table)

    # Savings to set aside
    vat_to_save = results['vat_payable']
    income_tax_to_save = results['income_tax_month_est']
    total_to_save = vat_to_save + income_tax_to_save

    savings_table = Table(
        title="[bold white on red] MONTHLY SAVINGS TO SET ASIDE [/bold white on red]",
        box=box.DOUBLE,
        border_style="red",
        show_header=False
    )
    savings_table.add_column("Item", style="bold")
    savings_table.add_column("Amount", justify="right", style="bold red")

    savings_table.add_row("1. Save for VAT payment", format_currency(vat_to_save))
    savings_table.add_row("2. Save for Income Tax", format_currency(income_tax_to_save))
    savings_table.add_section()
    savings_table.add_row(
        "[bold white]TOTAL TO SAVE THIS MONTH[/bold white]",
        f"[bold white on red] {format_currency(total_to_save)} [/bold white on red]"
    )
    console.print(savings_table)

    console.print(f"\n[dim italic]Set aside {format_currency(total_to_save)} from this month's revenue[/dim italic]\n")


def main():
    """Main entry point."""
    print("Welcome to the Freelancer Tax & VAT Calculator!")

    # Load settings from constants
    settings = create_settings_from_constants()

    # Get revenues from user (returns list of tuples)
    revenue_items = get_revenues_from_user()

    if not revenue_items:
        print("\nNo revenues entered. Exiting.")
        sys.exit(0)

    # Get business expenses from user
    expense_items = get_expenses_from_user()

    # Extract LineItems for calculation
    revenue_line_items = [item for item, _, _ in revenue_items]
    expense_line_items = [item for _, item in expense_items]

    # Calculate
    results = calc_month(revenue_line_items, expense_line_items, settings)

    # Display results
    print_results(results, revenue_items, expense_items)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(0)