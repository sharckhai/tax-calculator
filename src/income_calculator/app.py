#!/usr/bin/env python3
"""
NiceGUI web app for the freelancer income calculator.
Run: python app.py
"""

from nicegui import ui
from .storage import load_current, save_current, archive_month, list_archives, load_archive
from .converter import compute_full_results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fmt(amount: float) -> str:
    return f"{amount:,.2f} EUR"


def _debounced_save(state: dict, results_container, on_change=None):
    """Save state and refresh results."""
    save_current(state)
    if results_container:
        _render_results(state, results_container)
    if on_change:
        on_change()


# ---------------------------------------------------------------------------
# Results panel
# ---------------------------------------------------------------------------

def _render_results(state: dict, container):
    container.clear()
    results = compute_full_results(state)
    with container:
        with ui.card().classes("w-full"):
            ui.label("Results").classes("text-xl font-bold mb-2")

            with ui.grid(columns=2).classes("w-full gap-2"):
                # Revenue
                ui.label("Revenue (net)").classes("font-semibold text-green-700")
                ui.label(fmt(results["revenue_net_total"])).classes("text-right text-green-700")
                ui.label("Revenue (gross)").classes("font-semibold text-green-600")
                ui.label(fmt(results["revenue_gross_total"])).classes("text-right text-green-600")

                ui.separator().classes("col-span-2")

                # VAT
                ui.label("Output VAT").classes("font-semibold")
                ui.label(fmt(results["output_vat"])).classes("text-right")
                ui.label("Input VAT").classes("font-semibold")
                ui.label(fmt(results["input_vat"])).classes("text-right")
                ui.label("VAT payable").classes("font-semibold text-red-600")
                ui.label(fmt(results["vat_payable"])).classes("text-right text-red-600")

                ui.separator().classes("col-span-2")

                # Profit
                ui.label("Profit (month)").classes("font-semibold text-blue-700")
                ui.label(fmt(results["profit_month"])).classes("text-right text-blue-700")
                ui.label("Profit (year est.)").classes("font-semibold")
                ui.label(fmt(results["profit_year_est"])).classes("text-right")

                ui.separator().classes("col-span-2")

                # Income tax
                ui.label("Income tax (month est.)").classes("font-semibold text-red-600")
                ui.label(fmt(results["income_tax_month_est"])).classes("text-right text-red-600")
                ui.label("Income tax (year est.)").classes("font-semibold")
                ui.label(fmt(results["income_tax_year_est"])).classes("text-right")

                ui.separator().classes("col-span-2")

                # Cash flow
                ui.label("Cash in").classes("font-semibold text-green-700")
                ui.label(fmt(results["cash_in"])).classes("text-right text-green-700")
                ui.label("Cash out").classes("font-semibold text-red-600")
                ui.label(fmt(results["cash_out"])).classes("text-right text-red-600")
                ui.label("Cash left").classes("font-bold text-lg")
                ui.label(fmt(results["cash_left_est"])).classes("text-right font-bold text-lg")

                ui.separator().classes("col-span-2")

                # Savings
                ui.label("Save for VAT").classes("font-semibold text-orange-600")
                ui.label(fmt(results["savings_vat"])).classes("text-right text-orange-600")
                ui.label("Save for income tax").classes("font-semibold text-orange-600")
                ui.label(fmt(results["savings_income_tax"])).classes("text-right text-orange-600")
                ui.label("Total to save").classes("font-bold text-orange-700")
                ui.label(fmt(results["savings_total"])).classes("text-right font-bold text-orange-700")

                ui.separator().classes("col-span-2")

                # Private costs
                ui.label("Private costs").classes("font-semibold text-red-500")
                ui.label(fmt(results["private_costs_total"])).classes("text-right text-red-500")
                for cat, amount in results["private_costs_by_category"].items():
                    ui.label(f"  {cat}").classes("text-sm text-gray-500 pl-4")
                    ui.label(fmt(amount)).classes("text-right text-sm text-gray-500")

                ui.separator().classes("col-span-2")

                # Final
                color = "text-green-700" if results["final_remaining"] >= 0 else "text-red-700"
                ui.label("Final remaining").classes(f"font-bold text-xl {color}")
                ui.label(fmt(results["final_remaining"])).classes(f"text-right font-bold text-xl {color}")


# ---------------------------------------------------------------------------
# Editable list sections
# ---------------------------------------------------------------------------

def _revenue_section(state: dict, save_fn):
    """Editable revenue rows."""
    with ui.card().classes("w-full"):
        ui.label("Revenue").classes("text-xl font-bold mb-2")
        rows_container = ui.column().classes("w-full gap-2")

        def render_rows():
            rows_container.clear()
            with rows_container:
                for i, rev in enumerate(state["revenues"]):
                    with ui.row().classes("w-full items-end gap-2"):
                        ui.input("Label", value=rev.get("label", "")).classes("w-40").on(
                            "change", lambda e, idx=i: _update_revenue(idx, "label", e.sender.value))
                        ui.number("Daily rate", value=rev.get("daily_rate", 0), format="%.2f", step=50).classes("w-28").on(
                            "change", lambda e, idx=i: _update_revenue(idx, "daily_rate", e.sender.value))
                        ui.number("Days", value=rev.get("days", 0), format="%.0f", step=1).classes("w-20").on(
                            "change", lambda e, idx=i: _update_revenue(idx, "days", e.sender.value))
                        ui.number("Amount", value=rev.get("amount", 0), format="%.2f", step=100).classes("w-32").on(
                            "change", lambda e, idx=i: _update_revenue(idx, "amount", e.sender.value))
                        ui.select(["net", "gross"], value=rev.get("amount_type", "net"), label="Type").classes("w-24").on(
                            "change", lambda e, idx=i: _update_revenue(idx, "amount_type", e.sender.value))
                        ui.button(icon="delete", on_click=lambda _, idx=i: _remove_revenue(idx)).props("flat color=red size=sm")

        def _update_revenue(idx, field, value):
            if idx < len(state["revenues"]):
                if field in ("daily_rate", "days", "amount"):
                    value = value or 0
                state["revenues"][idx][field] = value
                # Auto-compute amount from daily_rate * days
                rev = state["revenues"][idx]
                dr = rev.get("daily_rate", 0) or 0
                d = rev.get("days", 0) or 0
                if dr and d and field in ("daily_rate", "days"):
                    state["revenues"][idx]["amount"] = round(dr * d, 2)
                    render_rows()
                save_fn()

        def _remove_revenue(idx):
            if idx < len(state["revenues"]):
                state["revenues"].pop(idx)
                render_rows()
                save_fn()

        def _add_revenue():
            state["revenues"].append({
                "label": "", "daily_rate": 0, "days": 0, "amount": 0, "amount_type": "net"
            })
            render_rows()

        render_rows()
        ui.button("Add revenue", icon="add", on_click=_add_revenue).props("outline size=sm").classes("mt-2")


def _business_expenses_section(state: dict, save_fn):
    """Editable business expense rows."""
    with ui.card().classes("w-full"):
        ui.label("Business Expenses").classes("text-xl font-bold mb-2")
        rows_container = ui.column().classes("w-full gap-2")

        def render_rows():
            rows_container.clear()
            with rows_container:
                for i, exp in enumerate(state["expenses_business"]):
                    with ui.row().classes("w-full items-end gap-2"):
                        ui.input("Label", value=exp.get("label", "")).classes("w-40").on(
                            "change", lambda e, idx=i: _update(idx, "label", e.sender.value))
                        ui.number("Amount", value=exp.get("amount", 0), format="%.2f", step=10).classes("w-28").on(
                            "change", lambda e, idx=i: _update(idx, "amount", e.sender.value))
                        ui.select(["gross", "net"], value=exp.get("amount_type", "gross"), label="Type").classes("w-24").on(
                            "change", lambda e, idx=i: _update(idx, "amount_type", e.sender.value))
                        ui.number("VAT %", value=(exp.get("vat_rate", 0.19) or 0.19) * 100, format="%.0f", step=1, min=0, max=100).classes("w-20").on(
                            "change", lambda e, idx=i: _update(idx, "vat_rate", (e.sender.value or 19) / 100))
                        ui.checkbox("Recurring", value=exp.get("is_recurring", False)).on(
                            "change", lambda e, idx=i: _update(idx, "is_recurring", e.sender.value))
                        ui.button(icon="delete", on_click=lambda _, idx=i: _remove(idx)).props("flat color=red size=sm")

        def _update(idx, field, value):
            if idx < len(state["expenses_business"]):
                if field == "amount":
                    value = value or 0
                state["expenses_business"][idx][field] = value
                save_fn()

        def _remove(idx):
            if idx < len(state["expenses_business"]):
                state["expenses_business"].pop(idx)
                render_rows()
                save_fn()

        def _add():
            state["expenses_business"].append({
                "label": "", "amount": 0, "amount_type": "gross", "vat_rate": 0.19, "is_recurring": False,
            })
            render_rows()

        render_rows()
        ui.button("Add expense", icon="add", on_click=_add).props("outline size=sm").classes("mt-2")


def _private_expenses_section(state: dict, save_fn):
    """Editable private expense rows."""
    categories = ["duty", "fun", "variable", "honeygram", "other"]
    with ui.card().classes("w-full"):
        ui.label("Private Expenses").classes("text-xl font-bold mb-2")
        rows_container = ui.column().classes("w-full gap-2")

        def render_rows():
            rows_container.clear()
            with rows_container:
                for i, exp in enumerate(state["expenses_private"]):
                    with ui.row().classes("w-full items-end gap-2"):
                        ui.input("Label", value=exp.get("label", "")).classes("w-40").on(
                            "change", lambda e, idx=i: _update(idx, "label", e.sender.value))
                        ui.number("Amount", value=exp.get("amount", 0), format="%.2f", step=10).classes("w-28").on(
                            "change", lambda e, idx=i: _update(idx, "amount", e.sender.value))
                        ui.select(categories, value=exp.get("category", "other"), label="Category").classes("w-28").on(
                            "change", lambda e, idx=i: _update(idx, "category", e.sender.value))
                        ui.checkbox("Recurring", value=exp.get("is_recurring", False)).on(
                            "change", lambda e, idx=i: _update(idx, "is_recurring", e.sender.value))
                        ui.button(icon="delete", on_click=lambda _, idx=i: _remove(idx)).props("flat color=red size=sm")

        def _update(idx, field, value):
            if idx < len(state["expenses_private"]):
                if field == "amount":
                    value = value or 0
                state["expenses_private"][idx][field] = value
                save_fn()

        def _remove(idx):
            if idx < len(state["expenses_private"]):
                state["expenses_private"].pop(idx)
                render_rows()
                save_fn()

        def _add():
            state["expenses_private"].append({
                "label": "", "amount": 0, "category": "other", "is_recurring": False,
            })
            render_rows()

        render_rows()
        ui.button("Add expense", icon="add", on_click=_add).props("outline size=sm").classes("mt-2")


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

@ui.page("/")
def main_page():
    state = load_current()
    results_container = ui.column()

    def save_fn():
        _debounced_save(state, results_container)

    with ui.header().classes("items-center justify-between"):
        ui.label("Income Calculator").classes("text-2xl font-bold")
        with ui.row().classes("gap-2"):
            ui.label(f"Month: {state['month']}").classes("text-lg")
            ui.link("Archive", "/archive").classes("text-white")

    with ui.column().classes("w-full max-w-5xl mx-auto p-4 gap-4"):
        # Settings (collapsible)
        with ui.expansion("Settings", icon="settings").classes("w-full"):
            with ui.row().classes("gap-4 items-end"):
                ui.number("VAT rate %", value=state["settings"]["vat_rate"] * 100, format="%.0f",
                          min=0, max=100, step=1).classes("w-28").on(
                    "change", lambda e: _update_setting(state, "vat_rate", (e.sender.value or 19) / 100, save_fn))
                ui.select(["flat_rate", "simple_brackets"],
                          value=state["settings"]["income_tax_method"],
                          label="Tax method").classes("w-40").on(
                    "change", lambda e: _update_setting(state, "income_tax_method", e.sender.value, save_fn))
                ui.number("Flat tax rate %", value=state["settings"]["flat_income_tax_rate"] * 100,
                          format="%.0f", min=0, max=100, step=1).classes("w-28").on(
                    "change", lambda e: _update_setting(state, "flat_income_tax_rate", (e.sender.value or 30) / 100, save_fn))

        _revenue_section(state, save_fn)
        _business_expenses_section(state, save_fn)
        _private_expenses_section(state, save_fn)

        # Results
        _render_results(state, results_container)

        # Archive action
        with ui.row().classes("w-full justify-end mt-4"):
            async def finish_month():
                with ui.dialog() as dialog, ui.card():
                    ui.label(f"Archive {state['month']} and start next month?").classes("text-lg")
                    with ui.row().classes("w-full justify-end gap-2"):
                        ui.button("Cancel", on_click=dialog.close).props("flat")
                        ui.button("Confirm", on_click=lambda: _do_archive(state, dialog)).props("color=primary")
                dialog.open()

            ui.button("Finish Month & Archive", icon="archive", on_click=finish_month).props("color=primary size=lg")


def _update_setting(state, key, value, save_fn):
    state["settings"][key] = value
    save_fn()


def _do_archive(state, dialog):
    results = compute_full_results(state)
    new_state = archive_month(state, results)
    dialog.close()
    ui.navigate.to("/")


@ui.page("/archive")
def archive_page():
    with ui.header().classes("items-center justify-between"):
        ui.label("Archive").classes("text-2xl font-bold")
        ui.link("Back to Calculator", "/").classes("text-white")

    archives = list_archives()

    with ui.column().classes("w-full max-w-5xl mx-auto p-4 gap-4"):
        if not archives:
            ui.label("No archived months yet.").classes("text-gray-500 text-lg")
            return

        for arch in archives:
            r = arch.get("results", {})
            with ui.card().classes("w-full cursor-pointer").on("click", lambda _, m=arch["month"]: ui.navigate.to(f"/archive/{m}")):
                with ui.row().classes("w-full items-center justify-between"):
                    ui.label(arch["month"]).classes("text-xl font-bold")
                    ui.label(f"Archived: {arch['archived_at'][:10]}").classes("text-gray-500")
                if r:
                    with ui.row().classes("gap-6"):
                        ui.label(f"Revenue: {fmt(r.get('revenue_net_total', 0))}").classes("text-green-700")
                        ui.label(f"Profit: {fmt(r.get('profit_month', 0))}").classes("text-blue-700")
                        ui.label(f"Final: {fmt(r.get('final_remaining', 0))}").classes(
                            "text-green-700" if r.get("final_remaining", 0) >= 0 else "text-red-700")


@ui.page("/archive/{month}")
def archive_detail(month: str):
    data = load_archive(month)

    with ui.header().classes("items-center justify-between"):
        ui.label(f"Archive: {month}").classes("text-2xl font-bold")
        with ui.row().classes("gap-2"):
            ui.link("All Archives", "/archive").classes("text-white")
            ui.link("Calculator", "/").classes("text-white")

    if not data:
        with ui.column().classes("w-full max-w-5xl mx-auto p-4"):
            ui.label(f"Archive for {month} not found.").classes("text-red-500 text-lg")
        return

    results = data.get("results", {})
    with ui.column().classes("w-full max-w-5xl mx-auto p-4 gap-4"):
        # Inputs summary
        with ui.card().classes("w-full"):
            ui.label("Revenues").classes("text-lg font-bold")
            for rev in data.get("revenues", []):
                label = rev.get("label", "Revenue")
                dr = rev.get("daily_rate", 0)
                d = rev.get("days", 0)
                amt = rev.get("amount", 0)
                detail = f"{dr} x {d} days = " if dr and d else ""
                ui.label(f"{label}: {detail}{fmt(amt)} ({rev.get('amount_type', 'net')})").classes("ml-4")

        with ui.card().classes("w-full"):
            ui.label("Business Expenses").classes("text-lg font-bold")
            for exp in data.get("expenses_business", []):
                ui.label(f"{exp.get('label', '')}: {fmt(exp.get('amount', 0))} ({exp.get('amount_type', 'gross')})").classes("ml-4")

        with ui.card().classes("w-full"):
            ui.label("Private Expenses").classes("text-lg font-bold")
            for exp in data.get("expenses_private", []):
                ui.label(f"{exp.get('label', '')} [{exp.get('category', '')}]: {fmt(exp.get('amount', 0))}").classes("ml-4")

        # Results
        if results:
            results_container = ui.column().classes("w-full")
            # Reuse the results renderer with archive data
            _render_results(data, results_container)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run():
    ui.run(title="Income Calculator", port=8080, reload=False)


if __name__ in {"__main__", "__mp_main__"}:
    ui.run(title="Income Calculator", port=8080, reload=True)
