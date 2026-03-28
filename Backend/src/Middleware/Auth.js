// src/middleware/auth.js — JWT Authentication + Role Guard
const { verifyToken } = require("../utils/jwt");
const { sendError }   = require("../utils/response");
const User            = require("../Models/User");

/**
 * protect — verifies JWT, attaches req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, 401, "Not authorized. Please log in.");
  }

  try {
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return sendError(res, 401, "User belonging to this token no longer exists.");
    }

    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated.");
    }

    if (user.isBanned) {
      return sendError(res, 403, `Account banned: ${user.banReason || "Violation of terms"}`);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, 401, "Session expired. Please log in again.");
    }
    return sendError(res, 401, "Invalid token. Please log in again.");
  }
};

/**
 * restrictTo(...roles) — role-based access guard
 * Usage: router.get("/route", protect, restrictTo("lender"))
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res, 403,
        `Access denied. This route is restricted to: ${roles.join(", ")}.`
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };