// src/controllers/authController.js — Auth: Signup, Login, Profile
const { ethers } = require("ethers");
const Lender = require("../Models/Lender");
const Borrower = require("../Models/Borrower");
const blockchainService = require("../Services/blockchainService");
const { emailExistsAnywhere, findAccountByEmailForLogin } = require("../utils/accountLookup");
const { createNonce, consumeNonceIfValid } = require("../utils/walletAuthNonce");
const { generateToken } = require("../utils/jwt");
const { sendOK, sendCreated, sendError } = require("../utils/response");
const { ROLES, CREDIT } = require("../utils/constants");

async function findBorrowerByWalletAddress(address) {
  let normalized;
  try {
    normalized = ethers.getAddress(address);
  } catch {
    return null;
  }
  return Borrower.findOne({
    $expr: {
      $eq: [
        { $toLower: { $ifNull: ["$borrowerProfile.walletAddress", ""] } },
        normalized.toLowerCase(),
      ],
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Body: { fullName, email, phone, password, role, upiId?, bankAccountNumber? }
// ─────────────────────────────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, upiId, bankAccountNumber } = req.body;

    if (await emailExistsAnywhere(email)) {
      return sendError(res, 409, "An account with this email already exists.");
    }

    if (role === ROLES.LENDER) {
      const lender = await Lender.create({
        fullName,
        email,
        phone,
        password,
        lenderProfile: { upiId: upiId || null },
      });
      const token = generateToken({ id: lender._id, role: "lender" });
      return sendCreated(res, "Account created successfully! Welcome to CredAura.", {
        token,
        user: lender.publicProfile,
      });
    }

    if (role === ROLES.BORROWER) {
      const borrower = await Borrower.create({
        fullName,
        email,
        phone,
        password,
        borrowerProfile: {
          bankAccountNumber: bankAccountNumber || null,
          creditScore: CREDIT.STARTING_SCORE,
        },
      });
      const token = generateToken({ id: borrower._id, role: "borrower" });
      return sendCreated(res, "Account created successfully! Welcome to CredAura.", {
        token,
        user: borrower.publicProfile,
      });
    }

    return sendError(res, 400, "Invalid role.");
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

    const found = await findAccountByEmailForLogin(email);
    if (!found) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const { account, role } = found;
    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password.");
    }

    if (!account.isActive) {
      return sendError(res, 403, "Your account has been deactivated. Contact support.");
    }
    if (account.isBanned) {
      return sendError(res, 403, `Your account has been banned. Reason: ${account.banReason}`);
    }

    const token = generateToken({ id: account._id, role });

    return sendOK(res, "Login successful. Welcome back!", {
      token,
      user: account.publicProfile,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/wallet-challenge?address=0x...
// Returns a message the user must sign with MetaMask to prove wallet ownership.
// ─────────────────────────────────────────────────────────────────────────────
exports.walletChallenge = async (req, res, next) => {
  try {
    const raw = req.query.address;
    if (!raw || !blockchainService.isValidAddress(raw)) {
      return sendError(res, 400, "Valid wallet address is required.");
    }
    const normalized = ethers.getAddress(raw);
    const nonce = createNonce(normalized);
    const issuedAt = new Date().toISOString();
    const message = [
      "CredAura — Sign in with Ethereum",
      "",
      `Wallet: ${normalized}`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
      "",
      "Signing this message does not cost gas.",
    ].join("\n");

    return sendOK(res, "Sign this message in your wallet.", { message, walletAddress: normalized });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/wallet-login
// Body: { walletAddress, message, signature }
// Verifies EIP-191 signature and issues JWT for borrowers with this wallet linked.
// ─────────────────────────────────────────────────────────────────────────────
exports.walletLogin = async (req, res, next) => {
  try {
    const { walletAddress, message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return sendError(res, 400, "walletAddress, message, and signature are required.");
    }

    if (!blockchainService.isValidAddress(walletAddress)) {
      return sendError(res, 400, "Invalid wallet address.");
    }

    let normalized;
    try {
      normalized = ethers.getAddress(walletAddress);
    } catch {
      return sendError(res, 400, "Invalid wallet address.");
    }

    let recovered;
    try {
      recovered = ethers.verifyMessage(message, signature);
    } catch {
      return sendError(res, 401, "Invalid signature.");
    }

    if (recovered.toLowerCase() !== normalized.toLowerCase()) {
      return sendError(res, 401, "Signature does not match wallet address.");
    }

    if (!consumeNonceIfValid(normalized, message)) {
      return sendError(res, 401, "Invalid or expired sign-in challenge. Request a new message.");
    }

    const borrower = await findBorrowerByWalletAddress(normalized);
    if (!borrower) {
      return sendError(
        res,
        404,
        "No borrower account linked to this wallet. Sign up with email, then link MetaMask from your dashboard."
      );
    }

    if (!borrower.isActive) {
      return sendError(res, 403, "Your account has been deactivated. Contact support.");
    }
    if (borrower.isBanned) {
      return sendError(res, 403, `Your account has been banned. Reason: ${borrower.banReason}`);
    }

    const token = generateToken({ id: borrower._id, role: "borrower" });

    return sendOK(res, "Signed in with wallet.", {
      token,
      user: borrower.publicProfile,
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
    return sendOK(res, "Profile fetched.", { user: req.user.publicProfile });
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
    const user = req.user;

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

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

    if (!blockchainService.isValidAddress(walletAddress)) {
      return sendError(res, 400, "Invalid wallet address format.");
    }

    const checksummedLookup = ethers.getAddress(walletAddress);
    const existing = await Borrower.findOne({
      $expr: {
        $eq: [
          { $toLower: { $ifNull: ["$borrowerProfile.walletAddress", ""] } },
          checksummedLookup.toLowerCase(),
        ],
      },
      _id: { $ne: req.user._id },
    });
    if (existing) {
      return sendError(res, 409, "This wallet is already linked to another account.");
    }

    await Borrower.findByIdAndUpdate(req.user._id, {
      "borrowerProfile.walletAddress": checksummedLookup,
    });

    return sendOK(res, "Wallet connected successfully.", { walletAddress: checksummedLookup });
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
    const Model = req.user.role === ROLES.LENDER ? Lender : Borrower;
    const user = await Model.findById(req.user._id).select("+kyc.aadhaarNumber +kyc.panNumber");

    if (user.kyc.isVerified) {
      return sendError(res, 400, "KYC already verified.");
    }

    user.kyc.aadhaarNumber = aadhaarNumber;
    user.kyc.panNumber = panNumber;
    user.kyc.isVerified = true;
    user.kyc.verifiedAt = new Date();
    await user.save();

    return sendOK(res, "KYC submitted and verified successfully.", {
      isVerified: true,
      verifiedAt: user.kyc.verifiedAt,
    });
  } catch (err) {
    next(err);
  }
};
