const User = require("../model/userModel");
const Provider = require("../model/providerModel");
const Location = require("../model/locationModel");
const jwt = require("jsonwebtoken");

// Helper to generate local JWT for the user (existing RBAC format)
const generateLocalToken = (userObj) => {
  return jwt.sign(
    {
      id: userObj._id,
      email: userObj.email,
      role: userObj.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

// Common sync/linking logic for Firebase authentication
const syncFirebaseUser = async (firebaseUser, providerType, roleInput, additionalData) => {
  const { uid, email, name, picture } = firebaseUser;
  
  if (!email) {
    throw new Error("Email is required for SevaSetu accounts, but it was not provided by Firebase.");
  }
  const normalizedEmail = email.trim().toLowerCase();

  // Find if user already exists in MongoDB by email
  let existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.isDeleted) {
      throw new Error("Email is associated with a deleted account. Please contact support.");
    }

    // Link Firebase details if not present, or update them
    let isUpdated = false;
    if (!existingUser.firebaseUid) {
      existingUser.firebaseUid = uid;
      isUpdated = true;
    }
    // Update authProvider to keep track of the last used provider (or if it was local)
    if (existingUser.authProvider !== providerType) {
      existingUser.authProvider = providerType;
      isUpdated = true;
    }
    // Sync profile image if empty in MongoDB
    if (!existingUser.profileImage && picture) {
      existingUser.profileImage = picture;
      isUpdated = true;
    }

    if (isUpdated) {
      await existingUser.save();
    }

    return existingUser;
  } else {
    // Create new user in MongoDB
    let firstName = "";
    let lastName = "";
    if (name) {
      const parts = name.split(" ");
      firstName = parts[0] || "User";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      firstName = normalizedEmail.split("@")[0] || "User";
    }

    const role = roleInput || "user";

    // Handle provider check (like city validity) if role is provider
    if (role === "provider") {
      const city = additionalData?.address?.city;
      if (!city) {
        throw new Error("City is required for provider registration.");
      }
      const activeLoc = await Location.findOne({
        city: { $regex: new RegExp(`^${city.trim()}$`, "i") },
        isActive: true,
      });
      if (!activeLoc) {
        throw new Error(`Cannot register as provider in ${city} as this location is inactive or not serviced.`);
      }
    }

    const newUser = await User.create({
      firstName: additionalData?.firstName || firstName,
      lastName: additionalData?.lastName || lastName,
      email: normalizedEmail,
      phone: additionalData?.phone || undefined, // Sparse index allows missing phones
      firebaseUid: uid,
      authProvider: providerType,
      role: role,
      profileImage: additionalData?.profileImage || picture || "",
      address: additionalData?.address || {},
      isVerified: true, // Firebase manages/verifies email
    });

    // If role is provider, construct corresponding Provider model record
    if (role === "provider") {
      const {
        businessName,
        experience,
        skills,
        serviceAreas,
        description,
        category,
        aadharFront,
        aadharBack,
        panCard,
        selfPhoto,
      } = additionalData || {};

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

      await Provider.create({
        user: newUser._id,
        category: categoriesArray[0] || null, 
        categories: mappedCategories,
        businessName: businessName || `${newUser.firstName}'s Business`,
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

    return newUser;
  }
};

// firebaseSignup endpoint
exports.firebaseSignup = async (req, res) => {
  try {
    const { role, firstName, lastName, phone, address, ...rest } = req.body;

    // Block admin/superAdmin signup from public routes
    if (role === "admin" || role === "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Admin and SuperAdmin accounts cannot be created via this endpoint",
      });
    }

    const syncedUser = await syncFirebaseUser(
      req.firebaseUser,
      "firebase",
      role,
      { firstName, lastName, phone, address, ...rest }
    );

    const token = generateLocalToken(syncedUser);

    return res.status(200).json({
      success: true,
      message: "Firebase registration and sync successful",
      token,
      user: syncedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// firebaseLogin endpoint
exports.firebaseLogin = async (req, res) => {
  try {
    const syncedUser = await syncFirebaseUser(
      req.firebaseUser,
      "firebase",
      null,
      req.body
    );

    const token = generateLocalToken(syncedUser);

    return res.status(200).json({
      success: true,
      message: "Firebase login and sync successful",
      token,
      user: syncedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// firebaseGoogle endpoint
exports.firebaseGoogle = async (req, res) => {
  try {
    const { role } = req.body;

    // Block admin/superAdmin signup
    if (role === "admin" || role === "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Admin and SuperAdmin accounts cannot be created via this endpoint",
      });
    }

    const syncedUser = await syncFirebaseUser(
      req.firebaseUser,
      "google",
      role,
      req.body
    );

    const token = generateLocalToken(syncedUser);

    return res.status(200).json({
      success: true,
      message: "Google login and sync successful",
      token,
      user: syncedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
