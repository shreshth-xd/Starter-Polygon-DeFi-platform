// src/utils/response.js — Standardized API response helpers

const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode = 500, message = "Server Error", errors = null) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

const sendCreated = (res, message, data) => sendSuccess(res, 201, message, data);
const sendOK      = (res, message, data) => sendSuccess(res, 200, message, data);

module.exports = { sendSuccess, sendError, sendCreated, sendOK };