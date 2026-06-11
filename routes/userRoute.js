const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const { uploadImages } = require("../utils/cloudnairy");
const upload = multer({ storage: multer.memoryStorage() });

const {
  signup,
  login,
  forgetPassword,
  verifyOtp,
  resetPassword,
  editProfile,
} = require("../controller/userController");

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgetPassword", forgetPassword);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);

//edit profile - requires auth
router.put("/edit-profile", auth, editProfile);

//upload image - requires auth
router.post("/upload/image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
    const uploadedImages = await uploadImages([req.file]);
    if (!uploadedImages.length) {
      return res.status(400).json({ success: false, message: "Image upload failed" });
    }
    return res.status(200).json({ success: true, message: "Image uploaded successfully", data: uploadedImages[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
