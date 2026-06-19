const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const Provider = require("../model/providerModel");
const Category = require("../model/categoryModel");
const Booking = require("../model/bookingModel");
const Review = require("../model/reviewModel");
const SuperAdmin = require("../model/superAdminModel");
const Complaint = require("../model/complaintModel");
const ProviderService = require("../model/providerServicModel");
const Service = require("../model/serviceModel");
const { uploadImages } = require("../utils/cloudnairy");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const Location = require("../model/locationModel");
const adminCredentialsTemplate = require("../templates/adminCredentialsTemplate")
const mailSender = require("../utils/mailSender");
const { runWithTransaction } = require("../utils/dbTransaction");

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
  console.log(req.body);
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      permissions
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "superAdmin"
    });

    const superAdminData = { user: newUser._id };
    if (permissions && permissions.length > 0) {
      superAdminData.permissions = permissions;
    }
    const superAdmin = await SuperAdmin.create(superAdminData);

    return res.status(201).json({
      success: true,
      message: "Super admin created successfully",
      data: {
        user: newUser,
        superAdmin
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
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
    const deletedUser = await runWithTransaction(async (session) => {
      const user = await User.findById(req.params.id).session(session);
      if (!user) return null;

      const userId = user._id;

      // 1. Soft delete the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isDeleted: true, deletedAt: new Date(), status: "inactive" },
        { new: true, session }
      );

      // 2. Cascade soft delete to associated profiles
      await Admin.updateMany({ user: userId }, { $set: { isDeleted: true, deletedAt: new Date(), status: "inactive" } }, { session });
      await Provider.updateMany({ user: userId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { session });
      
      // 3. Cascade soft delete to interactions
      await Booking.updateMany({ customer: userId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { session });
      await Review.updateMany({ customer: userId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { session });

      return updatedUser;
    });

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
    const restoredUser = await runWithTransaction(async (session) => {
      const user = await User.findById(req.params.id).session(session);
      if (!user) return null;

      const userId = user._id;

      // 1. Restore the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isDeleted: false, deletedAt: null, status: "active" },
        { new: true, session }
      );

      // 2. Cascade restore to associated profiles
      await Admin.updateMany({ user: userId }, { $set: { isDeleted: false, deletedAt: null, status: "active" } }, { session });
      await Provider.updateMany({ user: userId }, { $set: { isDeleted: false, deletedAt: null } }, { session });
      
      // 3. Cascade restore to interactions
      await Booking.updateMany({ customer: userId }, { $set: { isDeleted: false, deletedAt: null } }, { session });
      await Review.updateMany({ customer: userId }, { $set: { isDeleted: false, deletedAt: null } }, { session });

      return updatedUser;
    });

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
    const deletedUser = await runWithTransaction(async (session) => {
      // 1. Fetch the user to be deleted
      const user = await User.findById(req.params.id).session(session);
      if (!user) return null; // User not found, return null

      const userId = user._id;

      // 2. Delete Admin profile if this user is an admin
      const admin = await Admin.findOne({ user: userId }).session(session);
      if (admin) {
        await Admin.findByIdAndDelete(admin._id, { session });
      }

      // 3. Delete Provider profile and all provider-related data
      const provider = await Provider.findOne({ user: userId }).session(session);
      if (provider) {
        const providerId = provider._id;
        
        // Delete services offered by this provider
        await ProviderService.deleteMany({ provider: providerId }, { session });
        
        // Delete bookings assigned to this provider
        await Booking.deleteMany({ provider: providerId }, { session });
        
        // Delete complaints against this provider
        await Complaint.deleteMany({ provider: providerId }, { session });
        
        // Delete reviews for this provider
        await Review.deleteMany({ provider: providerId }, { session });
        
        // Finally, delete the provider profile
        await Provider.findByIdAndDelete(providerId, { session });
      }

      // 4. Delete SuperAdmin profile if this user is a super admin
      await SuperAdmin.deleteMany({ user: userId }, { session });

      // 5. Delete all interactions where this user was the customer
      await Booking.deleteMany({ customer: userId }, { session });
      await Complaint.deleteMany({ customer: userId }, { session });
      await Review.deleteMany({ customer: userId }, { session });

      // 6. Clean up references in categories and services (set to null)
      await Category.updateMany({ createdBy: userId }, { $set: { createdBy: null } }, { session });
      await Category.updateMany({ updatedBy: userId }, { $set: { updatedBy: null } }, { session });
      await Service.updateMany({ createdBy: userId }, { $set: { createdBy: null } }, { session });
      await Service.updateMany({ updatedBy: userId }, { $set: { updatedBy: null } }, { session });

      // 7. Finally, delete the User record itself
      return await User.findByIdAndDelete(userId, { session });
    });

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
    const admin = await runWithTransaction(async (session) => {
      const existingAdmin = await Admin.findById(req.params.id).session(session);
      if (!existingAdmin) return null;

      // 1. Soft delete the Admin
      const updatedAdmin = await Admin.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true, deletedAt: new Date(), status: "inactive" },
        { new: true, session }
      );

      // 2. Cascade soft delete to the underlying User account
      await User.updateOne(
        { _id: existingAdmin.user }, 
        { $set: { isDeleted: true, deletedAt: new Date(), status: "inactive" } }, 
        { session }
      );

      return updatedAdmin;
    });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Admin soft deleted", data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreAdmin = async (req, res) => {
  try {
    const admin = await runWithTransaction(async (session) => {
      const existingAdmin = await Admin.findById(req.params.id).session(session);
      if (!existingAdmin) return null;

      // 1. Restore the Admin
      const updatedAdmin = await Admin.findByIdAndUpdate(
        req.params.id,
        { isDeleted: false, deletedAt: null, status: "active" },
        { new: true, session }
      );

      // 2. Cascade restore to the underlying User account
      await User.updateOne(
        { _id: existingAdmin.user }, 
        { $set: { isDeleted: false, deletedAt: null, status: "active" } }, 
        { session }
      );

      return updatedAdmin;
    });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Admin restored", data: admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteAdmin = async (req, res) => {
  try {
    const deletedAdmin = await runWithTransaction(async (session) => {
      // 1. Fetch the admin to be deleted
      const admin = await Admin.findById(req.params.id).session(session);
      if (!admin) return null; // Admin not found, return null

      // 2. Delete the associated User account permanently
      await User.findByIdAndDelete(admin.user, { session });

      // 3. Finally, delete the Admin record itself
      return await Admin.findByIdAndDelete(admin._id, { session });
    });

    if (!deletedAdmin) {
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
    const provider = await runWithTransaction(async (session) => {
      const existingProvider = await Provider.findById(req.params.id).session(session);
      if (!existingProvider) return null;

      const providerId = existingProvider._id;

      // 1. Soft delete the provider
      const updatedProvider = await Provider.findByIdAndUpdate(
        providerId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true, session }
      );

      // 2. Cascade soft delete to the underlying User account
      await User.updateOne({ _id: existingProvider.user }, { $set: { isDeleted: true, deletedAt: new Date(), status: "inactive" } }, { session });

      // 3. Cascade soft delete to interactions
      await Booking.updateMany({ provider: providerId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { session });
      await Review.updateMany({ provider: providerId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { session });

      // 4. Mark ProviderServices as unavailable
      await ProviderService.updateMany({ provider: providerId }, { $set: { isAvailable: false } }, { session });

      return updatedProvider;
    });

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

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
    const provider = await runWithTransaction(async (session) => {
      const existingProvider = await Provider.findById(req.params.id).session(session);
      if (!existingProvider) return null;

      const providerId = existingProvider._id;

      // 1. Restore the provider
      const updatedProvider = await Provider.findByIdAndUpdate(
        providerId,
        { isDeleted: false, deletedAt: null },
        { new: true, session }
      );

      // 2. Cascade restore to the underlying User account
      await User.updateOne({ _id: existingProvider.user }, { $set: { isDeleted: false, deletedAt: null, status: "active" } }, { session });

      // 3. Cascade restore to interactions
      await Booking.updateMany({ provider: providerId }, { $set: { isDeleted: false, deletedAt: null } }, { session });
      await Review.updateMany({ provider: providerId }, { $set: { isDeleted: false, deletedAt: null } }, { session });

      // 4. Mark ProviderServices as available
      await ProviderService.updateMany({ provider: providerId }, { $set: { isAvailable: true } }, { session });

      return updatedProvider;
    });

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Provider restored", data: provider });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hardDeleteProvider = async (req, res) => {
  try {
    const deletedProvider = await runWithTransaction(async (session) => {
      // 1. Fetch the provider to be deleted
      const provider = await Provider.findById(req.params.id).session(session);
      if (!provider) return null; // Provider not found, return null

      const providerId = provider._id;

      // 2. Delete the associated User account permanently
      await User.findByIdAndDelete(provider.user, { session });

      // 3. Delete services offered by this provider
      await ProviderService.deleteMany({ provider: providerId }, { session });

      // 4. Delete bookings assigned to this provider
      await Booking.deleteMany({ provider: providerId }, { session });

      // 5. Delete complaints against this provider
      await Complaint.deleteMany({ provider: providerId }, { session });

      // 6. Delete reviews for this provider
      await Review.deleteMany({ provider: providerId }, { session });

      // 7. Finally, delete the Provider record itself
      return await Provider.findByIdAndDelete(providerId, { session });
    });

    if (!deletedProvider) {
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
    const plainPassword = uuidv4().slice(0, 6);

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

// get dashboard stats for Super Admin --->
exports.getDashboardStats = async (req, res) => {
  try {
    const [usersCount, adminsCount, providersCount, categoriesCount, bookingsCount, reviewsCount, locationsCount] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Admin.countDocuments({ isDeleted: false }),
      Provider.countDocuments({ isDeleted: false }),
      Category.countDocuments({ isDeleted: false }),
      Booking.countDocuments({ isDeleted: false }),
      Review.countDocuments({ isDeleted: false }),
      Location.countDocuments({ isDeleted: false })
    ]);

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

    const recentBookingsData = await Booking.find({ isDeleted: false });
    recentBookingsData.forEach(b => {
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

    // Recent Activity
    const recentBookings = await Booking.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer provider service");

    const recentProviders = await Provider.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user");

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: {
        users: usersCount,
        admins: adminsCount,
        providers: providersCount,
        categories: categoriesCount,
        bookings: bookingsCount,
        reviews: reviewsCount,
        locations: locationsCount,
        chartData: chartPoints,
        recentBookings,
        recentProviders
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};