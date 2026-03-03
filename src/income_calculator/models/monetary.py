from dataclasses import dataclass
from typing import Literal, Optional


@dataclass
class LineItem:
    """Represents a revenue or expense item."""
    amount: float
    amount_type: Literal["gross", "net", "vat"] = "gross"
    vat_rate: Optional[float] = None
    is_business: bool = True
