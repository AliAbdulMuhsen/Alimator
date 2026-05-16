from database.db import execute_query, fetch_one, fetch_all
from datetime import datetime

class Category:
    @staticmethod
    def create(name, description=''):
        """Create new category"""
        query = '''
            INSERT INTO categories (name, description, created_at)
            VALUES (?, ?, ?)
        '''
        now = datetime.now().isoformat()
        try:
            category_id = execute_query(query, (name, description, now))
            return category_id
        except Exception as e:
            # Category already exists
            return None
    
    @staticmethod
    def get_by_id(category_id):
        """Get category by ID"""
        query = 'SELECT * FROM categories WHERE id = ?'
        return fetch_one(query, (category_id,))
    
    @staticmethod
    def get_all():
        """Get all categories"""
        query = 'SELECT id, name FROM categories ORDER BY name ASC'
        return fetch_all(query)
    
    @staticmethod
    def get_by_name(name):
        """Get category by name"""
        query = 'SELECT id FROM categories WHERE name = ?'
        result = fetch_one(query, (name,))
        return result['id'] if result else None
