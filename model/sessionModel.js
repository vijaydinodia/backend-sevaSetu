const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deviceType: {
      type: String,
      enum: ["Mobile", "Tablet", "Desktop", "Unknown"],
      default: "Unknown",
    },

    os: {
      type: String,
      default: "Unknown",
    },

    browser: {
      type: String,
      default: "Unknown",
    },

    ip: {
      type: String,
      default: "Unknown",
    },

    location: {
      city: { type: String, default: "Unknown" },
      region: { type: String, default: "Unknown" },
      country: { type: String, default: "Unknown" },
    },

    loginAt: {
      type: Date,
      default: Date.now,
    },

    logoutAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Session", sessionSchema);
