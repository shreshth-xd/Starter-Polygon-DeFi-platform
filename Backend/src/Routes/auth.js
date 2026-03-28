// src/routes/auth.js — Authentication Routes
const express  = require("express");
const { body } = require("express-validator");
const router   = express.Router();

const authController = require("../Controllers/authController");
const { protect, restrictTo } = require("../Middleware/Auth");
const validate = require("../Middleware/validate");

// ── Validators ────────────────────────────────────────────────────────────────
const signupValidators = [
  body("fullName").trim().notEmpty().withMessage("Full name is required")
    .isLength({ max: 80 }).withMessage("Name too long"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").matches(/^\+?[0-9]{10,13}$/).withMessage("Valid phone number required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").isIn(["lender", "borrower"]).withMessage("Role must be lender or borrower"),
];

const loginValidators = [
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const kycValidators = [
  body("aadhaarNumber").trim().notEmpty().withMessage("Aadhaar number required")
    .isLength({ min: 12, max: 12 }).withMessage("Aadhaar must be 12 digits"),
  body("panNumber").trim().notEmpty().withMessage("PAN required")
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage("Invalid PAN format"),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// Public
router.post("/signup",  signupValidators, validate, authController.signup);
router.post("/login",   loginValidators,  validate, authController.login);
router.get("/wallet-challenge", authController.walletChallenge);
router.post(
  "/wallet-login",
  [
    body("walletAddress").notEmpty().withMessage("Wallet address required"),
    body("message").notEmpty().withMessage("Signed message required"),
    body("signature").notEmpty().withMessage("Signature required"),
  ],
  validate,
  authController.walletLogin
);

// Protected
router.get( "/me",             protect, authController.getMe);
router.patch("/update-profile", protect, authController.updateProfile);
router.post("/submit-kyc",     protect, kycValidators, validate, authController.submitKYC);
router.post("/connect-wallet", protect, restrictTo("borrower"),
  body("walletAddress").notEmpty().withMessage("Wallet address required"),
  validate,
  authController.connectWallet
);

module.exports = router;