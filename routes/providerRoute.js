const express = require("express");
const router = express.Router();
const { auth, isProvider } = require("../middleware/auth");
const {
  getProviderProfile,
  updateProviderProfile,
  getProviderBookings,
  updateProviderBookingStatus,
  getProviderReviews,
  getAllCategory,
  getAvailableServices,
  getMyServices,
  addProviderService,
  removeProviderService,
  applyForCategory,
} = require("../controller/providerController");

// Protect all routes with auth + isProvider checks
router.use(auth);
router.use(isProvider);

// Profile routes
router.get("/profile", getProviderProfile);
router.put("/profile/edit", updateProviderProfile);
router.post("/profile/apply-category", applyForCategory);

// Booking routes
router.get("/bookings", getProviderBookings);
router.put("/bookings/:id/status", updateProviderBookingStatus);

// Review routes
router.get("/reviews", getProviderReviews);

// Category routes
router.get("/categories", getAllCategory);

// Service management routes for providers
router.get("/services/available", getAvailableServices);
router.get("/services/my", getMyServices);
router.post("/services/add", addProviderService);
router.delete("/services/remove/:id", removeProviderService);

module.exports = router;
