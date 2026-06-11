const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const Provider = require("../model/providerModel");
const Booking = require("../model/bookingModel");
const Review = require("../model/reviewModel");
const Service = require("../model/serviceModel");
const mailSender = require("../utils/mailSender");
const providerApprovalTemplate = require("../templates/providerApprovalTemplate");

//middleware for admin only
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access this route",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//admin profile--->
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.user.id })
      .populate("user")
      .populate("category");

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//approve provider--->
exports.approveProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).populate("user");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (provider.kycStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Provider is already approved",
      });
    }

    //update kycStatus to approved
    provider.kycStatus = "approved";
    await provider.save();

    //also update user status to active
    await User.findByIdAndUpdate(provider.user._id, { status: "active" });

    //get user details to send email
    const providerUser = provider.user;

    //send approval email with credentials
    //we dont store plain password so we send a temp password notice
    await mailSender(
      providerUser.email,
      "Provider Account Approved - SevaSetu",
      providerApprovalTemplate(
        providerUser.firstName,
        providerUser.email,
        "Use your registered password to login"
      )
    );

    return res.status(200).json({
      success: true,
      message: "Provider approved successfully and email sent",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//reject provider--->
exports.rejectProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    provider.kycStatus = "rejected";
    await provider.save();

    return res.status(200).json({
      success: true,
      message: "Provider rejected",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get all providers (admin sees providers in their category)--->
exports.getAllProvider = async (req, res) => {
  try {
    //find admin to get their category
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const providers = await Provider.find().populate("user");

    return res.status(200).json({
      success: true,
      message: "All providers fetched successfully",
      data: providers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get one provider--->
exports.getOneProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).populate("user");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider fetched successfully",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//soft delete provider--->
exports.softDeleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    //also make user inactive
    await User.findByIdAndUpdate(provider.user, { status: "inactive" });

    return res.status(200).json({
      success: true,
      message: "Provider soft deleted",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//hard delete provider--->
exports.hardDeleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider permanently deleted",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//restore provider--->
exports.restoreProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    //also make user active again
    await User.findByIdAndUpdate(provider.user, { status: "active" });

    return res.status(200).json({
      success: true,
      message: "Provider restored",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//change provider status based on active or inactive--->
exports.changeProviderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive",
      });
    }

    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    //update user status
    await User.findByIdAndUpdate(provider.user, { status });

    return res.status(200).json({
      success: true,
      message: "Provider status updated",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get bookings by category (admin's category)--->
exports.getBookingsByCategory = async (req, res) => {
  try {
    //find admin and get their category
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    //find services in that category
    const services = await Service.find({ category: admin.category });

    //get service ids
    const serviceIds = services.map((s) => s._id);

    //get bookings where service is in those serviceIds
    const bookings = await Booking.find({ service: { $in: serviceIds } })
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } })
      .populate({ path: "service", populate: { path: "category" } });

    return res.status(200).json({
      success: true,
      message: "Bookings by category fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get bookings by provider (within admin's category)--->
exports.getBookingsByProvider = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.params.providerId })
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } })
      .populate({ path: "service", populate: { path: "category" } });

    return res.status(200).json({
      success: true,
      message: "Bookings by provider fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get one booking--->
exports.getOneBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } })
      .populate({ path: "service", populate: { path: "category" } });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//update booking status--->
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      "pending",
      "accepted",
      "on_the_way",
      "started",
      "completed",
      "cancelled",
      "rejected",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//soft delete booking--->
exports.softDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking soft deleted",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//hard delete booking--->
exports.hardDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking permanently deleted",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//restore booking--->
exports.restoreBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking restored",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get all reviews (admin sees reviews for providers in their category)--->
exports.getAllReview = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("booking")
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } });

    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get reviews by provider--->
exports.getReviewsByProvider = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate("booking")
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } });

    return res.status(200).json({
      success: true,
      message: "Provider reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get one review--->
exports.getOneReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("booking")
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review fetched successfully",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//soft delete review--->
exports.softDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review soft deleted",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//hard delete review--->
exports.hardDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review permanently deleted",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//restore review--->
exports.restoreReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review restored",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
