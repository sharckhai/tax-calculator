"""
Freelancer Tax & VAT Calculator
Calculates VAT settlement, profit, and estimated income tax for freelancers.
"""

from typing import Literal
from .models import LineItem, Settings


def split_vat(amount: float, amount_type: Literal["gross", "net", "vat"], vat_rate: float) -> tuple[float, float, float]:
    """
    Split an amount into net, VAT, and gross components.

    Args:
        amount: The input amount
        amount_type: Whether the amount is "gross", "net", or "vat"
        vat_rate: VAT rate (e.g., 0.19 for 19%)

    Returns:
        Tuple of (net, vat, gross)
    """
    amount = amount or 0.0
    vat_rate = vat_rate or 0.0
    if amount_type == "gross":
        gross = amount
        net = gross / (1 + vat_rate)
        vat = gross - net
    elif amount_type == "net":
        net = amount
        vat = net * vat_rate
        gross = net + vat
    elif amount_type == "vat":
        vat = amount
        net = vat / vat_rate
        gross = net + vat
    else:
        raise ValueError(f"Invalid amount_type: {amount_type}")

    return (net, vat, gross)


def estimate_income_tax_year(profit_year: float, method: str, settings: Settings) -> float:
    """
    Estimate annual income tax based on yearly profit.

    Args:
        profit_year: Estimated annual profit
        method: "flat_rate" or "simple_brackets"
        settings: Settings object with tax parameters

    Returns:
        Estimated annual income tax
    """
    if profit_year <= 0:
        return 0.0

    if method == "flat_rate":
        return profit_year * settings.flat_income_tax_rate

    elif method == "simple_brackets":
        # Simple progressive bracket calculation
        tax = 0.0
        remaining = profit_year
        prev_threshold = 0.0

        for threshold, rate in settings.bracket_rates:
            if remaining <= 0:
                break

            # Calculate taxable amount in this bracket
            bracket_amount = min(remaining, threshold - prev_threshold)
            tax += bracket_amount * rate
            remaining -= bracket_amount
            prev_threshold = threshold

            if threshold == float('inf'):
                break

        return tax

    else:
        raise ValueError(f"Invalid income_tax_method: {method}")


def calc_month(
    revenues: list[LineItem],
    expenses: list[LineItem],
    settings: Settings
) -> dict:
    """
    Calculate monthly VAT settlement, profit, and tax estimates.

    Args:
        revenues: List of revenue line items
        expenses: List of expense line items
        settings: Calculation settings

    Returns:
        Dictionary with all calculated values
    """
    # Initialize totals
    revenue_net_total = 0.0
    revenue_vat_total = 0.0
    revenue_gross_total = 0.0

    expenses_business_net_total = 0.0
    expenses_business_vat_total = 0.0
    expenses_business_gross_total = 0.0

    # Process revenues
    for item in revenues:
        vat_rate = item.vat_rate if item.vat_rate is not None else settings.vat_rate
        amount_type = item.amount_type if item.amount_type != "gross" and item.amount_type != "net" else settings.vat_mode if item.amount_type == "gross" or item.amount_type == "net" else item.amount_type

        # Use item's amount_type if explicitly set, otherwise use global vat_mode
        if item.amount_type in ["gross", "net", "vat"]:
            amount_type = item.amount_type
        else:
            amount_type = settings.vat_mode

        net, vat, gross = split_vat(item.amount, amount_type, vat_rate)

        revenue_net_total += net
        if settings.is_vat_liable:
            revenue_vat_total += vat
        revenue_gross_total += gross

    # Process expenses
    for item in expenses:
        vat_rate = item.vat_rate if item.vat_rate is not None else settings.vat_rate

        # Use item's amount_type if explicitly set, otherwise use global vat_mode
        if item.amount_type in ["gross", "net", "vat"]:
            amount_type = item.amount_type
        else:
            amount_type = settings.vat_mode

        net, vat, gross = split_vat(item.amount, amount_type, vat_rate)

        # Only business expenses affect profit and input VAT
        if item.is_business:
            expenses_business_net_total += net
            if settings.is_vat_liable:
                expenses_business_vat_total += vat
            expenses_business_gross_total += gross

    # VAT settlement
    output_vat = revenue_vat_total if settings.is_vat_liable else 0.0
    input_vat = expenses_business_vat_total if settings.is_vat_liable else 0.0
    vat_payable = max(0.0, output_vat - input_vat)
    vat_refund = max(0.0, input_vat - output_vat)

    # Profit calculation
    profit_month = revenue_net_total - expenses_business_net_total
    profit_year_est = profit_month * 12

    # Income tax estimation
    income_tax_year_est = estimate_income_tax_year(
        profit_year_est,
        settings.income_tax_method,
        settings
    )
    income_tax_month_est = income_tax_year_est / 12

    # Cash flow estimate
    cash_in = revenue_gross_total
    cash_out = expenses_business_gross_total + vat_payable + income_tax_month_est
    cash_left_est = cash_in - cash_out

    return {
        # VAT breakdown
        "revenue_net_total": round(revenue_net_total, 2),
        "revenue_vat_total": round(revenue_vat_total, 2),
        "revenue_gross_total": round(revenue_gross_total, 2),
        "expenses_business_net_total": round(expenses_business_net_total, 2),
        "expenses_business_vat_total": round(expenses_business_vat_total, 2),
        "expenses_business_gross_total": round(expenses_business_gross_total, 2),

        # VAT settlement
        "output_vat": round(output_vat, 2),
        "input_vat": round(input_vat, 2),
        "vat_payable": round(vat_payable, 2),
        "vat_refund": round(vat_refund, 2),

        # Profit & income tax
        "profit_month": round(profit_month, 2),
        "profit_year_est": round(profit_year_est, 2),
        "income_tax_year_est": round(income_tax_year_est, 2),
        "income_tax_month_est": round(income_tax_month_est, 2),

        # Cash flow
        "cash_in": round(cash_in, 2),
        "cash_out": round(cash_out, 2),
        "cash_left_est": round(cash_left_est, 2),
    }