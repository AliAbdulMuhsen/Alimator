from database.db import fetch_all
import math

class Search:
    @staticmethod
    def autocomplete(query, category_id=None, limit=10):
        """Get autocomplete suggestions for item descriptions"""
        search_query = f"%{query}%"
        if category_id:
            sql = '''
                SELECT DISTINCT description FROM items
                WHERE description LIKE ? AND category_id = ?
                ORDER BY description ASC
                LIMIT ?
            '''
            results = fetch_all(sql, (search_query, category_id, limit))
        else:
            sql = '''
                SELECT DISTINCT description FROM items
                WHERE description LIKE ?
                ORDER BY description ASC
                LIMIT ?
            '''
            results = fetch_all(sql, (search_query, limit))
        
        return [row['description'] for row in results]
    
    @staticmethod
    def search_items(description, category_id=None):
        """Search for items and their price history"""
        search_query = f"%{description}%"
        
        if category_id:
            sql = '''
                SELECT 
                    ph.item_description as description,
                    ph.unit,
                    ph.unit_price,
                    p.name as project_name,
                    p.date as project_date,
                    ph.category_id
                FROM price_history ph
                JOIN projects p ON ph.project_id = p.id
                WHERE ph.item_description LIKE ? AND ph.category_id = ?
                ORDER BY p.date DESC
            '''
            results = fetch_all(sql, (search_query, category_id))
        else:
            sql = '''
                SELECT 
                    ph.item_description as description,
                    ph.unit,
                    ph.unit_price,
                    p.name as project_name,
                    p.date as project_date,
                    ph.category_id
                FROM price_history ph
                JOIN projects p ON ph.project_id = p.id
                WHERE ph.item_description LIKE ?
                ORDER BY p.date DESC
            '''
            results = fetch_all(sql, (search_query,))
        
        if not results:
            return None
        
        # Calculate statistics
        prices = [float(r['unit_price']) for r in results]
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        
        return {
            'description': results[0]['description'],
            'results': results,
            'statistics': {
                'occurrences': len(results),
                'average_price': round(avg_price, 2),
                'min_price': round(min_price, 2),
                'max_price': round(max_price, 2)
            }
        }
    
    @staticmethod
    def get_items_by_category(category_id):
        """Get all items in a category"""
        sql = '''
            SELECT DISTINCT description FROM items
            WHERE category_id = ?
            ORDER BY description ASC
        '''
        results = fetch_all(sql, (category_id,))
        return [row['description'] for row in results]
