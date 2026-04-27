const express = require('express');
const db = require('../database/init');

const router = express.Router();

// Search items by description with autocomplete
router.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const results = await db.allQuery(
      `SELECT DISTINCT description FROM items WHERE description LIKE ? LIMIT 10`,
      [`%${q}%`]
    );

    res.json(results.map(r => r.description));
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Search for item with price history
router.get('/item', async (req, res) => {
  try {
    const { description } = req.query;
    if (!description) {
      return res.status(400).json({ error: 'Item description is required' });
    }

    const priceHistory = await db.allQuery(
      `SELECT 
        ph.id,
        ph.item_description,
        ph.unit,
        ph.unit_price,
        ph.project_id,
        ph.project_date,
        p.name as project_name
      FROM price_history ph
      JOIN projects p ON ph.project_id = p.id
      WHERE ph.item_description LIKE ?
      ORDER BY p.date DESC`,
      [`%${description}%`]
    );

    if (priceHistory.length === 0) {
      return res.json({
        description,
        results: [],
        statistics: null
      });
    }

    // Calculate statistics
    const prices = priceHistory.map(h => h.unit_price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    res.json({
      description,
      results: priceHistory,
      statistics: {
        average_price: parseFloat(avgPrice.toFixed(2)),
        min_price: minPrice,
        max_price: maxPrice,
        occurrences: priceHistory.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Get all unique item descriptions
router.get('/all-items', async (req, res) => {
  try {
    const items = await db.allQuery(
      `SELECT DISTINCT description, unit FROM items ORDER BY description ASC`
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

module.exports = router;
