const express = require("express");
const router = express.Router();
const multer = require("multer");

const { auth } = require("../middleware/auth");

const {
  editProfile,
  uploadImage,
  uploadPublic,
  getActiveCategories,
  getServicesOfferedByProviders,
  createBooking,
  getCustomerBookings,
} = require("../controller/userController");

// multer stores file in memory (no local disk), then we send it to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// edit profile - login required
router.put("/edit-profile", auth, editProfile);

// upload image - login required
router.post("/upload/image", auth, upload.single("image"), uploadImage);

// upload image - no login needed (for provider signup)
router.post("/upload-public", upload.single("image"), uploadPublic);

// get all active categories
router.get("/categories", getActiveCategories);

// public route to list services offered by providers
router.get("/services", getServicesOfferedByProviders);

// authenticated routes for booking
router.post("/booking", auth, createBooking);
router.get("/bookings", auth, getCustomerBookings);

module.exports = router;