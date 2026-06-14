const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../middleware/auth");
const userController = require("../controller/userController");

// multer stores file in memory (no local disk), then we send it to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// signup and login
router.post("/signup", userController.signup);
router.post("/login", userController.login);

// forgot password flow
router.post("/forgetPassword", userController.forgetPassword);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/resetPassword", userController.resetPassword);

// edit profile - login required
router.put("/edit-profile", auth.auth, userController.editProfile);

// upload image - login required
router.post("/upload/image", auth.auth, upload.single("image"), userController.uploadImage);

// upload image - no login needed (for provider signup)
router.post("/upload-public", upload.single("image"), userController.uploadPublic);

// get all active categories
router.get("/categories", userController.getActiveCategories);

// public route to list services offered by providers
router.get("/services", userController.getServicesOfferedByProviders);

// authenticated routes for booking
router.post("/booking", auth.auth, userController.createBooking);
router.get("/bookings", auth.auth, userController.getCustomerBookings);

module.exports = router;
