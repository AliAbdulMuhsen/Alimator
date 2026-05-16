import pandas as pd
from models.project import Project
from models.item import Item
from models.category import Category

class ExcelImporter:
    @staticmethod
    def import_boq(file_path, project_name, project_date):
        """
        Import items from Excel BOQ file.
        Expected columns: Description, Unit, Quantity, Unit Price, Category (optional)
        """
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            # Validate required columns
            required_cols = ['Description', 'Unit', 'Quantity', 'Unit Price']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                return False, f"Missing columns: {', '.join(missing_cols)}"
            
            # Create project
            project_id = Project.create(project_name, '', project_date)
            
            imported_count = 0
            errors = []
            
            # Import items
            for idx, row in df.iterrows():
                try:
                    description = str(row['Description']).strip()
                    unit = str(row['Unit']).strip()
                    quantity = float(row['Quantity'])
                    unit_price = float(row['Unit Price'])
                    
                    # Get category if provided
                    category_id = None
                    if 'Category' in df.columns and pd.notna(row['Category']):
                        category_name = str(row['Category']).strip()
                        category_id = Category.get_by_name(category_name)
                        if not category_id:
                            category_id = Category.create(category_name)
                    
                    # Create item
                    Item.create(project_id, description, unit, quantity, unit_price, category_id)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Row {idx + 2}: {str(e)}")
            
            if errors:
                error_msg = "\n".join(errors[:5])  # Show first 5 errors
                return True, f"Imported {imported_count} items with {len(errors)} errors:\n{error_msg}"
            
            return True, f"Successfully imported {imported_count} items"
        
        except Exception as e:
            return False, f"Error reading Excel file: {str(e)}"
    
    @staticmethod
    def create_template():
        """
        Create a sample BOQ template Excel file.
        """
        data = {
            'Description': ['Concrete (m³)', 'Steel Rebar (kg)', 'Cement (bags)', 'Sand (m³)'],
            'Unit': ['m³', 'kg', 'bags', 'm³'],
            'Quantity': [10.0, 500.0, 100.0, 5.0],
            'Unit Price': [150.0, 50.0, 250.0, 100.0],
            'Category': ['Materials', 'Materials', 'Materials', 'Materials']
        }
        
        df = pd.DataFrame(data)
        template_path = 'templates/BOQ_Template.xlsx'
        df.to_excel(template_path, index=False, sheet_name='BOQ')
        return template_path
