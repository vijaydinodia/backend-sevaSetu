const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const Provider = require("../model/providerModel");
const Booking = require("../model/bookingModel");
const Review = require("../model/reviewModel");
const Service = require("../model/serviceModel");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
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

//approve provider category application
exports.approveProvider = async (req, res) => {
  try {
    // find the admin and their assigned category
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const provider = await Provider.findById(req.params.id).populate("user");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Admin can only approve provider for their assigned category
    const catApproval = provider.categories.find(
      (c) => c.category.toString() === admin.category.toString()
    );

    if (!catApproval) {
      return res.status(403).json({
        success: false,
        message: "This provider did not apply for your assigned category",
      });
    }

    if (catApproval.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Provider is already approved for this category",
      });
    }

    // Mark category as approved
    catApproval.status = "approved";

    // Check if provider was already approved in the past or user is active
    const wasAlreadyApproved = provider.kycStatus === "approved" || (provider.user && provider.user.status === "active");

    if (wasAlreadyApproved) {
      provider.kycStatus = "approved";
      await provider.save();

      // Make sure user status is active
      if (provider.user && provider.user.status !== "active") {
        await User.findByIdAndUpdate(provider.user._id, { status: "active" });
      }

      // Send category-specific approval email
      await mailSender(
        provider.user.email,
        "New Service Category Approved - SevaSetu",
        `<p>Hello ${provider.user.firstName},</p>
         <p>Your application to offer services under your newly requested category has been approved by the assigned administrator!</p>
         <p>You can now add services under this category from your dashboard.</p>
         <p>Best regards,<br/>The SevaSetu Team</p>`
      );

      return res.status(200).json({
        success: true,
        message: "Category application approved successfully",
        data: provider,
      });
    }

    // Check if provider already has at least one other approved category
    const hasAlreadyApprovedCategory = provider.categories.some(
      (c) => c.category.toString() !== admin.category.toString() && c.status === "approved"
    );

    if (hasAlreadyApprovedCategory) {
      await provider.save();

      // Send category-specific approval email
      await mailSender(
        provider.user.email,
        "New Service Category Approved - SevaSetu",
        `<p>Hello ${provider.user.firstName},</p>
         <p>Your application to offer services under your newly requested category has been approved by the assigned administrator!</p>
         <p>You can now add services under this category from your dashboard.</p>
         <p>Best regards,<br/>The SevaSetu Team</p>`
      );

      return res.status(200).json({
        success: true,
        message: "Category application approved successfully",
        data: provider,
      });
    }

    // Otherwise, this is their first approved category. Perform full account activation.
    provider.kycStatus = "approved";
    await provider.save();

    const providerUser = provider.user;
    const plainPassword = uuidv4();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await User.findByIdAndUpdate(providerUser._id, {
      status: "active",
      password: hashedPassword,
    });

    await mailSender(
      providerUser.email,
      "Provider Account Approved - SevaSetu",
      providerApprovalTemplate(
        providerUser.firstName,
        providerUser.email,
        plainPassword
      )
    );

    return res.status(200).json({
      success: true,
      message: "Provider approved successfully and login credentials sent to email",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//reject provider category application
exports.rejectProvider = async (req, res) => {
  try {
    // find the admin and their assigned category
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const provider = await Provider.findById(req.params.id).populate("user");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Admin can only reject provider for their assigned category
    const catApproval = provider.categories.find(
      (c) => c.category.toString() === admin.category.toString()
    );

    if (!catApproval) {
      return res.status(403).json({
        success: false,
        message: "This provider did not apply for your assigned category",
      });
    }

    catApproval.status = "rejected";

    // Check if they have any remaining approved or pending categories
    const hasActiveOrPending = provider.categories.some(
      (c) => c.status === "approved" || c.status === "pending"
    );

    if (!hasActiveOrPending) {
      provider.kycStatus = "rejected";
      await User.findByIdAndUpdate(provider.user._id, { status: "inactive" });
    }

    await provider.save();

    // send rejection email
    await mailSender(
      provider.user.email,
      "Provider Category Verification Status - SevaSetu",
      `<p>Hello ${provider.user.firstName},</p>
       <p>We regret to inform you that your request to join the category has been rejected during verification by the assigned administrator.</p>
       <p>If you have other approved categories, you can continue to service them. Otherwise, your account status is set to inactive.</p>
       <p>Best regards,<br/>The SevaSetu Team</p>`
    );

    return res.status(200).json({
      success: true,
      message: "Category application rejected and notification email sent",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get pending provider applications - admin reviews these before approving or rejecting
exports.getPendingProviders = async (req, res) => {
  try {
    // find the admin and their assigned category
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // get all providers that have the admin's category pending in their categories list
    const pendingProviders = await Provider.find({
      categories: {
        $elemMatch: {
          category: admin.category,
          status: "pending"
        }
      },
      isDeleted: false,
    })
      .populate("user", "firstName lastName email phone profileImage address createdAt")
      .populate("category", "name description")
      .populate("categories.category", "name description");

    return res.status(200).json({
      success: true,
      message: "Pending provider applications fetched successfully",
      count: pendingProviders.length,
      data: pendingProviders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get one provider application in full detail - admin reviews this before approving or rejecting
exports.getOneApplication = async (req, res) => {
  try {
    // find the admin and their assigned category
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const provider = await Provider.findById(req.params.id)
      .populate("user", "firstName lastName email phone profileImage address createdAt")
      .populate("category", "name description")
      .populate("categories.category", "name description");

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider application not found",
      });
    }

    // admin can only view applications in their own category or if they applied for this category
    const catApproval = provider.categories && provider.categories.find(
      (c) => c.category && c.category._id.toString() === admin.category.toString()
    );

    if (!catApproval && String(provider.category?._id || provider.category) !== String(admin.category)) {
      return res.status(403).json({
        success: false,
        message: "You can only view applications in your assigned category",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider application fetched successfully",
      data: {
        applicationId: provider._id,
        kycStatus: catApproval ? catApproval.status : provider.kycStatus,
        submittedAt: provider.createdAt,
        personalInfo: {
          firstName: provider.user.firstName,
          lastName: provider.user.lastName,
          email: provider.user.email,
          phone: provider.user.phone,
          profileImage: provider.user.profileImage,
          address: provider.user.address,
        },
        businessInfo: {
          businessName: provider.businessName,
          category: provider.category,
          categories: provider.categories,
          experience: provider.experience,
          skills: provider.skills,
          serviceAreas: provider.serviceAreas,
          description: provider.description,
        },
        documents: {
          aadharFront: provider.aadharFront,
          aadharBack: provider.aadharBack,
          panCard: provider.panCard,
          selfPhoto: provider.selfPhoto,
        },
      },
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

    const providers = await Provider.find({
      $or: [
        { category: admin.category },
        {
          categories: {
            $elemMatch: {
              category: admin.category,
              status: "approved"
            }
          }
        }
      ]
    })
      .populate("user")
      .populate("category");

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

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (["completed", "rejected", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status} and cannot be changed.`,
      });
    }

    booking.status = status;
    if (status === "completed") {
      booking.completedAt = new Date();
    }
    await booking.save();

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
