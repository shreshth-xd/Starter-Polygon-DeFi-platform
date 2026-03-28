// src/controllers/lenderController.js — Lender Operations
const User        = require("../Models/User");
const Deposit     = require("../Models/Deposit");
const Transaction = require("../Models/Transaction");
const { sendOK, sendCreated, sendError } = require("../utils/response");
const { DEPOSIT_STATUS, DEPOSIT } = require("../utils/constants");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lender/dashboard
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [deposits, transactions] = await Promise.all([
      Deposit.find({ lender: userId }).sort({ createdAt: -1 }),
      Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const activeDeposits  = deposits.filter((d) => d.status === DEPOSIT_STATUS.ACTIVE);
    const maturedDeposits = deposits.filter((d) => d.status === DEPOSIT_STATUS.MATURED);

    const totalDeposited = deposits.reduce((s, d) => s + d.amountINR, 0);
    const totalEarned    = deposits.reduce((s, d) => s + d.earnedInterest, 0);

    return sendOK(res, "Dashboard loaded.", {
      stats: {
        totalDeposited,
        totalEarned,
        activeDepositsCount:  activeDeposits.length,
        maturedDepositsCount: maturedDeposits.length,
      },
      activeDeposits,
      recentTransactions: transactions,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lender/deposit
// Body: { amountINR, tenureMonths, paymentMethod, upiId? }
// ─────────────────────────────────────────────────────────────────────────────
exports.createDeposit = async (req, res, next) => {
  try {
    const { amountINR, tenureMonths, paymentMethod, upiId } = req.body;

    if (amountINR < DEPOSIT.MIN_AMOUNT_INR) {
      return sendError(res, 400, `Minimum deposit is ₹${DEPOSIT.MIN_AMOUNT_INR}`);
    }

    const rate          = DEPOSIT.RATES[tenureMonths];
    const totalInterest = Math.round((amountINR * rate * tenureMonths) / 12);
    const maturityValue = amountINR + totalInterest;
    const monthlyCredit = Math.round(totalInterest / tenureMonths);

    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

    const deposit = await Deposit.create({
      lender:       req.user._id,
      amountINR,
      tenureMonths,
      interestRate: rate,
      totalInterest,
      maturityValue,
      monthlyCredit,
      maturityDate,
      status:       DEPOSIT_STATUS.ACTIVE,
      payment: {
        method:      paymentMethod,
        upiId:       upiId || null,
        referenceId: `PAY-${Date.now()}`,
        confirmedAt: new Date(),
      },
    });

    // Update lender stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "lenderProfile.totalDeposited": amountINR },
    });

    // Log transaction
    await Transaction.create({
      user:      req.user._id,
      type:      "deposit",
      amountINR,
      depositId: deposit._id,
      description: `Deposit created — ${tenureMonths}M plan at ${rate * 100}% p.a.`,
    });

    return sendCreated(res, "Deposit created successfully! You will start earning interest.", {
      deposit,
      summary: { amountINR, tenureMonths, interestRate: rate, totalInterest, maturityValue, monthlyCredit, maturityDate },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lender/deposits
// ─────────────────────────────────────────────────────────────────────────────
exports.getDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({ lender: req.user._id }).sort({ createdAt: -1 });
    return sendOK(res, "Deposits fetched.", { deposits, count: deposits.length });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lender/deposits/:depositId
// ─────────────────────────────────────────────────────────────────────────────
exports.getDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findOne({
      depositId: req.params.depositId,
      lender:    req.user._id,
    });
    if (!deposit) return sendError(res, 404, "Deposit not found.");
    return sendOK(res, "Deposit fetched.", { deposit });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lender/deposits/:depositId/withdraw
// ─────────────────────────────────────────────────────────────────────────────
exports.withdrawDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findOne({
      depositId: req.params.depositId,
      lender:    req.user._id,
    });

    if (!deposit) return sendError(res, 404, "Deposit not found.");
    if (deposit.status !== DEPOSIT_STATUS.MATURED) {
      return sendError(res, 400, "Deposit is not yet matured.");
    }

    deposit.status      = DEPOSIT_STATUS.WITHDRAWN;
    deposit.withdrawnAt = new Date();
    await deposit.save();

    await Transaction.create({
      user:      req.user._id,
      type:      "withdrawal",
      amountINR: deposit.maturityValue,
      depositId: deposit._id,
      description: `Maturity withdrawal — ${deposit.depositId}`,
    });

    return sendOK(res, "Withdrawal initiated. Funds will arrive in your bank in 24 hours.", {
      amountINR: deposit.maturityValue,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lender/transactions
// ─────────────────────────────────────────────────────────────────────────────
exports.getTransactions = async (req, res, next) => {
  try {
    const txns = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return sendOK(res, "Transactions fetched.", { transactions: txns, count: txns.length });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lender/calculator
// Query: ?amount=50000&tenure=12
// ─────────────────────────────────────────────────────────────────────────────
exports.calculateEarnings = async (req, res, next) => {
  try {
    const amount  = parseFloat(req.query.amount  || 0);
    const tenure  = parseInt(req.query.tenure    || 12);

    if (!DEPOSIT.RATES[tenure]) {
      return sendError(res, 400, "Invalid tenure. Choose 3, 6, or 12 months.");
    }

    const rate          = DEPOSIT.RATES[tenure];
    const totalInterest = Math.round((amount * rate * tenure) / 12);
    const maturityValue = amount + totalInterest;
    const monthlyCredit = Math.round(totalInterest / tenure);

    return sendOK(res, "Calculation complete.", {
      amountINR:    amount,
      tenureMonths: tenure,
      interestRate: rate,
      totalInterest,
      maturityValue,
      monthlyCredit,
    });
  } catch (err) {
    next(err);
  }
};