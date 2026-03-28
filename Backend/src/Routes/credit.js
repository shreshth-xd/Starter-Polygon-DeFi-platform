// src/routes/credit.js — Credit Score Routes
const express = require("express");
const router  = express.Router();
const creditController = require("../Controllers/creditController");
const { protect, restrictTo } = require("../Middleware/Auth");

// Borrower's own score
router.get("/score",          protect, restrictTo("borrower"), creditController.getMyScore);

// Public: lookup by wallet address
router.get("/score/:walletAddress", creditController.getScoreByWallet);

module.exports = router;