const user = require("../model/userModel");
const provider = require("../model/providerModel");
const admin = require("../model/adminModel");
const superAdmin = require("../model/superAdminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const mailSender = require("../utils/mailSender");
const cloudinary = require("../utils/cloudnairy");
const Category = require("../model/categoryModel");
const Service = require("../model/serviceModel");
const ProviderService = require("../model/providerServicModel");
const Booking = require("../model/bookingModel");
const Location = require("../model/locationModel");
const Review = require("../model/reviewModel");


//editProfile--->
exports.editProfile = async (req, res) => {
  try {
    // Depending on your auth middleware setup, the user ID should come from the verified token
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID is missing." });
    }

    const { firstName, lastName, phone, profileImage, address } = req.body;

    // Build a targeted update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (address) updateData.address = address;

    const updatedUser = await user.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// upload image - user must be logged in
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const result = await cloudinary.uploadImages([req.file]);

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Image upload failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: result[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// upload image 
exports.uploadPublic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const result = await cloudinary.uploadImages([req.file]);

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Image upload failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: result[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all active categories - visible to everyone
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false, isActive: true });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all services offered by providers - visible to everyone
exports.getServicesOfferedByProviders = async (req, res) => {
  try {
    const services = await ProviderService.find({ isAvailable: true })
      .populate({
        path: "provider",
        match: { kycStatus: "approved", isDeleted: false },
        populate: { path: "user", select: "firstName lastName email phone profileImage" },
      })
      .populate({
        path: "service",
        match: { isActive: true },
        populate: { path: "category", match: { isActive: true, isDeleted: false } },
      });

    // filter out items where provider, service or category is not found/active
    const activeServices = services.filter(
      (item) => item.provider && item.provider.user && item.service && item.service.category
    );

    return res.status(200).json({
      success: true,
      message: "Services offered by providers fetched successfully",
      data: activeServices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// create a new booking for a service - login required
exports.createBooking = async (req, res) => {
  try {
    const {
      providerServiceId,
      address,
      city,
      state,
      pincode,
      bookingDate,
      bookingTime,
      notes,
    } = req.body;

    if (!providerServiceId || !address || !city || !state || !pincode || !bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: "All fields (providerServiceId, address, city, state, pincode, bookingDate, bookingTime) are required",
      });
    }

    const activeLocation = await Location.findOne({
      city: { $regex: new RegExp(`^${city.trim()}$`, "i") },
      isActive: true,
    });
    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: `Bookings are not accepted in ${city} as this location is inactive or not serviced.`,
      });
    }

    if (activeLocation.pincodes && activeLocation.pincodes.length > 0) {
      const normalizedPincode = pincode.toString().trim();
      const pinObj = activeLocation.pincodes.find(p => p.pincode === normalizedPincode);
      if (!pinObj || !pinObj.isActive) {
        return res.status(400).json({
          success: false,
          message: `Service is not available in pincode ${pincode} under ${city}.`,
        });
      }
    }

    const provService = await ProviderService.findById(providerServiceId)
      .populate("provider")
      .populate("service");

    if (!provService || !provService.isAvailable) {
      return res.status(404).json({
        success: false,
        message: "Selected service is not available or not found",
      });
    }

    if (!provService.provider || provService.provider.kycStatus !== "approved" || provService.provider.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Provider is currently not active or not verified",
      });
    }

    // Generate unique BK number
    const bookingNumber = "BK-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);

    const booking = await Booking.create({
      bookingNumber,
      customer: req.user.id,
      provider: provService.provider._id,
      service: provService.service._id,
      address,
      city,
      state,
      pincode,
      bookingDate: new Date(bookingDate),
      bookingTime,
      amount: provService.price || provService.service.basePrice,
      notes: notes || "",
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Service booked successfully!",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all bookings for the logged-in customer - login required
exports.getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id, isDeleted: false })
      .populate({ path: "provider", populate: { path: "user", select: "firstName lastName email phone" } })
      .populate({ path: "service", populate: { path: "category" } })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// add a review for a completed service - login required
exports.addReview = async (req, res) => {
  try {
    const { bookingId, rating, review } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: "Booking ID and rating are required." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Must belong to the logged-in user
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only review your own bookings." });
    }

    // Must be completed
    if (booking.status !== "completed") {
      return res.status(400).json({ success: false, message: "You can only review completed services." });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId, customer: req.user.id, isDeleted: false });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this booking." });
    }

    // Create review
    const newReview = await Review.create({
      booking: bookingId,
      customer: req.user.id,
      provider: booking.provider,
      rating: Number(rating),
      review: review || "",
    });

    // Update provider average rating
    const allReviews = await Review.find({ provider: booking.provider, isDeleted: false });
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      await provider.findByIdAndUpdate(booking.provider, { averageRating: avg.toFixed(1) });
    }

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      data: newReview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
