// src/routes/borrower.js — Borrower Routes
const express  = require("express");
const { body } = require("express-validator");
const router   = express.Router();

const borrowerController = require("../Controllers/borrowerController");
const { protect, restrictTo } = require("../Middleware/Auth");
const validate = require("../Middleware/validate");

// All routes require login + borrower role
router.use(protect, restrictTo("borrower"));

const loanDraftValidators = [
  body("amountINR").isFloat({ min: 2000, max: 20000 }).withMessage("Loan must be ₹2,000–₹20,000"),
  body("tenureMonths").isIn([3, 6, 12]).withMessage("Tenure must be 3, 6, or 12 months"),
  body("cryptoType").isIn(["ETH", "BTC", "MATIC"]).withMessage("Crypto must be ETH, BTC, or MATIC"),
];

const confirmLoanValidators = [
  body("loanId").trim().notEmpty().withMessage("loanId required"),
  body("collateralTxHash").trim().notEmpty().withMessage("Collateral transaction hash required"),
];

const repayValidators = [
  body("amountINR").isFloat({ min: 1 }).withMessage("Amount must be greater than 0"),
  body("paymentMethod").isIn(["UPI", "NEFT", "IMPS"]).withMessage("Invalid payment method"),
  body("transactionId").notEmpty().withMessage("Payment transaction ID required"),
];

router.get("/dashboard",                               borrowerController.getDashboard);
router.post("/check-eligibility",
  body("amountINR").isFloat({ min: 1 }).withMessage("Amount required"),
  validate,
  borrowerController.checkEligibility
);
router.post("/calculate-loan",                         borrowerController.calculateLoan);
router.post("/loan-draft", loanDraftValidators, validate, borrowerController.createLoanDraft);
router.post("/confirm-loan", confirmLoanValidators, validate, borrowerController.confirmLoan);
router.delete("/loan-draft/:loanId",                   borrowerController.cancelLoanDraft);
router.get("/loans",                                   borrowerController.getLoans);
router.get("/loans/:loanId",                           borrowerController.getLoan);
router.post("/loans/:loanId/repay", repayValidators, validate, borrowerController.repayLoan);
router.get("/transactions",                            borrowerController.getTransactions);

module.exports = router;