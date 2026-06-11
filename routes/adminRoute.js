const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  isAdmin,
  getAdminProfile,
  approveProvider,
  rejectProvider,
  getAllProvider,
  getOneProvider,
  softDeleteProvider,
  hardDeleteProvider,
  restoreProvider,
  changeProviderStatus,
  getBookingsByCategory,
  getBookingsByProvider,
  getOneBooking,
  updateBookingStatus,
  softDeleteBooking,
  hardDeleteBooking,
  restoreBooking,
  getAllReview,
  getReviewsByProvider,
  getOneReview,
  softDeleteReview,
  hardDeleteReview,
  restoreReview,
} = require("../controller/adminController");

router.use(auth);
router.use(isAdmin);

//profile
router.get("/profile", getAdminProfile);

//provider
router.put("/provider/approve/:id", approveProvider);
router.put("/provider/reject/:id", rejectProvider);
router.get("/provider/getall", getAllProvider);
router.get("/provider/getone/:id", getOneProvider);
router.put("/provider/status/:id", changeProviderStatus);
router.delete("/provider/soft-delete/:id", softDeleteProvider);
router.delete("/provider/hard-delete/:id", hardDeleteProvider);
router.put("/provider/restore/:id", restoreProvider);

//booking
router.get("/booking/by-category", getBookingsByCategory);
router.get("/booking/by-provider/:providerId", getBookingsByProvider);
router.get("/booking/getone/:id", getOneBooking);
router.put("/booking/status/:id", updateBookingStatus);
router.delete("/booking/soft-delete/:id", softDeleteBooking);
router.delete("/booking/hard-delete/:id", hardDeleteBooking);
router.put("/booking/restore/:id", restoreBooking);

//review
router.get("/review/getall", getAllReview);
router.get("/review/by-provider/:providerId", getReviewsByProvider);
router.get("/review/getone/:id", getOneReview);
router.delete("/review/soft-delete/:id", softDeleteReview);
router.delete("/review/hard-delete/:id", hardDeleteReview);
router.put("/review/restore/:id", restoreReview);

module.exports = router;
