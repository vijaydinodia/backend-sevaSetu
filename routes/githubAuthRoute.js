const express = require("express");
const router = express.Router();
const { githubCallback } = require("../controller/githubAuthController");

// GitHub OAuth Callback (mapped to POST /auth/github/callback)
router.post("/github/callback", githubCallback);

module.exports = router;
