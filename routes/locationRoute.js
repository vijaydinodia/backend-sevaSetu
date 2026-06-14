const express = require("express");
const router = express.Router();
const {
  getActiveLocations,
  pincodeLookup,
  addLocation,
  deleteLocation,
  getAllLocations,
  toggleLocationStatus,
  togglePincodeStatus,
} = require("../controller/locationController");
const { auth, isSuperAdmin, isAdminOrSuperAdmin } = require("../middleware/auth");

// Public route to fetch active locations
router.get("/active", getActiveLocations);

// Public/Auth route to lookup pincode details
router.get("/pincode-lookup/:pincode", auth, isAdminOrSuperAdmin, pincodeLookup);

// Protected routes
// City CRUD - Adding and deleting is Super Admin only
router.post("/add", auth, isSuperAdmin, addLocation);
router.delete("/delete/:id", auth, isSuperAdmin, deleteLocation);

// City Status & Listing - accessible by Admin and Super Admin
router.get("/getall", auth, isAdminOrSuperAdmin, getAllLocations);
router.put("/status/:id", auth, isAdminOrSuperAdmin, toggleLocationStatus);

// Pincode active/inactive status toggle - accessible by Admin and Super Admin
router.put("/pincode/status", auth, isAdminOrSuperAdmin, togglePincodeStatus);

module.exports = router;
