const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('../database/init');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Validate import data
function validateImportData(items) {
  const errors = [];
  
  items.forEach((item, index) => {
    if (!item.description || typeof item.description !== 'string') {
      errors.push(`Row ${index + 1}: Missing or invalid item description`);
    }
    if (!item.unit || typeof item.unit !== 'string') {
      errors.push(`Row ${index + 1}: Missing or invalid unit`);
    }
    if (isNaN(item.quantity) || item.quantity < 0) {
      errors.push(`Row ${index + 1}: Invalid quantity`);
    }
    if (isNaN(item.unit_price) || item.unit_price < 0) {
      errors.push(`Row ${index + 1}: Invalid unit price`);
    }
  });
  
  return errors;
}

// Parse Excel file
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Normalize column names (handle different case variations)
    const normalizedData = data.map(row => ({
      description: row['Item description'] || row['item description'] || row['Description'] || row['description'] || '',
      unit: row['Unit'] || row['unit'] || '',
      quantity: parseFloat(row['Quantity'] || row['quantity'] || 0),
      unit_price: parseFloat(row['Unit Price'] || row['unit price'] || row['Unit_Price'] || row['unit_price'] || 0),
      total_cost: parseFloat(row['Total Cost'] || row['total cost'] || row['Total_Cost'] || row['total_cost'] || 0)
    }));

    // Validate data
    const validationErrors = validateImportData(normalizedData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.json({
      success: true,
      itemCount: normalizedData.length,
      items: normalizedData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse file', message: error.message });
  }
});

// Import data into database
router.post('/execute', async (req, res) => {
  try {
    const { projectId, items } = req.body;

    if (!projectId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Verify project exists
    const project = await db.getQuery('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate items
    const validationErrors = validateImportData(items);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    let insertedCount = 0;
    
    // Insert items
    for (const item of items) {
      const total_cost = item.quantity * item.unit_price;
      
      await db.runQuery(
        'INSERT INTO items (project_id, description, unit, quantity, unit_price, total_cost) VALUES (?, ?, ?, ?, ?, ?)',
        [projectId, item.description.trim(), item.unit.trim(), item.quantity, item.unit_price, total_cost]
      );

      // Record in price history
      await db.runQuery(
        'INSERT INTO price_history (item_description, unit, unit_price, project_id, project_date) VALUES (?, ?, ?, ?, ?)',
        [item.description.trim(), item.unit.trim(), item.unit_price, projectId, project.date]
      );

      insertedCount++;
    }

    res.json({
      success: true,
      message: `${insertedCount} items imported successfully`,
      insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Import failed', message: error.message });
  }
});

// Download template
router.get('/template', (req, res) => {
  try {
    const templateData = [
      {
        'Item description': 'Concrete Grade A',
        'Unit': 'm³',
        'Quantity': 100,
        'Unit Price': 250.00,
        'Total Cost': 25000.00
      },
      {
        'Item description': 'Steel Reinforcement',
        'Unit': 'ton',
        'Quantity': 5,
        'Unit Price': 1500.00,
        'Total Cost': 7500.00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOQ');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=BOQ_Template.xlsx');
    
    XLSX.write(workbook, { out: res });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template', message: error.message });
  }
});

module.exports = router;
