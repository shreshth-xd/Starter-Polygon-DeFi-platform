// src/middleware/auth.js — JWT Authentication + Role Guard
const { verifyToken } = require("../utils/jwt");
const { sendError } = require("../utils/response");
const Lender = require("../Models/Lender");
const Borrower = require("../Models/Borrower");

/**
 * protect — verifies JWT, loads Lender or Borrower by payload.role + id, attaches req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, 401, "Not authorized. Please log in.");
  }

  try {
    const decoded = verifyToken(token);
    const { id, role } = decoded;

    let account;
    if (role === "lender") {
      account = await Lender.findById(id).select("-password");
    } else if (role === "borrower") {
      account = await Borrower.findById(id).select("-password");
    } else {
      return sendError(res, 401, "Invalid token payload.");
    }

    if (!account) {
      return sendError(res, 401, "User belonging to this token no longer exists.");
    }

    if (!account.isActive) {
      return sendError(res, 403, "Your account has been deactivated.");
    }

    if (account.isBanned) {
      return sendError(res, 403, `Account banned: ${account.banReason || "Violation of terms"}`);
    }

    req.user = account;
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
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. This route is restricted to: ${roles.join(", ")}.`
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
