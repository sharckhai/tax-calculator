"""
Bridge between JSON schema and calc_month() inputs.
Converts JSON data to LineItem/Settings objects and computes full results.
"""

from .models import LineItem, Settings
from .calculator import calc_month


def json_to_calc_inputs(data: dict) -> tuple[list[LineItem], list[LineItem], Settings]:
    """Convert JSON data to calc_month() inputs."""
    s = data.get("settings", {})
    settings = Settings(
        vat_rate=s.get("vat_rate", 0.19),
        vat_mode="gross",
        is_vat_liable=True,
        income_tax_method=s.get("income_tax_method", "flat_rate"),
        flat_income_tax_rate=s.get("flat_income_tax_rate", 0.30),
    )

    revenues = []
    for item in data.get("revenues", []):
        amount = item.get("amount") or 0.0
        # If daily_rate and days are set, compute amount from them
        daily_rate = item.get("daily_rate") or 0.0
        days = item.get("days") or 0
        if daily_rate and days:
            amount = daily_rate * days

        revenues.append(LineItem(
            amount=amount,
            amount_type=item.get("amount_type") or "net",
            vat_rate=item.get("vat_rate") or None,
            is_business=True,
        ))

    expenses = []
    for item in data.get("expenses_business", []):
        expenses.append(LineItem(
            amount=item.get("amount") or 0.0,
            amount_type=item.get("amount_type") or "gross",
            vat_rate=item.get("vat_rate") or settings.vat_rate,
            is_business=True,
        ))

    return revenues, expenses, settings


def compute_full_results(data: dict) -> dict:
    """Run calc_month() and add private cost summary."""
    revenues, expenses, settings = json_to_calc_inputs(data)
    results = calc_month(revenues, expenses, settings)

    # Private costs summary
    private_expenses = data.get("expenses_private", [])
    private_total = sum(e.get("amount", 0.0) for e in private_expenses)
    by_category = {}
    for e in private_expenses:
        cat = e.get("category", "other")
        by_category[cat] = by_category.get(cat, 0.0) + e.get("amount", 0.0)

    results["private_costs_total"] = round(private_total, 2)
    results["private_costs_by_category"] = {k: round(v, 2) for k, v in by_category.items()}
    results["final_remaining"] = round(results["cash_left_est"] - private_total, 2)

    # Savings to set aside
    results["savings_vat"] = results["vat_payable"]
    results["savings_income_tax"] = results["income_tax_month_est"]
    results["savings_total"] = round(results["vat_payable"] + results["income_tax_month_est"], 2)

    return results
