const express = require("express");
const router = express.Router();
const {
  firebaseSignup,
  firebaseLogin,
  firebaseGoogle,
} = require("../controller/firebaseAuthController");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");

// Firebase Auth Endpoints (mapped to POST /auth/firebase/...)
router.post("/firebase/signup", verifyFirebaseToken, firebaseSignup);
router.post("/firebase/login", verifyFirebaseToken, firebaseLogin);
router.post("/firebase/google", verifyFirebaseToken, firebaseGoogle);

module.exports = router;
