// src/utils/jwt.js — JWT sign + verify helpers
const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT token for a user
 * @param {Object} payload - { id, role }
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Verify a JWT token and return decoded payload
 * Throws if invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };