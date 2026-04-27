const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/init');

const router = express.Router();

// Get items for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const items = await db.allQuery(
      'SELECT * FROM items WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await db.getQuery('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item', message: error.message });
  }
});

// Create item
router.post(
  '/',
  [
    body('project_id').isInt().withMessage('Valid project ID is required'),
    body('description').trim().notEmpty().withMessage('Item description is required'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { project_id, description, unit, quantity, unit_price } = req.body;
      const total_cost = quantity * unit_price;

      // Verify project exists
      const project = await db.getQuery('SELECT * FROM projects WHERE id = ?', [project_id]);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Insert item
      const result = await db.runQuery(
        'INSERT INTO items (project_id, description, unit, quantity, unit_price, total_cost) VALUES (?, ?, ?, ?, ?, ?)',
        [project_id, description, unit, quantity, unit_price, total_cost]
      );

      // Record price history
      await db.runQuery(
        'INSERT INTO price_history (item_description, unit, unit_price, project_id, project_date) VALUES (?, ?, ?, ?, ?)',
        [description, unit, unit_price, project_id, project.date]
      );

      res.status(201).json({
        id: result.lastID,
        project_id,
        description,
        unit,
        quantity,
        unit_price,
        total_cost,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create item', message: error.message });
    }
  }
);

// Update item
router.put('/:id', async (req, res) => {
  try {
    const item = await db.getQuery('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { description, unit, quantity, unit_price } = req.body;
    const updatedDescription = description || item.description;
    const updatedUnit = unit || item.unit;
    const updatedQuantity = quantity !== undefined ? quantity : item.quantity;
    const updatedUnitPrice = unit_price !== undefined ? unit_price : item.unit_price;
    const total_cost = updatedQuantity * updatedUnitPrice;

    await db.runQuery(
      'UPDATE items SET description = ?, unit = ?, quantity = ?, unit_price = ?, total_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedDescription, updatedUnit, updatedQuantity, updatedUnitPrice, total_cost, req.params.id]
    );

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item', message: error.message });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await db.getQuery('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await db.runQuery('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item', message: error.message });
  }
});

module.exports = router;
