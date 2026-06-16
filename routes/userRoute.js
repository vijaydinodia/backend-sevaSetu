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
  addReview,
} = require("../controller/userController");

// multer stores file in memory (no local disk), then send it to Cloudinary 
const upload = multer({ storage: multer.memoryStorage() });

router.put("/edit-profile", auth, editProfile);
router.post("/upload/image", auth, upload.single("image"), uploadImage);
router.post("/upload-public", upload.single("image"), uploadPublic);
router.get("/categories", getActiveCategories);
router.get("/services", getServicesOfferedByProviders);
router.post("/booking", auth, createBooking);
router.get("/bookings", auth, getCustomerBookings);
router.post("/review", auth, addReview);

module.exports = router;