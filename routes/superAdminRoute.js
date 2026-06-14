const express = require("express");
const router = express.Router();
const multer = require("multer");
const { auth, isSuperAdmin } = require("../middleware/auth");
const {
  getSuperAdminProfile,
  editSuperAdminProfile,
  createSuperAdmin,
  getAllSuperAdmin,
  getOneSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
  uploadImage,
  createCategory,
  getAllCategory,
  getOneCategory,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  hardDeleteCategory,
  getAllUser,
  getOneUser,
  updateUser,
  changeUserStatus,
  softDeleteUser,
  restoreUser,
  hardDeleteUser,
  getAllAdmin,
  getOneAdmin,
  updateAdmin,
  changeAdminStatus,
  softDeleteAdmin,
  restoreAdmin,
  hardDeleteAdmin,
  getAllProvider,
  getOneProvider,
  updateProvider,
  softDeleteProvider,
  restoreProvider,
  hardDeleteProvider,
  getAllBooking,
  getOneBooking,
  updateBooking,
  softDeleteBooking,
  restoreBooking,
  hardDeleteBooking,
  getAllReview,
  getReviewsByBooking,
  getOneReview,
  updateReview,
  softDeleteReview,
  restoreReview,
  hardDeleteReview,
  getAllLocation,
  createAdmin,
} = require("../controller/superAdminController");

const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);
router.use(isSuperAdmin);

//profile
router.get("/profile", getSuperAdminProfile);
router.put("/profile", editSuperAdminProfile);

//super admin
router.post("/create", createSuperAdmin);
router.get("/getall", getAllSuperAdmin);
router.get("/getone/:id", getOneSuperAdmin);
router.put("/update/:id", updateSuperAdmin);
router.delete("/delete/:id", deleteSuperAdmin);

//upload image
router.post("/upload/image", upload.single("image"), uploadImage);

//category
router.post("/category/create", createCategory);
router.get("/category/getall", getAllCategory);
router.get("/category/getone/:id", getOneCategory);
router.put("/category/update/:id", updateCategory);
router.delete("/category/soft-delete/:id", softDeleteCategory);
router.put("/category/restore/:id", restoreCategory);
router.delete("/category/hard-delete/:id", hardDeleteCategory);

//user
router.get("/user/getall", getAllUser);
router.get("/user/getone/:id", getOneUser);
router.put("/user/update/:id", updateUser);
router.put("/user/status/:id", changeUserStatus);
router.delete("/user/soft-delete/:id", softDeleteUser);
router.put("/user/restore/:id", restoreUser);
router.delete("/user/hard-delete/:id", hardDeleteUser);

//admin
router.post("/admin/createAdmin", createAdmin);
router.get("/admin/getall", getAllAdmin);
router.get("/admin/getone/:id", getOneAdmin);
router.put("/admin/update/:id", updateAdmin);
router.put("/admin/status/:id", changeAdminStatus);
router.delete("/admin/soft-delete/:id", softDeleteAdmin);
router.put("/admin/restore/:id", restoreAdmin);
router.delete("/admin/hard-delete/:id", hardDeleteAdmin);

//provider
router.get("/provider/getall", getAllProvider);
router.get("/provider/getone/:id", getOneProvider);
router.put("/provider/update/:id", updateProvider);
router.delete("/provider/soft-delete/:id", softDeleteProvider);
router.put("/provider/restore/:id", restoreProvider);
router.delete("/provider/hard-delete/:id", hardDeleteProvider);

//booking
router.get("/booking/getall", getAllBooking);
router.get("/booking/getone/:id", getOneBooking);
router.put("/booking/update/:id", updateBooking);
router.delete("/booking/soft-delete/:id", softDeleteBooking);
router.put("/booking/restore/:id", restoreBooking);
router.delete("/booking/hard-delete/:id", hardDeleteBooking);

//review
router.get("/review/getall", getAllReview);
router.get("/review/booking/:bookingId", getReviewsByBooking);
router.get("/review/getone/:id", getOneReview);
router.put("/review/update/:id", updateReview);
router.delete("/review/soft-delete/:id", softDeleteReview);
router.put("/review/restore/:id", restoreReview);
router.delete("/review/hard-delete/:id", hardDeleteReview);

module.exports = router;
