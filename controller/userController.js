const user = require("../model/userModel");
const provider = require("../model/providerModel");
const admin = require("../model/adminModel");
const superAdmin = require("../model/superAdminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");

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
      role, // user, provider, admin, superAdmin
      businessName, // for provider
      employeeId, // for admin
      department, // for admin
      address,
    } = req.body;

    if (!firstName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const alreadyUser = await user.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
    });

    if (alreadyUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists, please login",
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashpassword = bcrypt.hashSync(password, salt);

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
      await provider.create({
        user: newUser._id,
        businessName: businessName || `${firstName}'s Business`,
      });
    } else if (role === "admin") {
      await admin.create({
        user: newUser._id,
        employeeId: employeeId || `EMP${Date.now()}`,
        department: department || "Operations",
      });
    } else if (role === "superAdmin") {
      await superAdmin.create({
        user: newUser._id,
      });
    }

    // Remove password from response
    newUser.password = undefined;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
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
