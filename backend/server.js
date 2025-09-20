const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

// Import schemas
const shipSchemas = require("./models/shipSchema");
const positionSchemas = require("./models/positionSchema");

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
  ], // React dev server ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// MongoDB Models
const StaticShips = shipSchemas.Entry;
const PositionReports = positionSchemas.Entry;

// Helper function to generate location name from coordinates
const generateLocationName = (lat, lng) => {
  // Simple region mapping - can be enhanced with reverse geocoding
  if (lat >= 1.0 && lat <= 1.6 && lng >= 103.0 && lng <= 104.5) {
    return "Singapore Waters";
  } else if (lat >= 24.0 && lat <= 46.0 && lng >= 122.0 && lng <= 146.0) {
    return "Japanese Waters";
  } else {
    return `${lat.toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  }
};

// Helper function to transform ship data to frontend format
const transformShipData = (ship, position) => {
  const timeDetected = position.received_timestamp || new Date();
  
  return {
    id: ship.UserID?.toString() || 'unknown',
    name: ship.Name || 'Unknown Vessel',
    location: {
      lat: position.Latitude || 0,
      lng: position.Longitude || 0,
      name: generateLocationName(position.Latitude || 0, position.Longitude || 0)
    },
    direction: position.TrueHeading || position.Cog || 0,
    violation: {
      type: 'monitoring',
      label: 'Monitoring',
      severity: 'info'
    },
    timeDetected: new Date(timeDetected),
    speed: position.Sog || 0, // Speed Over Ground
    course: position.Cog || 0  // Course Over Ground
  };
};

// API Routes
app.get("/api/ships/active", async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    
    // Build aggregation pipeline
    const pipeline = [
      // Join with latest positions
      {
        $lookup: {
          from: "position-reports",
          localField: "UserID",
          foreignField: "UserID",
          as: "positions"
        }
      },
      // Filter ships that have positions
      {
        $match: {
          "positions.0": { $exists: true }
        }
      },
      // Get the latest position for each ship
      {
        $addFields: {
          latestPosition: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$positions",
                  sortBy: { received_timestamp: -1 }
                }
              },
              0
            ]
          }
        }
      },
      // Filter by search term if provided
      ...(search ? [{
        $match: {
          $or: [
            { Name: { $regex: search, $options: 'i' } },
            { CallSign: { $regex: search, $options: 'i' } },
            { Destination: { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      // Pagination
      { $skip: parseInt(offset) },
      { $limit: parseInt(limit) }
    ];

    const ships = await StaticShips.aggregate(pipeline);
    
    // Transform data for frontend
    const transformedShips = ships
      .filter(ship => ship.latestPosition && ship.latestPosition.Latitude && ship.latestPosition.Longitude)
      .map(ship => transformShipData(ship, ship.latestPosition));

    // Get total count for pagination
    const totalPipeline = [
      {
        $lookup: {
          from: "position-reports",
          localField: "UserID",
          foreignField: "UserID",
          as: "positions"
        }
      },
      {
        $match: {
          "positions.0": { $exists: true }
        }
      },
      ...(search ? [{
        $match: {
          $or: [
            { Name: { $regex: search, $options: 'i' } },
            { CallSign: { $regex: search, $options: 'i' } },
            { Destination: { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      { $count: "total" }
    ];

    const totalResult = await StaticShips.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: transformedShips,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + transformedShips.length < total
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching ships:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_SHIPS_ERROR',
      message: 'Failed to fetch ship data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    // Get basic stats
    const shipCount = await StaticShips.countDocuments();
    const positionCount = await PositionReports.countDocuments();
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      collections: {
        ships: shipCount,
        positions: positionCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy hello endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Database connection
const dbOptions = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose
  .connect(process.env.DB_URI, dbOptions)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    console.log("Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Ship Tracker API Server running on port ${PORT}`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`🚢 Ships endpoint available at: http://localhost:${PORT}/api/ships/active`);
});
