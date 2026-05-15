import math

class InflationCalculator:
    @staticmethod
    def calculate_adjusted_price(price, project_date, reference_year, inflation_rate):
        """
        Calculate inflation-adjusted price using compound yearly formula.
        Formula: Price × (1 + rate)^years
        
        Args:
            price: Original price
            project_date: Project date (YYYY-MM-DD format)
            reference_year: Target year to adjust to
            inflation_rate: Annual inflation rate as percentage (e.g., 5 for 5%)
        
        Returns:
            Adjusted price rounded to 2 decimal places
        """
        if not price or inflation_rate == 0:
            return round(float(price or 0), 2)
        
        try:
            project_year = int(project_date.split('-')[0])
            years_diff = reference_year - project_year
            
            if years_diff <= 0:
                return round(float(price), 2)
            
            adjusted = float(price) * math.pow(1 + inflation_rate / 100, years_diff)
            return round(adjusted, 2)
        except (ValueError, IndexError):
            return round(float(price), 2)
    
    @staticmethod
    def get_year_difference(project_date, reference_year):
        """
        Get the number of years between project date and reference year.
        """
        try:
            project_year = int(project_date.split('-')[0])
            return reference_year - project_year
        except (ValueError, IndexError):
            return 0
