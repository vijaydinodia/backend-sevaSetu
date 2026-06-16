const mongoose = require("mongoose");
const { runWithTransaction } = require("../utils/dbTransaction");

const providerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    categories: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
      }
    ],

    businessName: {
      type: String,
      required: true,
    },

    aadharFront: {
      type: String,
      default: "",
    },

    aadharBack: {
      type: String,
      default: "",
    },

    panCard: {
      type: String,
      default: "",
    },

    selfPhoto: {
      type: String,
      default: "",
    },

    experience: {
      type: Number,
      default: 0,
    },

    skills: [String],

    serviceAreas: [String],

    description: String,

    averageRating: {
      type: Number,
      default: 0,
    },

    totalBookings: {
      type: Number,
      default: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);



module.exports = mongoose.model("Provider", providerSchema);
