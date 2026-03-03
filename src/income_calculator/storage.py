"""
JSON-based persistence layer for the income calculator web app.
Handles current state, archiving, and first-run seeding.
"""

import json
from datetime import datetime, date
from pathlib import Path

def _find_project_root() -> Path:
    """Walk up from this file to find the project root (contains pyproject.toml)."""
    current = Path(__file__).resolve().parent
    for parent in [current] + list(current.parents):
        if (parent / "pyproject.toml").exists():
            return parent
    # Fallback: assume src/income_calculator/storage.py → 3 levels up
    return Path(__file__).resolve().parent.parent.parent

DATA_DIR = _find_project_root() / "data"
CURRENT_FILE = DATA_DIR / "current.json"
ARCHIVE_DIR = DATA_DIR / "archive"


def _ensure_dirs():
    DATA_DIR.mkdir(exist_ok=True)
    ARCHIVE_DIR.mkdir(exist_ok=True)


def _seed_default() -> dict:
    """Build an empty initial current.json with sensible defaults."""
    from .constants.tax import tax_setting

    today = date.today()
    month_str = today.strftime("%Y-%m")
    settings = tax_setting["settings"]

    return {
        "month": month_str,
        "settings": {
            "vat_rate": settings.get("vat_rate") or 0.19,
            "income_tax_method": settings.get("income_tax_method") or "flat_rate",
            "flat_income_tax_rate": settings.get("flat_income_tax_rate") or 0.30,
        },
        "revenues": [],
        "expenses_business": [],
        "expenses_private": [],
        "last_modified": datetime.now().isoformat(timespec="seconds"),
    }


def load_current() -> dict:
    """Load current.json, seeding from constants if it doesn't exist."""
    _ensure_dirs()
    if not CURRENT_FILE.exists():
        data = _seed_default()
        save_current(data)
        return data
    with open(CURRENT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_current(data: dict):
    """Write data to current.json with updated timestamp."""
    _ensure_dirs()
    data["last_modified"] = datetime.now().isoformat(timespec="seconds")
    with open(CURRENT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def archive_month(data: dict, results: dict):
    """Archive the current month's data + results, then start a new month."""
    _ensure_dirs()
    month = data["month"]
    archive_file = ARCHIVE_DIR / f"{month}.json"

    archived = {**data, "results": results, "archived_at": datetime.now().isoformat(timespec="seconds")}
    with open(archive_file, "w", encoding="utf-8") as f:
        json.dump(archived, f, indent=2, ensure_ascii=False)

    new_data = _next_month_data(data)
    save_current(new_data)
    return new_data


def _next_month_data(data: dict) -> dict:
    """Generate next month's state: recurring items only, no revenues, advanced month."""
    current_date = datetime.strptime(data["month"], "%Y-%m")
    if current_date.month == 12:
        next_month = current_date.replace(year=current_date.year + 1, month=1)
    else:
        next_month = current_date.replace(month=current_date.month + 1)

    return {
        "month": next_month.strftime("%Y-%m"),
        "settings": data["settings"],
        "revenues": [],
        "expenses_business": [e for e in data["expenses_business"] if e.get("is_recurring", False)],
        "expenses_private": [e for e in data["expenses_private"] if e.get("is_recurring", False)],
        "last_modified": datetime.now().isoformat(timespec="seconds"),
    }


def list_archives() -> list[dict]:
    """List archived months with basic metadata, newest first."""
    _ensure_dirs()
    archives = []
    for path in sorted(ARCHIVE_DIR.glob("*.json"), reverse=True):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        archives.append({
            "month": data["month"],
            "archived_at": data.get("archived_at", ""),
            "file": path.name,
            "results": data.get("results", {}),
        })
    return archives


def load_archive(month: str) -> dict | None:
    """Load a specific archived month."""
    _ensure_dirs()
    path = ARCHIVE_DIR / f"{month}.json"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
