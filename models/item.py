from database.db import execute_query, fetch_one, fetch_all
from datetime import datetime

class Item:
    @staticmethod
    def create(project_id, description, unit, quantity, unit_price, category_id=None):
        """Create new item"""
        total_cost = float(quantity) * float(unit_price)
        query = '''
            INSERT INTO items (project_id, category_id, description, unit, quantity, unit_price, total_cost, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        now = datetime.now().isoformat()
        item_id = execute_query(query, (project_id, category_id, description, unit, quantity, unit_price, total_cost, now, now))
        
        # Add to price history
        Item.add_to_price_history(description, unit, unit_price, project_id, category_id)
        
        return item_id
    
    @staticmethod
    def get_by_project(project_id):
        """Get all items in a project"""
        query = '''
            SELECT i.*, c.name as category_name, p.date as project_date
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            JOIN projects p ON i.project_id = p.id
            WHERE i.project_id = ?
            ORDER BY i.description ASC
        '''
        return fetch_all(query, (project_id,))
    
    @staticmethod
    def get_by_id(item_id):
        """Get item by ID"""
        query = 'SELECT * FROM items WHERE id = ?'
        return fetch_one(query, (item_id,))
    
    @staticmethod
    def update(item_id, description, unit, quantity, unit_price, category_id=None):
        """Update item"""
        total_cost = float(quantity) * float(unit_price)
        query = '''
            UPDATE items 
            SET description = ?, unit = ?, quantity = ?, unit_price = ?, total_cost = ?, category_id = ?, updated_at = ?
            WHERE id = ?
        '''
        now = datetime.now().isoformat()
        execute_query(query, (description, unit, quantity, unit_price, total_cost, category_id, now, item_id))
    
    @staticmethod
    def delete(item_id):
        """Delete item"""
        query = 'DELETE FROM items WHERE id = ?'
        execute_query(query, (item_id,))
    
    @staticmethod
    def add_to_price_history(description, unit, unit_price, project_id, category_id=None):
        """Add item to price history"""
        # Get project date
        project_query = 'SELECT date FROM projects WHERE id = ?'
        project = fetch_one(project_query, (project_id,))
        if project:
            query = '''
                INSERT INTO price_history (item_description, unit, unit_price, project_id, project_date, category_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            '''
            now = datetime.now().isoformat()
            execute_query(query, (description, unit, unit_price, project_id, project['date'], category_id, now))
