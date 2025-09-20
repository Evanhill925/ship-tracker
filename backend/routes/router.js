const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Import your schemas
const staticShipsSchema = require('./models/static-ships');
const positionReportSchema = require('./models/position-report');

const StaticShips = staticShipsSchema.Entry;
const PositionReport = positionReportSchema.Entry;

app.use(express.json({ limit: '50mb' })); // Handle large JSON payloads

// Endpoint for static ships data
app.post('/api/static-ships/bulk', async (req, res) => {
  try {
    const { data } = req.body; // Expecting { data: [...] }
    
    if (Array.isArray(data)) {
      const result = await StaticShips.insertMany(data);
      res.json({ 
        success: true, 
        inserted: result.length,
        message: `Successfully inserted ${result.length} static ships records`
      });
    } else {
      // Single record
      const newShip = new StaticShips(data);
      await newShip.save();
      res.json({ success: true, message: 'Static ship record saved' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint for position reports data
app.post('/api/position-reports/bulk', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (Array.isArray(data)) {
      const result = await PositionReport.insertMany(data);
      res.json({ 
        success: true, 
        inserted: result.length,
        message: `Successfully inserted ${result.length} position reports`
      });
    } else {
      // Single record
      const newReport = new PositionReport(data);
      await newReport.save();
      res.json({ success: true, message: 'Position report saved' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});