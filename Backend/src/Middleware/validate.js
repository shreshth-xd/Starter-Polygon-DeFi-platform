// src/middleware/validate.js — Request Validation Middleware
const { validationResult } = require("express-validator");
const { sendError }        = require("../utils/response");

/**
 * Runs after express-validator chains.
 * Returns 422 with all field errors if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => ({
      field:   e.path || e.param,
      message: e.msg,
    }));
    return sendError(res, 422, "Validation failed", messages);
  }
  next();
};

module.exports = validate;