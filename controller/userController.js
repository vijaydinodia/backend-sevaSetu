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

//signup--->

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      profileImage,
      role, // user, provider only (admin created by superAdmin, superAdmin created separately)
      businessName, // for provider
      experience, // for provider
      skills, // for provider
      serviceAreas, // for provider
      description, // for provider
      category, // for provider
      aadharFront, // for provider
      aadharBack, // for provider
      panCard, // for provider
      selfPhoto, // for provider
      address,
    } = req.body;

    // Block admin/superAdmin signup from public route
    if (role === "admin" || role === "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Admin and SuperAdmin accounts cannot be created via this endpoint",
      });
    }

    // For user role, password is mandatory
    if (role !== "provider" && !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // For provider, basic fields required (no password)
    if (!firstName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "firstName, email and phone are required",
      });
    }

    if (role === "provider") {
      const city = address?.city;
      if (!city) {
        return res.status(400).json({
          success: false,
          message: "City is required for provider registration.",
        });
      }
      const activeLoc = await Location.findOne({
        city: { $regex: new RegExp(`^${city.trim()}$`, "i") },
        isActive: true,
      });
      if (!activeLoc) {
        return res.status(400).json({
          success: false,
          message: `Cannot register as provider in ${city} as this location is inactive or not serviced.`,
        });
      }
      const pincode = address?.pincode;
      if (activeLoc.pincodes && activeLoc.pincodes.length > 0) {
        if (!pincode) {
          return res.status(400).json({
            success: false,
            message: "Pincode is required for provider registration in this city.",
          });
        }
        const normalizedPincode = pincode.toString().trim();
        const pinObj = activeLoc.pincodes.find(p => p.pincode === normalizedPincode);
        if (!pinObj || !pinObj.isActive) {
          return res.status(400).json({
            success: false,
            message: `Service is not active in pincode ${pincode} under ${city}.`,
          });
        }
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const alreadyEmail = await user.findOne({ email: normalizedEmail });
    if (alreadyEmail) {
      if (alreadyEmail.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered to a deleted account. Please contact support or use another email.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Email is already registered, please login",
      });
    }

    const alreadyPhone = await user.findOne({ phone: phone.trim() });
    if (alreadyPhone) {
      if (alreadyPhone.isDeleted) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already registered to a deleted account. Please contact support or use another phone number.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Phone number is already registered, please login",
      });
    }

    let hashpassword;

    if (role === "provider") {
      // Provider does NOT set a password — they receive one via email when admin approves them
      // Store a temporary unusable hash so the field is not empty
      hashpassword = await bcrypt.hash(uuid.v4(), 10);
    } else {
      // User sets their own password
      const salt = bcrypt.genSaltSync(10);
      hashpassword = bcrypt.hashSync(password, salt);
    }

    const newUser = await user.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashpassword,
      profileImage,
      role: role || "user",
      address,
    });

    // Create entry in specific role model
    if (role === "provider") {
      let categoriesArray = [];
      if (Array.isArray(category)) {
        categoriesArray = category;
      } else if (category && typeof category === "string") {
        categoriesArray = category.split(",").map(id => id.trim()).filter(Boolean);
      } else if (category) {
        categoriesArray = [category];
      }

      const mappedCategories = categoriesArray.map(cId => ({
        category: cId,
        status: "pending"
      }));

      await provider.create({
        user: newUser._id,
        category: categoriesArray[0] || null, // Point to first for compatibility
        categories: mappedCategories,
        businessName: businessName || `${firstName}'s Business`,
        experience: experience ? Number(experience) : 0,
        skills: Array.isArray(skills)
          ? skills
          : (skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : []),
        serviceAreas: Array.isArray(serviceAreas)
          ? serviceAreas
          : (serviceAreas ? serviceAreas.split(",").map((s) => s.trim()).filter(Boolean) : []),
        description: description || "",
        aadharFront: aadharFront || "",
        aadharBack: aadharBack || "",
        panCard: panCard || "",
        selfPhoto: selfPhoto || "",
      });
    }

    // Remove password from response
    newUser.password = undefined;

    return res.status(201).json({
      success: true,
      message: role === "provider"
        ? "Provider registered successfully. Await admin approval — your login credentials will be sent to your email upon approval."
        : "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//login--->

exports.login = async (req, res) => {
  try {
    console.log(">>>>>>req.body>>>>", req.body);
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExist = await user.findOne({ email: normalizedEmail }).select("+password");

    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "user not exists ,SignUp first",
      });
    }

    const match = await bcrypt.compare(password, userExist.password);
    
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    //create token
    const token = jwt.sign(
      {
        id: userExist._id,
        email: userExist.email,
        role: userExist.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    console.log(">>>>>>token>>>>>>", token);

    userExist.password = undefined;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userExist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//forgetPassword--->
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExist = await user.findOne({ email: normalizedEmail });
    if (!userExist) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiry (15 minutes from now)
    userExist.resetPasswordOtp = otp;
    userExist.resetPasswordOtpExpiry = Date.now() + 15 * 60 * 1000;
    await userExist.save();

    await mailSender(
      normalizedEmail,
      "Password Reset OTP",
      `<p>Your password reset OTP is <b>${otp}</b>.</p><p>This OTP is valid for 15 minutes.</p>`,
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verifyOtp--->
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExist = await user.findOne({ email: normalizedEmail });
    if (!userExist) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (userExist.resetPasswordOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (userExist.resetPasswordOtpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//resetPassword--->
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExist = await user.findOne({ email: normalizedEmail });
    if (!userExist) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (userExist.resetPasswordOtp !== otp || userExist.resetPasswordOtpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    const hashpassword = bcrypt.hashSync(newPassword, salt);

    // Update the password and clear out the OTP fields
    userExist.password = hashpassword;
    userExist.resetPasswordOtp = undefined;
    userExist.resetPasswordOtpExpiry = undefined;
    await userExist.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

// upload image - no login needed (used when signing up as provider)
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
