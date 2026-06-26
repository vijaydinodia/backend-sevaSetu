const admin = require("../utils/firebase");

exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Check request body in case it was passed there
    if (!token && req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No Firebase token provided",
      });
    }

    // Ensure Firebase Admin SDK is initialized
    if (!admin || !admin.apps || admin.apps.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Firebase Admin SDK is not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment variables.",
      });
    }

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid or expired Firebase ID token",
      error: error.message,
    });
  }
};
