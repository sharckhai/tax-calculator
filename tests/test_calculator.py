"""
Test cases for the Freelancer Tax & VAT Calculator
"""

import pytest
from tax_calculator import LineItem, Settings, split_vat, calc_month, estimate_income_tax_year


class TestSplitVat:
    """Tests for the split_vat function."""

    def test_split_vat_from_gross(self):
        """Test VAT splitting from gross amount."""
        net, vat, gross = split_vat(5000.0, "gross", 0.19)
        assert abs(net - 4201.68) < 0.01
        assert abs(vat - 798.32) < 0.01
        assert abs(gross - 5000.0) < 0.01

    def test_split_vat_from_net(self):
        """Test VAT splitting from net amount."""
        net, vat, gross = split_vat(4200.0, "net", 0.19)
        assert abs(net - 4200.0) < 0.01
        assert abs(vat - 798.0) < 0.01
        assert abs(gross - 4998.0) < 0.01

    def test_split_vat_from_vat(self):
        """Test VAT splitting from VAT amount."""
        net, vat, gross = split_vat(798.0, "vat", 0.19)
        assert abs(net - 4200.0) < 0.01
        assert abs(vat - 798.0) < 0.01
        assert abs(gross - 4998.0) < 0.01

    def test_split_vat_reduced_rate(self):
        """Test VAT splitting with reduced rate (7%)."""
        net, vat, gross = split_vat(1070.0, "gross", 0.07)
        assert abs(net - 1000.0) < 0.01
        assert abs(vat - 70.0) < 0.01
        assert abs(gross - 1070.0) < 0.01


class TestCalcMonth:
    """Tests for the calc_month function."""

    def test_scenario_1_gross_inputs(self):
        """
        Test 1 from spec (your scenario):
        Revenue: gross 5000 with 19%
        Expense: gross 300 with 19%
        """
        settings = Settings(
            vat_rate=0.19,
            vat_mode="gross",
            is_vat_liable=True,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [LineItem(amount=5000.0, amount_type="gross")]
        expenses = [LineItem(amount=300.0, amount_type="gross", is_business=True)]

        results = calc_month(revenues, expenses, settings)

        # Check VAT breakdown
        assert abs(results['revenue_net_total'] - 4201.68) < 0.01
        assert abs(results['revenue_vat_total'] - 798.32) < 0.01
        assert abs(results['expenses_business_net_total'] - 252.10) < 0.01
        assert abs(results['expenses_business_vat_total'] - 47.90) < 0.01

        # Check VAT settlement
        assert abs(results['vat_payable'] - (798.32 - 47.90)) < 0.01

        # Check profit
        expected_profit = 4201.68 - 252.10
        assert abs(results['profit_month'] - expected_profit) < 0.01

    def test_scenario_2_net_inputs(self):
        """
        Test 2 from spec:
        Revenue net 4200 => vat 798, gross 4998
        Expense net 250 => vat 47.5, gross 297.5
        """
        settings = Settings(
            vat_rate=0.19,
            vat_mode="net",
            is_vat_liable=True,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [LineItem(amount=4200.0, amount_type="net")]
        expenses = [LineItem(amount=250.0, amount_type="net", is_business=True)]

        results = calc_month(revenues, expenses, settings)

        # Check VAT breakdown
        assert abs(results['revenue_net_total'] - 4200.0) < 0.01
        assert abs(results['revenue_vat_total'] - 798.0) < 0.01
        assert abs(results['revenue_gross_total'] - 4998.0) < 0.01
        assert abs(results['expenses_business_net_total'] - 250.0) < 0.01
        assert abs(results['expenses_business_vat_total'] - 47.5) < 0.01
        assert abs(results['expenses_business_gross_total'] - 297.5) < 0.01

        # Check VAT settlement
        assert abs(results['vat_payable'] - 750.5) < 0.01

    def test_not_vat_liable(self):
        """Test calculation when not VAT liable."""
        settings = Settings(
            vat_rate=0.19,
            vat_mode="gross",
            is_vat_liable=False,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [LineItem(amount=5000.0, amount_type="gross")]
        expenses = [LineItem(amount=300.0, amount_type="gross", is_business=True)]

        results = calc_month(revenues, expenses, settings)

        # When not VAT liable, all VAT should be 0
        assert results['revenue_vat_total'] == 0.0
        assert results['expenses_business_vat_total'] == 0.0
        assert results['vat_payable'] == 0.0
        assert results['output_vat'] == 0.0
        assert results['input_vat'] == 0.0

    def test_non_business_expense(self):
        """Test that non-business expenses don't affect profit or input VAT."""
        settings = Settings(
            vat_rate=0.19,
            vat_mode="gross",
            is_vat_liable=True,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [LineItem(amount=5000.0, amount_type="gross")]
        expenses = [
            LineItem(amount=300.0, amount_type="gross", is_business=True),
            LineItem(amount=1000.0, amount_type="gross", is_business=False)  # Private expense
        ]

        results = calc_month(revenues, expenses, settings)

        # Only business expense should be counted
        assert abs(results['expenses_business_net_total'] - 252.10) < 0.01
        assert abs(results['expenses_business_vat_total'] - 47.90) < 0.01

        # Profit should not include private expense
        expected_profit = 4201.68 - 252.10
        assert abs(results['profit_month'] - expected_profit) < 0.01

    def test_mixed_vat_rates(self):
        """Test calculation with mixed VAT rates."""
        settings = Settings(
            vat_rate=0.19,
            vat_mode="gross",
            is_vat_liable=True,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [
            LineItem(amount=5000.0, amount_type="gross", vat_rate=0.19),
            LineItem(amount=1070.0, amount_type="gross", vat_rate=0.07)  # Reduced rate
        ]
        expenses = [LineItem(amount=300.0, amount_type="gross")]

        results = calc_month(revenues, expenses, settings)

        # Revenue should include both rates
        expected_net = 4201.68 + 1000.0
        assert abs(results['revenue_net_total'] - expected_net) < 0.01

    def test_vat_refund(self):
        """Test scenario where input VAT exceeds output VAT."""
        settings = Settings(
            vat_rate=0.19,
            vat_mode="gross",
            is_vat_liable=True,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [LineItem(amount=1000.0, amount_type="gross")]
        expenses = [LineItem(amount=5000.0, amount_type="gross", is_business=True)]

        results = calc_month(revenues, expenses, settings)

        # Should have VAT refund
        assert results['vat_payable'] == 0.0
        assert results['vat_refund'] > 0.0
        assert results['vat_refund'] == results['input_vat'] - results['output_vat']


class TestIncomeTax:
    """Tests for income tax estimation."""

    def test_flat_rate_income_tax(self):
        """Test flat rate income tax calculation."""
        settings = Settings(
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        tax = estimate_income_tax_year(50000.0, "flat_rate", settings)
        assert tax == 15000.0

    def test_flat_rate_no_profit(self):
        """Test flat rate with zero or negative profit."""
        settings = Settings(
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        assert estimate_income_tax_year(0.0, "flat_rate", settings) == 0.0
        assert estimate_income_tax_year(-1000.0, "flat_rate", settings) == 0.0

    def test_simple_brackets_basic_allowance(self):
        """Test that income below basic allowance is not taxed."""
        settings = Settings(
            income_tax_method="simple_brackets",
            basic_allowance=11604.0
        )

        tax = estimate_income_tax_year(10000.0, "simple_brackets", settings)
        assert tax == 0.0

    def test_simple_brackets_progressive(self):
        """Test progressive bracket calculation."""
        settings = Settings(
            income_tax_method="simple_brackets",
            basic_allowance=11604.0
        )

        # Test with income in second bracket
        tax = estimate_income_tax_year(20000.0, "simple_brackets", settings)
        assert tax > 0.0

        # Higher income should have higher tax
        tax_higher = estimate_income_tax_year(50000.0, "simple_brackets", settings)
        assert tax_higher > tax


class TestIntegration:
    """Integration tests with realistic scenarios."""

    def test_complete_month_calculation(self):
        """Test a complete monthly calculation with multiple items."""
        settings = Settings(
            vat_rate=0.19,
            vat_mode="gross",
            is_vat_liable=True,
            income_tax_method="flat_rate",
            flat_income_tax_rate=0.30
        )

        revenues = [
            LineItem(amount=5000.0, amount_type="gross"),
            LineItem(amount=2380.0, amount_type="gross"),
        ]

        expenses = [
            LineItem(amount=300.0, amount_type="gross", is_business=True),
            LineItem(amount=119.0, amount_type="gross", is_business=True),
            LineItem(amount=500.0, amount_type="gross", is_business=False),  # Private
        ]

        results = calc_month(revenues, expenses, settings)

        # Verify all sections have values
        assert results['revenue_gross_total'] == 7380.0
        assert results['revenue_net_total'] > 0
        assert results['profit_month'] > 0
        assert results['vat_payable'] > 0
        assert results['income_tax_month_est'] > 0
        assert results['cash_left_est'] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
