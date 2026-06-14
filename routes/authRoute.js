const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  forgetPassword,
  verifyOtp,
  resetPassword,
} = require("../controller/authController");

// signup and login
router.post("/signup", signup);
router.post("/login", login);

// forgot password flow
router.post("/forgetPassword", forgetPassword);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);

module.exports = router;
