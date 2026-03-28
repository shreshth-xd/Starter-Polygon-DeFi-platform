// src/routes/lender.js — Lender Routes
const express  = require("express");
const { body } = require("express-validator");
const router   = express.Router();

const lenderController = require("../Controllers/lenderController");
const { protect, restrictTo } = require("../Middleware/Auth");
const validate = require("../Middleware/validate");

// All routes require login + lender role
router.use(protect, restrictTo("lender"));

const depositValidators = [
  body("amountINR").isFloat({ min: 1000 }).withMessage("Minimum deposit is ₹1,000"),
  body("tenureMonths").isIn([3, 6, 12]).withMessage("Tenure must be 3, 6, or 12 months"),
  body("paymentMethod").isIn(["UPI", "NEFT", "IMPS"]).withMessage("Invalid payment method"),
];

router.get("/dashboard",                       lenderController.getDashboard);
router.get("/deposits",                        lenderController.getDeposits);
router.get("/deposits/:depositId",             lenderController.getDeposit);
router.post("/deposit", depositValidators, validate, lenderController.createDeposit);
router.post("/deposits/:depositId/withdraw",   lenderController.withdrawDeposit);
router.get("/transactions",                    lenderController.getTransactions);
router.get("/calculator",                      lenderController.calculateEarnings);

module.exports = router;