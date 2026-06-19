const mongoose = require("mongoose");
const { runWithTransaction } = require("../utils/dbTransaction");

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: true,
    },

    customer: {
      
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    bookingTime: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    startOtp: {
      type: String,
    },

    endOtp: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "on_the_way",
        "started",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "debit", "wallet", ""],
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    paymentDate: {
      type: Date,
      default: null,
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

// Cascade deletions and reference cleanup
bookingSchema.pre("findOneAndDelete", async function (next) {
  try {
    const bookingId = this.getQuery()._id;
    const options = this.getOptions();
    if (options && options.cascade === false) {
      return next();
    }

    if (bookingId) {
      await runWithTransaction(async (session) => {
        // Delete Complaints
        const Complaint = mongoose.model("Complaint");
        await Complaint.deleteMany({ booking: bookingId }, { session });

        // Delete Reviews
        const Review = mongoose.model("Review");
        await Review.deleteMany({ booking: bookingId }, { session });
      });
    }
  } catch (err) {
    console.error("Error in Booking pre-findOneAndDelete middleware:", err);
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
