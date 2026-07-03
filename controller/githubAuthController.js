const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");

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

  if (response.data.error) {
    throw new Error(response.data.error_description || response.data.error);
  }

  return response.data.access_token;
};

const getGitHubUserProfile = async (accessToken) => {
  const response = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "SevaSetu-App",
    },
  });

  return response.data;
};

const getGitHubUserEmail = async (accessToken, githubUser) => {
  if (githubUser.email) {
    return githubUser.email;
  }

  const response = await axios.get("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "SevaSetu-App",
    },
  });

  const emails = response.data;

  if (Array.isArray(emails)) {
    const primaryEmail = emails.find((e) => e.primary && e.verified);
    if (primaryEmail) return primaryEmail.email;

    if (emails.length > 0) return emails[0].email;
  }

  return null;
};

const findOrCreateGitHubUser = async (githubId, email, name, login, avatar) => {
  if (!email) {
    throw new Error(
      "Email is required for SevaSetu accounts, but your GitHub account does not have a verified email. Please add a verified email to your GitHub account and try again."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  let existingUser = await User.findOne({
    $or: [{ githubId: githubId }, { email: normalizedEmail }],
  });

  if (existingUser) {
    if (existingUser.isDeleted) {
      throw new Error(
        "Email is associated with a deleted account. Please contact support."
      );
    }

    let isUpdated = false;

    if (!existingUser.githubId) {
      existingUser.githubId = githubId;
      isUpdated = true;
    }

    if (existingUser.authProvider !== "github") {
      existingUser.authProvider = "github";
      isUpdated = true;
    }

    if (!existingUser.profileImage && avatar) {
      existingUser.profileImage = avatar;
      isUpdated = true;
    }

    if (isUpdated) {
      await existingUser.save();
    }

    return existingUser;
  }

  let firstName = "";
  let lastName = "";

  if (name) {
    const nameParts = name.split(" ");
    firstName = nameParts[0] || login || "User";
    lastName = nameParts.slice(1).join(" ") || "";
  } else {
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
    isVerified: true,
  });

  return newUser;
};

exports.githubCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    const accessToken = await getGitHubAccessToken(code);

    const githubUser = await getGitHubUserProfile(accessToken);

    const email = await getGitHubUserEmail(accessToken, githubUser);

    const user = await findOrCreateGitHubUser(
      String(githubUser.id),
      email,
      githubUser.name || githubUser.login,
      githubUser.login,
      githubUser.avatar_url
    );

    const token = generateLocalToken(user);

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
