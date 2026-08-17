const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// GET /health
// Returns the server status, uptime, and database connection state
router.get("/", (req, res) => {
  // mongoose.connection.readyState:
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbState = mongoose.connection.readyState;

  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = dbStatusMap[dbState] || "unknown";

  // Only report healthy if DB is connected
  const isHealthy = dbState === 1;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "OK" : "SERVICE_UNAVAILABLE",
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
