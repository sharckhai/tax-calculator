from dataclasses import dataclass, field
from typing import Literal, Optional


@dataclass
class Settings:
    """Global calculation settings."""
    vat_rate: float = 0.19
    vat_mode: Literal["gross", "net"] = "gross"
    is_vat_liable: bool = True
    income_tax_method: Literal["simple_brackets", "flat_rate"] = "flat_rate"
    flat_income_tax_rate: float = 0.30
    # For simple_brackets method
    basic_allowance: float = 11604.0  # 2024 German basic allowance
    bracket_rates: list[tuple[float, float]] = field(default_factory=lambda: [
        (11604, 0.0),      # Up to basic allowance: 0%
        (17005, 0.14),     # 14% starting rate
        (66760, 0.24),     # Progressive up to 24%
        (277825, 0.42),    # 42% top rate
        (float('inf'), 0.45)  # 45% for very high incomes
    ])