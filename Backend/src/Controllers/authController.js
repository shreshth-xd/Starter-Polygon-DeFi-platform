// src/controllers/authController.js — Auth: Signup, Login, Profile
const User          = require("../Models/User");
const Transaction   = require("../Models/Transaction");
const { generateToken } = require("../utils/jwt");
const { sendOK, sendCreated, sendError } = require("../utils/response");
const { ROLES, CREDIT } = require("../utils/constants");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Body: { fullName, email, phone, password, role, upiId?, bankAccountNumber? }
// ─────────────────────────────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, upiId, bankAccountNumber } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 409, "An account with this email already exists.");
    }

    // Build user object
    const userData = { fullName, email, phone, password, role };

    if (role === ROLES.LENDER) {
      userData.lenderProfile = { upiId: upiId || null };
    }

    if (role === ROLES.BORROWER) {
      userData.borrowerProfile = {
        bankAccountNumber: bankAccountNumber || null,
        creditScore: CREDIT.STARTING_SCORE,
      };
    }

    const user  = await User.create(userData);
    const token = generateToken({ id: user._id, role: user.role });

    return sendCreated(res, "Account created successfully! Welcome to CredAura.", {
      token,
      user: user.publicProfile,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password.");
    }

    // Check if active / banned
    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated. Contact support.");
    }
    if (user.isBanned) {
      return sendError(res, 403, `Your account has been banned. Reason: ${user.banReason}`);
    }

    const token = generateToken({ id: user._id, role: user.role });

    return sendOK(res, "Login successful. Welcome back!", {
      token,
      user: user.publicProfile,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendOK(res, "Profile fetched.", { user: user.publicProfile });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/update-profile  (protected)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, upiId, bankAccountNumber } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (phone)    user.phone    = phone;

    if (user.role === ROLES.LENDER && upiId) {
      user.lenderProfile.upiId = upiId;
    }
    if (user.role === ROLES.BORROWER && bankAccountNumber) {
      user.borrowerProfile.bankAccountNumber = bankAccountNumber;
    }

    await user.save();
    return sendOK(res, "Profile updated.", { user: user.publicProfile });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/connect-wallet  (protected — borrowers only)
// Body: { walletAddress }
// ─────────────────────────────────────────────────────────────────────────────
exports.connectWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const { isValidAddress } = require("../Services/blockchainService");

    if (!isValidAddress(walletAddress)) {
      return sendError(res, 400, "Invalid wallet address format.");
    }

    // Check if wallet already used by another user
    const existing = await User.findOne({
      "borrowerProfile.walletAddress": walletAddress,
      _id: { $ne: req.user._id },
    });
    if (existing) {
      return sendError(res, 409, "This wallet is already linked to another account.");
    }

    await User.findByIdAndUpdate(req.user._id, {
      "borrowerProfile.walletAddress": walletAddress,
    });

    return sendOK(res, "Wallet connected successfully.", { walletAddress });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/submit-kyc  (protected)
// Body: { aadhaarNumber, panNumber }
// ─────────────────────────────────────────────────────────────────────────────
exports.submitKYC = async (req, res, next) => {
  try {
    const { aadhaarNumber, panNumber } = req.body;
    const user = await User.findById(req.user._id).select("+kyc.aadhaarNumber +kyc.panNumber");

    if (user.kyc.isVerified) {
      return sendError(res, 400, "KYC already verified.");
    }

    // In production: call Aadhaar/PAN verification API here
    user.kyc.aadhaarNumber = aadhaarNumber;
    user.kyc.panNumber     = panNumber;
    user.kyc.isVerified    = true;    // Auto-verify for hackathon
    user.kyc.verifiedAt    = new Date();
    await user.save();

    return sendOK(res, "KYC submitted and verified successfully.", {
      isVerified: true,
      verifiedAt: user.kyc.verifiedAt,
    });
  } catch (err) {
    next(err);
  }
};