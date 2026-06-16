const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: false,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "provider", "admin", "superAdmin"],
      default: "user",
    },

    profileImage: String,

    address: {
      country: String,
      state: String,
      district: String,
      city: String,
      pincode: String,
      fullAddress: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
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

    lastLogin: Date,

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
    },

    resetPasswordOtp: String,
    resetPasswordOtpExpiry: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
