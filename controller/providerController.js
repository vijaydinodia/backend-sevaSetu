const Provider = require("../model/providerModel");
const User = require("../model/userModel");
const Booking = require("../model/bookingModel");
const Review = require("../model/reviewModel");
const Category = require("../model/categoryModel");
const Service = require("../model/serviceModel");
const ProviderService = require("../model/providerServicModel");
const Location = require("../model/locationModel");

// Get provider profile based on logged-in user
exports.getProviderProfile = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id })
      .populate("user")
      .populate("category")
      .populate("categories.category");
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider profile fetched successfully",
      data: providerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update provider profile (both business details and user details)
exports.updateProviderProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      profileImage,
      address,
      businessName,
      experience,
      skills,
      serviceAreas,
      description,
      category,
    } = req.body;

    // 1. Find provider
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // 2. Update user info
    const userUpdate = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (phone) userUpdate.phone = phone;
    if (profileImage) userUpdate.profileImage = profileImage;
    if (address) {
      if (address.city) {
        const activeLocation = await Location.findOne({
          city: { $regex: new RegExp(`^${address.city.trim()}$`, "i") },
          isActive: true,
        });
        if (!activeLocation) {
          return res.status(400).json({
            success: false,
            message: `Cannot update address to ${address.city} as this location is currently inactive or not serviced.`,
          });
        }
        if (activeLocation.pincodes && activeLocation.pincodes.length > 0) {
          const pincode = address.pincode;
          if (!pincode) {
            return res.status(400).json({
              success: false,
              message: "Pincode is required for provider registration in this city.",
            });
          }
          const normalizedPincode = pincode.toString().trim();
          const pinObj = activeLocation.pincodes.find(p => p.pincode === normalizedPincode);
          if (!pinObj || !pinObj.isActive) {
            return res.status(400).json({
              success: false,
              message: `Service is not active in pincode ${pincode} under ${address.city}.`,
            });
          }
        }
      }
      userUpdate.address = address;
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(providerProfile.user, { $set: userUpdate });
    }

    // 3. Update provider business info
    if (businessName) providerProfile.businessName = businessName;
    if (category) providerProfile.category = category;
    if (experience !== undefined) providerProfile.experience = Number(experience);
    if (description !== undefined) providerProfile.description = description;

    if (skills) {
      providerProfile.skills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (serviceAreas) {
      providerProfile.serviceAreas = Array.isArray(serviceAreas)
        ? serviceAreas
        : serviceAreas.split(",").map((s) => s.trim()).filter(Boolean);
    }

    await providerProfile.save();

    const updatedProfile = await Provider.findById(providerProfile._id)
      .populate("user")
      .populate("category")
      .populate("categories.category");

    return res.status(200).json({
      success: true,
      message: "Provider profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get bookings assigned to provider
exports.getProviderBookings = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const bookings = await Booking.find({
      provider: providerProfile._id,
      isDeleted: false,
    })
      .populate("customer")
      .populate({ path: "service", populate: { path: "category" } })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Provider bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update status of a booking assigned to provider
exports.updateProviderBookingStatus = async (req, res) => {
  try {
    const { status, otp, paymentMethod } = req.body;
    const bookingId = req.params.id;

    const allowedStatus = ["accepted", "on_the_way", "started", "completed", "rejected"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status update for provider",
      });
    }

    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      provider: providerProfile._id,
      isDeleted: false,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not assigned to you",
      });
    }

    if (["completed", "rejected", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status} and cannot be changed.`,
      });
    }

    const oldStatus = booking.status;
    booking.status = status;

    if (status === "started") {
      if (!otp) {
        return res.status(400).json({ success: false, message: "OTP is required to start the job" });
      }
      if (otp !== booking.startOtp) {
        return res.status(400).json({ success: false, message: "Invalid Start OTP" });
      }
    }

    if (status === "completed") {
      if (!otp) {
        return res.status(400).json({ success: false, message: "OTP is required to complete the job" });
      }
      if (otp !== booking.endOtp) {
        return res.status(400).json({ success: false, message: "Invalid End OTP" });
      }
      
      booking.completedAt = new Date();
      
      // If booking was not previously completed, update provider stats
      if (oldStatus !== "completed") {
        providerProfile.totalBookings += 1;
        providerProfile.totalEarnings += booking.amount;
        await providerProfile.save();
      }
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews received by provider
exports.getProviderReviews = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const reviews = await Review.find({
      provider: providerProfile._id,
      isDeleted: false,
    })
      .populate("customer")
      .populate("booking")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Provider reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all active categories for provider
exports.getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: { $ne: true } });
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get list of standard services across all active categories that the provider hasn't added yet
exports.getAvailableServices = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // Find all active services across all categories, populating category info
    const services = await Service.find({ isActive: true }).populate("category");

    // Filter services to only include those whose category is active and not deleted
    const activeCategoryServices = services.filter(
      (s) => s.category && s.category.isActive && !s.category.isDeleted
    );

    // find what services the provider already offers
    const myServices = await ProviderService.find({ provider: providerProfile._id });
    const myServiceIds = myServices.map((ps) => ps.service.toString());

    // filter to show only services NOT yet added
    const availableServices = activeCategoryServices.filter((s) => !myServiceIds.includes(s._id.toString()));

    return res.status(200).json({
      success: true,
      message: "Available services fetched successfully",
      data: availableServices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get services currently offered by the logged-in provider
exports.getMyServices = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const myServices = await ProviderService.find({ provider: providerProfile._id })
      .populate({
        path: "service",
        populate: { path: "category" }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "My services fetched successfully",
      data: myServices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add a custom service to the provider's offerings
exports.addProviderService = async (req, res) => {
  try {
    const { serviceName, description, category, price, image } = req.body;

    if (!serviceName || !description || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Service name, description, category, and price are required",
      });
    }

    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const trimmedName = serviceName.trim();
    const trimmedDesc = description.trim();
    const categoryId = category;

    // Verify provider is approved for this category
    const catApproval = providerProfile.categories.find(
      (c) => c.category.toString() === categoryId.toString() && c.status === "approved"
    );

    if (!catApproval) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to offer services in this category. Your application for this category must be approved by the assigned admin first.",
      });
    }

    // Verify category exists and is active
    const categoryObj = await Category.findOne({ _id: categoryId, isActive: true, isDeleted: false });
    if (!categoryObj) {
      return res.status(404).json({
        success: false,
        message: "Selected category not found or is inactive",
      });
    }

    // Check case-insensitive duplicate in the same category
    let service = await Service.findOne({
      serviceName: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      category: categoryId,
      isActive: true,
    });

    if (!service) {
      service = await Service.create({
        category: categoryId,
        serviceName: trimmedName,
        description: trimmedDesc,
        basePrice: Number(price),
        estimatedDuration: 60, // default
        image: image || "",
        isActive: true,
        createdBy: req.user.id,
      });
    } else if (image && (!service.image || service.image.includes('placehold.co'))) {
        // If the service already exists but has no image, update it
        service.image = image;
        await service.save();
    }

    // Check if provider already has this service mapped
    const existing = await ProviderService.findOne({
      provider: providerProfile._id,
      service: service._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already added this service to your list",
      });
    }

    const newProviderService = await ProviderService.create({
      provider: providerProfile._id,
      service: service._id,
      price: Number(price),
      isAvailable: true,
    });

    // Populate service and category to send back
    const populated = await ProviderService.findById(newProviderService._id).populate({
      path: "service",
      populate: { path: "category" }
    });

    return res.status(201).json({
      success: true,
      message: "Service added successfully!",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a service from the provider's list of offerings
exports.removeProviderService = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const deleted = await ProviderService.findOneAndDelete({
      _id: req.params.id,
      provider: providerProfile._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Service not found in your offerings list",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service removed from your offerings successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Apply for a new category 
exports.applyForCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // Check if category exists and is active
    const categoryObj = await Category.findOne({ _id: categoryId, isActive: true, isDeleted: false });
    if (!categoryObj) {
      return res.status(404).json({
        success: false,
        message: "Selected category not found or is inactive",
      });
    }

    // Check if already applied
    const existing = providerProfile.categories.find(
      (c) => c.category.toString() === categoryId.toString()
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for this category. Current status: ${existing.status}`,
      });
    }

    // Add category application
    providerProfile.categories.push({
      category: categoryId,
      status: "pending",
    });

    await providerProfile.save();

    return res.status(200).json({
      success: true,
      message: "Application for category submitted successfully. Awaiting category admin approval.",
      data: providerProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get provider dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ success: false, message: "Provider profile not found" });
    }

    const bookings = await Booking.find({
      provider: providerProfile._id,
      isDeleted: false,
    }).populate("customer").populate("service");

    const totalBookingsCount = bookings.length;
    const todayBookingsCount = bookings.filter(b => new Date(b.bookingDate).toDateString() === new Date().toDateString()).length;
    
    // Calculate unique customers
    const customersSet = new Set();
    let earningsSum = 0;
    
    bookings.forEach(b => {
      if (b.customer) customersSet.add(b.customer._id.toString());
      if (b.status === 'completed') {
        earningsSum += (b.amount || 0);
      }
    });
    
    const customersCount = customersSet.size;
    const ratingScore = providerProfile.averageRating || '0.0';

    // Chart Data (last 6 months)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        revenue: 0,
        bookingsCount: 0
      });
    }

    bookings.forEach(b => {
      const bDate = new Date(b.bookingDate || b.createdAt);
      months.forEach(m => {
        if (bDate.getFullYear() === m.year && bDate.getMonth() === m.monthIndex) {
          m.bookingsCount++;
          if (b.status === "completed") {
            m.revenue += (b.amount || 0);
          }
        }
      });
    });

    const maxRev = Math.max(...months.map(m => m.revenue), 1000);
    const maxBook = Math.max(...months.map(m => m.bookingsCount), 5);
    const chartPoints = months.map((m, idx) => {
      const x = 45 + idx * 80;
      const yRev = 170 - (m.revenue / maxRev) * 140;
      const yBook = 170 - (m.bookingsCount / maxBook) * 140;
      return { x, yRev, yBook, monthName: m.name, revenue: m.revenue, bookingsCount: m.bookingsCount };
    });

    // Dynamic Notifications
    const alerts = [];
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate));
    
    sortedBookings.slice(0, 5).forEach(b => {
      const custName = b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : 'Guest User';
      const servName = b.service?.serviceName || b.service?.title || 'service';
      const timeStr = new Date(b.createdAt || b.bookingDate).toLocaleDateString();
      
      if (b.status === 'pending') {
        alerts.push({ text: `New service booking request received from ${custName} for ${servName}.`, time: `Slot: ${b.bookingTime}`, type: 'new' });
      } else if (b.status === 'completed') {
        alerts.push({ text: `Service request for ${servName} completed successfully for ${custName}.`, time: `Date: ${timeStr}, Amount: ₹${b.amount}`, type: 'payment' });
      } else if (b.status === 'cancelled') {
        alerts.push({ text: `Service request for ${servName} was cancelled.`, time: `Slot: ${b.bookingTime}`, type: 'reschedule' });
      } else {
        alerts.push({ text: `Booking request for ${servName} is in progress (${b.status?.replace(/_/g, ' ')}).`, time: `Slot: ${b.bookingTime}`, type: 'reschedule' });
      }
    });
    
    alerts.push({ text: "Congratulations! Your partner account is active and verified on SevaSetu.", time: "Welcome Alert", type: "kyc" });

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: {
        totalBookingsCount,
        todayBookingsCount,
        customersCount,
        earningsSum,
        ratingScore,
        chartData: chartPoints,
        dynamicAlerts: alerts
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
