const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// ============================================================
// HELPER: Generate JWT token (same format used everywhere)
// ============================================================

const generateLocalToken = (userObj) => {
  return jwt.sign(
    {
      id: userObj._id,
      email: userObj.email,
      role: userObj.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

// ============================================================
// STEP 1: Exchange the authorization code for an access token
// After user clicks "Continue with GitHub" and authorizes,
// GitHub redirects back with a ?code=xxx parameter.
// We send this code to GitHub to get an access_token.
// ============================================================

const getGitHubAccessToken = async (code) => {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    },
    {
      headers: { Accept: "application/json" },
    }
  );

  // Check if GitHub returned an error
  if (response.data.error) {
    throw new Error(response.data.error_description || response.data.error);
  }

  return response.data.access_token;
};

// ============================================================
// STEP 2: Use the access token to fetch the GitHub user profile
// This gives us: id, name, login (username), avatar_url, email
// ============================================================

const getGitHubUserProfile = async (accessToken) => {
  const response = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "SevaSetu-App", // GitHub API requires this header
    },
  });

  return response.data;
};

// ============================================================
// STEP 3: Fetch the user's email (it might not be public)
// GitHub users can hide their email, so we need to call
// a separate API endpoint to get their verified emails.
// ============================================================

const getGitHubUserEmail = async (accessToken, githubUser) => {
  // If email is already available on the profile, use it
  if (githubUser.email) {
    return githubUser.email;
  }

  // Otherwise, fetch emails from GitHub's emails API
  const response = await axios.get("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "SevaSetu-App",
    },
  });

  const emails = response.data;

  // Look for the primary verified email first
  if (Array.isArray(emails)) {
    const primaryEmail = emails.find((e) => e.primary && e.verified);
    if (primaryEmail) return primaryEmail.email;

    // If no primary email found, use the first available email
    if (emails.length > 0) return emails[0].email;
  }

  return null;
};

// ============================================================
// STEP 4: Find or create the user in our MongoDB database
// Same logic as syncFirebaseUser in firebaseAuthController.js
// - If user with same email/githubId exists → link & return
// - If no user exists → create a new one
// ============================================================

const findOrCreateGitHubUser = async (githubId, email, name, login, avatar) => {
  // Email is required for SevaSetu accounts
  if (!email) {
    throw new Error(
      "Email is required for SevaSetu accounts, but your GitHub account does not have a verified email. Please add a verified email to your GitHub account and try again."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists (by githubId OR email)
  let existingUser = await User.findOne({
    $or: [{ githubId: githubId }, { email: normalizedEmail }],
  });

  // ---- USER ALREADY EXISTS → Link GitHub and return ----
  if (existingUser) {
    if (existingUser.isDeleted) {
      throw new Error(
        "Email is associated with a deleted account. Please contact support."
      );
    }

    let isUpdated = false;

    // Link GitHub ID if not already linked
    if (!existingUser.githubId) {
      existingUser.githubId = githubId;
      isUpdated = true;
    }

    // Update auth provider
    if (existingUser.authProvider !== "github") {
      existingUser.authProvider = "github";
      isUpdated = true;
    }

    // Set profile image if user doesn't have one
    if (!existingUser.profileImage && avatar) {
      existingUser.profileImage = avatar;
      isUpdated = true;
    }

    if (isUpdated) {
      await existingUser.save();
    }

    return existingUser;
  }

  // ---- USER DOES NOT EXIST → Create new user ----

  // Split the name into firstName and lastName
  let firstName = "";
  let lastName = "";

  if (name) {
    const nameParts = name.split(" ");
    firstName = nameParts[0] || login || "User";
    lastName = nameParts.slice(1).join(" ") || "";
  } else {
    // If no name, use GitHub username
    firstName = login || normalizedEmail.split("@")[0] || "User";
  }

  const newUser = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    githubId: githubId,
    authProvider: "github",
    role: "user",
    profileImage: avatar || "",
    isVerified: true, // GitHub already verifies emails
  });

  return newUser;
};

// ============================================================
// MAIN CONTROLLER: GitHub OAuth Callback
// This is the endpoint the frontend calls after GitHub
// redirects the user back with the authorization code.
//
// Flow: Frontend sends { code } → we exchange it for token →
//       fetch user profile → find/create user → return JWT
// ============================================================

exports.githubCallback = async (req, res) => {
  try {
    const { code } = req.body;

    // Validate that code is provided
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    // Step 1: Exchange code for access token
    const accessToken = await getGitHubAccessToken(code);

    // Step 2: Fetch GitHub user profile
    const githubUser = await getGitHubUserProfile(accessToken);

    // Step 3: Get user's email
    const email = await getGitHubUserEmail(accessToken, githubUser);

    // Step 4: Find or create user in our database
    const user = await findOrCreateGitHubUser(
      String(githubUser.id),                // githubId
      email,                                 // email
      githubUser.name || githubUser.login,   // name
      githubUser.login,                      // GitHub username
      githubUser.avatar_url                  // profile picture URL
    );

    // Step 5: Generate JWT token
    const token = generateLocalToken(user);

    // Step 6: Send response back to frontend
    return res.status(200).json({
      success: true,
      message: "GitHub login successful",
      token,
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
