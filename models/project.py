from database.db import execute_query, fetch_one, fetch_all
from datetime import datetime

class Project:
    @staticmethod
    def create(name, description, date):
        """Create new project"""
        query = '''
            INSERT INTO projects (name, description, date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        '''
        now = datetime.now().isoformat()
        project_id = execute_query(query, (name, description, date, now, now))
        return project_id
    
    @staticmethod
    def get_by_id(project_id):
        """Get project by ID"""
        query = 'SELECT * FROM projects WHERE id = ?'
        return fetch_one(query, (project_id,))
    
    @staticmethod
    def get_all():
        """Get all projects"""
        query = 'SELECT * FROM projects ORDER BY date DESC'
        return fetch_all(query)
    
    @staticmethod
    def update(project_id, name, description, date):
        """Update project"""
        query = '''
            UPDATE projects 
            SET name = ?, description = ?, date = ?, updated_at = ?
            WHERE id = ?
        '''
        now = datetime.now().isoformat()
        execute_query(query, (name, description, date, now, project_id))
    
    @staticmethod
    def delete(project_id):
        """Delete project"""
        query = 'DELETE FROM projects WHERE id = ?'
        execute_query(query, (project_id,))
