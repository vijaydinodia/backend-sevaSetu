const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  signup,
  login,
  forgetPassword,
  verifyOtp,
  resetPassword,
} = require("../controller/userController");

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgetPassword", forgetPassword);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);

module.exports = router;
