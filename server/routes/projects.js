const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/init');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await db.allQuery(
      'SELECT * FROM projects ORDER BY date DESC, created_at DESC'
    );
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects', message: error.message });
  }
});

// Get project by ID with items
router.get('/:id', async (req, res) => {
  try {
    const project = await db.getQuery(
      'SELECT * FROM projects WHERE id = ?',
      [req.params.id]
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const items = await db.allQuery(
      'SELECT * FROM items WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ ...project, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project', message: error.message });
  }
});

// Create new project
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, date } = req.body;
      const result = await db.runQuery(
        'INSERT INTO projects (name, description, date) VALUES (?, ?, ?)',
        [name, description || null, date]
      );

      res.status(201).json({
        id: result.lastID,
        name,
        description: description || null,
        date,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project', message: error.message });
    }
  }
);

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { name, description, date } = req.body;
    const project = await db.getQuery('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.runQuery(
      'UPDATE projects SET name = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || project.name, description !== undefined ? description : project.description, date || project.date, req.params.id]
    );

    res.json({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project', message: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await db.getQuery('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.runQuery('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project', message: error.message });
  }
});

module.exports = router;
