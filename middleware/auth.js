const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    //check header exists
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    //check Bearer format
    const token = authHeader.startsWith("Bearer")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

exports.isSuperAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === "superAdmin") {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access this route",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Only admin can access this route",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.isProvider = (req, res, next) => {
  try {
    if (req.user && req.user.role === "provider") {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only service providers can access this route.",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.isUser = (req, res, next) => {
  try {
    if (req.user && req.user.role === "user") {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Users only.",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.isAdminOrSuperAdmin = (req, res, next) => {
  try {
    if (req.user && (req.user.role === "admin" || req.user.role === "superAdmin")) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Super Admins only.",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
