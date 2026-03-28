// src/routes/loan.js — Shared Loan Routes (readable by both roles)
const express = require("express");
const router  = express.Router();
const Loan    = require("../Models/Loan");
const { protect }     = require("../Middleware/Auth");
const { sendOK, sendError } = require("../utils/response");

// GET /api/loan/stats  — public platform stats
router.get("/stats", async (req, res) => {
  try {
    const [total, active, repaid] = await Promise.all([
      Loan.countDocuments(),
      Loan.countDocuments({ status: "active" }),
      Loan.countDocuments({ status: "repaid" }),
    ]);
    return sendOK(res, "Platform stats.", { totalLoans: total, activeLoans: active, repaidLoans: repaid });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
});

module.exports = router;