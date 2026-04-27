const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const db = require('./database/init');
const projectRoutes = require('./routes/projects');
const itemRoutes = require('./routes/items');
const importRoutes = require('./routes/import');
const searchRoutes = require('./routes/search');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
db.initializeDatabase();

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/import', importRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Alimator server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
