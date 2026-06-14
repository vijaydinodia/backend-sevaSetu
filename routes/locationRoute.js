const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");
const { auth, isSuperAdmin, isAdminOrSuperAdmin } = require("../middleware/auth");

// Public route to fetch active locations
router.get("/active", locationController.getActiveLocations);

// Public/Auth route to lookup pincode details
router.get("/pincode-lookup/:pincode", auth, isAdminOrSuperAdmin, locationController.pincodeLookup);

// Protected routes
// City CRUD - Adding and deleting is Super Admin only
router.post("/add", auth, isSuperAdmin, locationController.addLocation);
router.delete("/delete/:id", auth, isSuperAdmin, locationController.deleteLocation);

// City Status & Listing - accessible by Admin and Super Admin
router.get("/getall", auth, isAdminOrSuperAdmin, locationController.getAllLocations);
router.put("/status/:id", auth, isAdminOrSuperAdmin, locationController.toggleLocationStatus);

// Pincode active/inactive status toggle - accessible by Admin and Super Admin
router.put("/pincode/status", auth, isAdminOrSuperAdmin, locationController.togglePincodeStatus);

module.exports = router;
