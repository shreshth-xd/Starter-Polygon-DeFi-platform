// src/controllers/borrowerController.js — Borrower Operations
const mongoose          = require("mongoose");
const Borrower         = require("../Models/Borrower");
const Loan             = require("../Models/Loan");
const Transaction      = require("../Models/Transaction");
const creditService    = require("../Services/creditService");
const blockchainService = require("../Services/blockchainService");
const { sendOK, sendCreated, sendError } = require("../utils/response");
const { LOAN_STATUS, LOAN } = require("../utils/constants");

async function findLoanForBorrower(rawId, borrowerId) {
  const base = { borrower: borrowerId };
  if (mongoose.Types.ObjectId.isValid(rawId)) {
    const byId = await Loan.findOne({ ...base, _id: rawId });
    if (byId) return byId;
  }
  return Loan.findOne({ ...base, loanId: rawId });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/borrower/dashboard
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user   = await Borrower.findById(userId);

    const [loans, transactions] = await Promise.all([
      Loan.find({ borrower: userId }).sort({ createdAt: -1 }),
      Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const activeLoan = loans.find((l) => l.status === LOAN_STATUS.ACTIVE);
    const score      = user.borrowerProfile.creditScore;
    const tier       = creditService.getScoreTier(score);
    const maxLoan    = creditService.getMaxLoanAmount(score);

    return sendOK(res, "Dashboard loaded.", {
      creditScore: { score, tier: tier.risk, maxLoan },
      activeLoan:  activeLoan || null,
      loanHistory: loans,
      recentTransactions: transactions,
      stats: {
        totalBorrowed: user.borrowerProfile.totalBorrowed,
        totalRepaid:   user.borrowerProfile.totalRepaid,
        activeLoans:   user.borrowerProfile.activeLoans,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/borrower/check-eligibility
// Body: { amountINR }
// ─────────────────────────────────────────────────────────────────────────────
exports.checkEligibility = async (req, res, next) => {
  try {
    const { amountINR } = req.body;
    const result = await creditService.checkEligibility(req.user._id, amountINR);
    return sendOK(res, "Eligibility checked.", result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/borrower/calculate-loan
// Body: { amountINR, tenureMonths, cryptoType }
// ─────────────────────────────────────────────────────────────────────────────
exports.calculateLoan = async (req, res, next) => {
  try {
    const { amountINR, tenureMonths, cryptoType } = req.body;

    if (!LOAN.RATES[tenureMonths]) {
      return sendError(res, 400, "Invalid tenure. Choose 3, 6, or 12 months.");
    }

    const cryptoPrice = await blockchainService.getCryptoPriceINR(cryptoType || "ETH");
    const terms       = creditService.calculateLoanTerms(amountINR, tenureMonths, cryptoPrice);

    return sendOK(res, "Loan terms calculated.", {
      ...terms,
      cryptoType:   cryptoType || "ETH",
      cryptoPrice,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/borrower/apply-loan
// Body: { amountINR, tenureMonths, cryptoType, collateralTxHash }
// (Borrower has already locked collateral from MetaMask and sends txHash)
// ─────────────────────────────────────────────────────────────────────────────
exports.applyLoan = async (req, res, next) => {
  try {
    const { amountINR, tenureMonths, cryptoType, collateralTxHash } = req.body;
    const userId = req.user._id;
    const user   = await Borrower.findById(userId);

    // KYC check
    if (!user.kyc.isVerified) {
      return sendError(res, 403, "Please complete KYC verification before applying for a loan.");
    }

    // Wallet check
    if (!user.borrowerProfile.walletAddress) {
      return sendError(res, 403, "Please connect your MetaMask wallet first.");
    }

    // Eligibility check
    const eligibility = await creditService.checkEligibility(userId, amountINR);
    if (!eligibility.eligible) {
      return sendError(res, 403, eligibility.reason);
    }

    // Verify collateral lock on Polygon
    const txVerification = await blockchainService.verifyCollateralLock(collateralTxHash);
    if (!txVerification.success) {
      return sendError(res, 400, "Collateral transaction could not be verified on Polygon.");
    }

    // Calculate terms
    const cryptoPrice = await blockchainService.getCryptoPriceINR(cryptoType);
    const terms       = creditService.calculateLoanTerms(amountINR, tenureMonths, cryptoPrice);

    // Build repayment schedule
    const schedule = [];
    const startDate = new Date();
    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        emiNumber:  i,
        amountINR:  terms.monthlyEMI,
        status:     "pending",
        paidAt:     null,
      });
    }

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + tenureMonths);

    const loan = await Loan.create({
      borrower:       userId,
      amountINR,
      tenureMonths,
      interestRate:   terms.interestRate,
      totalInterest:  terms.totalInterest,
      totalRepayment: terms.totalRepayment,
      monthlyEMI:     terms.monthlyEMI,
      collateral: {
        cryptoType,
        cryptoAmount:   terms.collateralCrypto,
        inrValueAtLock: terms.collateralINR,
        contractTxHash: collateralTxHash,
      },
      status:             LOAN_STATUS.ACTIVE,
      startDate:          new Date(),
      dueDate,
      disbursement: {
        method:      "NEFT",
        bankAccount: user.borrowerProfile.bankAccountNumber,
        disbursedAt: new Date(),
        referenceId: `DISB-${Date.now()}`,
      },
      repaymentSchedule: schedule,
      blockchainData: { collateralLockTx: collateralTxHash },
    });

    // Update borrower stats
    await Borrower.findByIdAndUpdate(userId, {
      $inc: {
        "borrowerProfile.totalBorrowed": amountINR,
        "borrowerProfile.activeLoans":   1,
      },
    });

    // Log transactions
    await Transaction.create([
      {
        user: userId,
        userKind: "Borrower",
        type: "collateral_lock",
        cryptoAmount: terms.collateralCrypto,
        cryptoType,
        loanId: loan._id,
        txHash: collateralTxHash,
        description: `Collateral locked for loan ${loan.loanId}`,
      },
      {
        user: userId,
        userKind: "Borrower",
        type: "loan_disbursed",
        amountINR,
        loanId: loan._id,
        description: `Loan ${loan.loanId} disbursed to bank account`,
      },
    ]);

    return sendCreated(res, "Loan approved! INR will be disbursed to your bank in 2–4 hours.", {
      loan,
      disbursementDetails: {
        amountINR,
        bankAccount: user.borrowerProfile.bankAccountNumber,
        expectedBy:  "2–4 banking hours",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/borrower/loans
// ─────────────────────────────────────────────────────────────────────────────
exports.getLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ borrower: req.user._id }).sort({ createdAt: -1 });
    return sendOK(res, "Loans fetched.", { loans, count: loans.length });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/borrower/loans/:loanId
// ─────────────────────────────────────────────────────────────────────────────
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await findLoanForBorrower(req.params.loanId, req.user._id);
    if (!loan) return sendError(res, 404, "Loan not found.");
    return sendOK(res, "Loan fetched.", { loan });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/borrower/loans/:loanId/repay
// Body: { amountINR, paymentMethod, transactionId }
// ─────────────────────────────────────────────────────────────────────────────
exports.repayLoan = async (req, res, next) => {
  try {
    const { amountINR, paymentMethod, transactionId } = req.body;
    const loan = await findLoanForBorrower(req.params.loanId, req.user._id);

    if (!loan)                            return sendError(res, 404, "Loan not found.");
    if (loan.status !== LOAN_STATUS.ACTIVE) return sendError(res, 400, "Loan is not active.");

    // Find next pending EMI
    const nextEMI = loan.repaymentSchedule.find((e) => e.status === "pending");
    if (!nextEMI) return sendError(res, 400, "All EMIs already paid.");

    nextEMI.status        = "paid";
    nextEMI.paidAt        = new Date();
    nextEMI.paymentMethod = paymentMethod;
    nextEMI.transactionId = transactionId;

    // Check if all EMIs paid
    const allPaid = loan.repaymentSchedule.every((e) => e.status === "paid");

    if (allPaid) {
      // Release collateral via smart contract
      const user = await Borrower.findById(req.user._id);
      const releaseResult = await blockchainService.releaseCollateral(
        user.borrowerProfile.walletAddress,
        loan.loanId,
        loan.collateral.cryptoAmount.toString()
      );

      loan.status    = LOAN_STATUS.REPAID;
      loan.closedDate = new Date();
      loan.blockchainData.releaseTx = releaseResult.txHash;

      // Apply credit bonus
      await creditService.applyRepayBonus(req.user._id);

      // Update borrower stats
      await Borrower.findByIdAndUpdate(req.user._id, {
        $inc: {
          "borrowerProfile.totalRepaid": loan.totalRepayment,
          "borrowerProfile.activeLoans": -1,
        },
      });

      // Log collateral release
      await Transaction.create({
        user: req.user._id,
        userKind: "Borrower",
        type: "collateral_release",
        cryptoAmount: loan.collateral.cryptoAmount,
        cryptoType: loan.collateral.cryptoType,
        loanId: loan._id,
        txHash: releaseResult.txHash,
        description: `Collateral released — loan ${loan.loanId} fully repaid`,
      });
    }

    await loan.save();

    // Log repayment transaction
    await Transaction.create({
      user: req.user._id,
      userKind: "Borrower",
      type: "loan_repayment",
      amountINR,
      loanId: loan._id,
      description: `EMI ${nextEMI.emiNumber} paid for loan ${loan.loanId}`,
    });

    return sendOK(res, allPaid
      ? "Loan fully repaid! Your crypto collateral has been released back to your wallet."
      : `EMI ${nextEMI.emiNumber} paid successfully.`,
      { loan, fullyRepaid: allPaid }
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/borrower/transactions
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