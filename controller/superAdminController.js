const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const Provider = require("../model/providerModel");
const Category = require("../model/categoryModel");
const Booking = require("../model/bookingModel");
const Review = require("../model/reviewModel");
const SuperAdmin = require("../model/superAdminModel");
const { uploadImages } = require("../utils/cloudnairy");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const Location = require("../model/locationModel");
const adminCredentialsTemplate = require("../templates/adminCredentialsTemplate")
const mailSender = require("../utils/mailSender");

//middleware for super admin only
exports.isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access this route",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//super admin profile--->
exports.getSuperAdminProfile = async (req, res) => {
  try {
    const profile = await SuperAdmin.findOne({ user: req.user.id }).populate(
      "user",
    );

    return res.status(200).json({
      success: true,
      message: "Super admin profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.editSuperAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage, address } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (address) updateData.address = address;

    const updatedProfile = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Super admin profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//super admin management--->
exports.createSuperAdmin = async (req, res) => {
  try {
    const { user, permissions } = req.body;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    const userExist = await User.findById(user);

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadySuperAdmin = await SuperAdmin.findOne({ user });

    if (alreadySuperAdmin) {
      return res.status(400).json({
        success: false,
        message: "Super admin already exists",
      });
    }

    const newSuperAdmin = await SuperAdmin.create({
      user,
      permissions,
    });

    await User.findByIdAndUpdate(user, { role: "superAdmin" });

    return res.status(201).json({
      success: true,
      message: "Super admin created successfully",
      data: newSuperAdmin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSuperAdmin = async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find().populate("user");

    return res.status(200).json({
      success: true,
      message: "All super admins fetched successfully",
      data: superAdmins,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOneSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findById(req.params.id).populate(
      "user",
    );

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Super admin fetched successfully",
      data: superAdmin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSuperAdmin = async (req, res) => {
  try {
    const { permissions } = req.body;
    const updateData = {};

    if (permissions) updateData.permissions = permissions;

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("user");

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Super admin updated successfully",
      data: superAdmin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findByIdAndDelete(req.params.id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    await User.findByIdAndUpdate(superAdmin.user, { role: "user" });

    return res.status(200).json({
      success: true,
      message: "Super admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const uploadedImages = await uploadImages([req.file]);

    if (!uploadedImages.length) {
      return res.status(400).json({
        success: false,
        message: "Image upload failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: uploadedImages[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//category--->
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Category image is required",
      });
    }

    const normalizedName = name.trim().toLowerCase();

    const alreadyCategory = await Category.findOne({ name: normalizedName });

    if (alreadyCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCategory = await Category.create({
      name: normalizedName,
      description,
      image,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find().populate("createdBy updatedBy");

    return res.status(200).json({
      success: true,
      message: "All categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOneCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "createdBy updatedBy",
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;

    const updateData = { updatedBy: req.user.id };

    if (name) {
      const normalizedName = name.trim().toLowerCase();
      // Check if another category already has this name
      const duplicate = await Category.findOne({
        name: normalizedName,
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
      updateData.name = normalizedName;
    }

    if (description) updateData.description = description;
    if (image) updateData.image = image;
    if (isActive === true || isActive === false) updateData.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date(), isActive: false },
      { new: true },
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Category soft deleted",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null, isActive: true },
      { new: true },
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Category restored", data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Category permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//users--->
exports.getAllUser = async (req, res) => {
  try {
    const users = await User.find({
      $or: [{ role: "user" }, { role: { $exists: false } }],
    });

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOneUser = async (req, res) => {
  try {
    const oneUser = await User.findById(req.params.id);

    if (!oneUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: oneUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active, inactive, or blocked",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User status updated",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date(), status: "inactive" },
      { new: true },
    );

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User soft deleted", data: deletedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const restoredUser = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null, status: "active" },
      { new: true },
    );

    if (!restoredUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User restored", data: restoredUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//admins--->
exports.getAllAdmin = async (req, res) => {
  try {
    const admins = await Admin.find().populate("user createdBy");

    return res.status(200).json({
      success: true,
      message: "All admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOneAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate(
      "user createdBy",
    );

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeAdminStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active, inactive, or blocked",
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    admin.status = status === "active" ? "active" : "inactive";
    await admin.save();

    await User.findByIdAndUpdate(admin.user, { status });

    return res
      .status(200)
      .json({ success: true, message: "Admin status updated", data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date(), status: "inactive" },
      { new: true },
    );

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    await User.findByIdAndUpdate(admin.user, {
      isDeleted: true,
      deletedAt: new Date(),
      status: "inactive",
    });

    return res
      .status(200)
      .json({ success: true, message: "Admin soft deleted", data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null, status: "active" },
      { new: true },
    );

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    await User.findByIdAndUpdate(admin.user, {
      isDeleted: false,
      deletedAt: null,
      status: "active",
    });

    return res
      .status(200)
      .json({ success: true, message: "Admin restored", data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Admin permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//providers--->
exports.getAllProvider = async (req, res) => {
  try {
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

exports.getOneProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).populate("user");

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
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

exports.updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Provider updated successfully",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

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

exports.restoreProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    await User.findByIdAndUpdate(provider.user, { status: "active" });

    return res
      .status(200)
      .json({ success: true, message: "Provider restored", data: provider });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Provider permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//bookings--->
exports.getAllBooking = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } })
      .populate("service");

    return res.status(200).json({
      success: true,
      message: "All bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOneBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } })
      .populate("service");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
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

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (["completed", "rejected", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status} and cannot be modified.`,
      });
    }

    // Update fields
    Object.assign(booking, req.body);
    
    if (req.body.status === "completed") {
      booking.completedAt = new Date();
    }
    
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Booking soft deleted", data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Booking restored", data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Booking permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//reviews--->
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

exports.getReviewsByBooking = async (req, res) => {
  try {
    const reviews = await Review.find({ booking: req.params.bookingId })
      .populate("booking")
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } });

    return res.status(200).json({
      success: true,
      message: "Booking reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOneReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("booking")
      .populate("customer")
      .populate({ path: "provider", populate: { path: "user" } });

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
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

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.softDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Review soft deleted", data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Review restored", data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Review permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//locations--->
exports.getAllLocation = async (req, res) => {
  try {
    const users = await User.find().select("address");
    const bookings = await Booking.find().select("city state pincode address");

    const locations = [];

    users.forEach((item) => {
      if (
        item.address &&
        (item.address.city || item.address.state || item.address.country)
      ) {
        locations.push(item.address);
      }
    });

    bookings.forEach((item) => {
      locations.push({
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        fullAddress: item.address,
      });
    });

    return res.status(200).json({
      success: true,
      message: "All app locations fetched successfully",
      data: locations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//create Admin — password is auto-generated via UUID and emailed; not accepted from request body

exports.createAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeId,
      category,
      city,
      permissions,
    } = req.body;

    // Validation — no password field accepted from client
    if (
      !firstName ||
      !email ||
      !phone ||
      !employeeId ||
      !category ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, email, phone, employeeId, category and city are required",
      });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      if (existingEmail.isDeleted) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered to a deleted account. Please restore the user or use a different email.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check existing phone
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      if (existingPhone.isDeleted) {
        return res.status(409).json({
          success: false,
          message: "Phone number is already registered to a deleted account. Please restore the user or use a different phone number.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "Phone number is already registered",
      });
    }

    // Check existing employeeId
    const existingAdmin = await Admin.findOne({
      employeeId,
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Check that the category exists and is active
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!categoryExists.isActive || categoryExists.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Category is inactive or deleted. Cannot assign admin to it.",
      });
    }

    const activeLoc = await Location.findOne({
      city: { $regex: new RegExp(`^${city.trim()}$`, "i") },
      isActive: true,
    });
    if (!activeLoc) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign admin to ${city} as this location is inactive or not serviced.`,
      });
    }

    // One category can only have one admin — check if already assigned
    const categoryAlreadyAssigned = await Admin.findOne({
      category: category,
      isDeleted: false,
    });

    if (categoryAlreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: "This category already has an admin assigned. One category can only have one admin.",
      });
    }

    // Auto-generate password using UUID
    const plainPassword = uuidv4();

    // Hash Password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "admin",
      address: {
        city: city.trim(),
      },
      createdBy: req.user.id,
    });

    // Create Admin
    const admin = await Admin.create({
      user: user._id,
      employeeId,
      category,
      city: city.trim(),
      permissions: permissions || [],
      createdBy: req.user.id,
    });

    // Send admin credentials (UUID password) via email
    await mailSender(
      email,
      "Admin Account Created - SevaSetu",
      adminCredentialsTemplate(firstName, email, plainPassword, employeeId, categoryExists.name),
    );

    // Populate Response
    const populatedAdmin = await Admin.findById(admin._id)
      .populate("user", "-password -refreshToken")
      .populate("createdBy", "firstName lastName email");

    return res.status(201).json({
      success: true,
      message: "Admin created successfully and credentials sent to email",
      data: populatedAdmin,
    });
  } catch (error) {
    console.log("Create Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};