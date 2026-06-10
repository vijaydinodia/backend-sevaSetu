const mongoose = require("mongoose");

const superAdminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    permissions: {
      type: [String],
      default: [
        "manageAdmins",
        "manageUsers",
        "manageProviders",
        "manageServices",
        "manageBookings",
        "managePayments",
        "manageSettings",
      ],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
