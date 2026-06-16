const mongoose = require("mongoose");
const { runWithTransaction } = require("../utils/dbTransaction");

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    permissions: [
      {
        type: String,
        enum: [
          "manageUsers",
          "manageProviders",
          "manageBookings",
          "manageServices",
          "manageComplaints",
        ],
      },
    ],

    department: {
      type: String,
      enum: ["Operations", "Support", "Technical"],
      default: "Operations",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);



module.exports = mongoose.model("Admin", adminSchema);
