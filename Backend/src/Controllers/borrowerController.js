// src/controllers/borrowerController.js — Borrower Operations
const { ethers }      = require("ethers");
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

function buildRepaymentSchedule(tenureMonths, monthlyEMI) {
  const schedule = [];
  for (let i = 1; i <= tenureMonths; i++) {
    schedule.push({
      emiNumber: i,
      amountINR: monthlyEMI,
      status: "pending",
      paidAt: null,
    });
  }
  return schedule;
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
    const draftLoan = loans.find((l) => l.status === LOAN_STATUS.AWAITING_COLLATERAL);
    const score      = user.borrowerProfile.creditScore;
    const tier       = creditService.getScoreTier(score);
    const maxLoan    = creditService.getMaxLoanAmount(score);

    return sendOK(res, "Dashboard loaded.", {
      creditScore: { score, tier: tier.risk, maxLoan },
      activeLoan:  activeLoan || null,
      draftLoan:   draftLoan || null,
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
// POST /api/borrower/loan-draft
// Body: { amountINR, tenureMonths, cryptoType }
// ─────────────────────────────────────────────────────────────────────────────
exports.createLoanDraft = async (req, res, next) => {
  try {
    const { amountINR, tenureMonths, cryptoType } = req.body;
    const userId = req.user._id;
    const user = await Borrower.findById(userId);

    if (!user.kyc.isVerified) {
      return sendError(res, 403, "Please complete KYC verification before applying for a loan.");
    }
    if (!user.borrowerProfile.walletAddress) {
      return sendError(res, 403, "Please connect your MetaMask wallet first.");
    }

    const eligibility = await creditService.checkEligibility(userId, amountINR);
    if (!eligibility.eligible) {
      return sendError(res, 403, eligibility.reason);
    }

    const cryptoPrice = await blockchainService.getCryptoPriceINR(cryptoType);
    const terms = creditService.calculateLoanTerms(amountINR, tenureMonths, cryptoPrice);
    const schedule = buildRepaymentSchedule(tenureMonths, terms.monthlyEMI);

    const collateralWei = ethers
      .parseEther(Number(terms.collateralCrypto).toFixed(18))
      .toString();

    const loan = await Loan.create({
      borrower: userId,
      amountINR,
      tenureMonths,
      interestRate: terms.interestRate,
      totalInterest: terms.totalInterest,
      totalRepayment: terms.totalRepayment,
      monthlyEMI: terms.monthlyEMI,
      collateral: {
        cryptoType,
        cryptoAmount: terms.collateralCrypto,
        inrValueAtLock: terms.collateralINR,
        contractTxHash: null,
      },
      status: LOAN_STATUS.AWAITING_COLLATERAL,
      startDate: null,
      dueDate: null,
      disbursement: {
        method: null,
        bankAccount: null,
        disbursedAt: null,
        referenceId: null,
      },
      repaymentSchedule: schedule,
      blockchainData: { expectedCollateralWei: collateralWei },
    });

    return sendCreated(res, "Loan application created. Lock collateral in MetaMask next.", {
      loan,
      lockInstructions: {
        loanId: loan.loanId,
        collateralWei,
        collateralHuman: String(terms.collateralCrypto),
        cryptoType,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/borrower/confirm-loan
// Body: { loanId, collateralTxHash }
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmLoan = async (req, res, next) => {
  try {
    const { loanId, collateralTxHash } = req.body;
    const userId = req.user._id;
    const user = await Borrower.findById(userId);

    const loan = await Loan.findOne({
      borrower: userId,
      loanId: String(loanId).trim(),
      status: LOAN_STATUS.AWAITING_COLLATERAL,
    });
    if (!loan) {
      return sendError(res, 404, "No pending application found for this loan id.");
    }

    try {
      await blockchainService.verifyCollateralLock(collateralTxHash, {
        borrowerWallet: user.borrowerProfile.walletAddress,
        loanId: loan.loanId,
        expectedWei: loan.blockchainData?.expectedCollateralWei,
      });
    } catch (e) {
      return sendError(res, 400, e.message || "Collateral verification failed.");
    }

    const startDate = new Date();
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + loan.tenureMonths);

    loan.status = LOAN_STATUS.ACTIVE;
    loan.startDate = startDate;
    loan.dueDate = dueDate;
    loan.collateral.contractTxHash = collateralTxHash;
    const priorBd =
      loan.blockchainData?.toObject?.() || loan.blockchainData || {};
    loan.blockchainData = {
      ...priorBd,
      collateralLockTx: collateralTxHash,
    };
    loan.markModified("blockchainData");
    loan.disbursement = {
      method: "NEFT",
      bankAccount: user.borrowerProfile.bankAccountNumber,
      disbursedAt: new Date(),
      referenceId: `DISB-${Date.now()}`,
    };

    await loan.save();

    await Borrower.findByIdAndUpdate(userId, {
      $inc: {
        "borrowerProfile.totalBorrowed": loan.amountINR,
        "borrowerProfile.activeLoans": 1,
      },
    });

    await Transaction.create([
      {
        user: userId,
        userKind: "Borrower",
        type: "collateral_lock",
        cryptoAmount: loan.collateral.cryptoAmount,
        cryptoType: loan.collateral.cryptoType,
        loanId: loan._id,
        txHash: collateralTxHash,
        description: `Collateral locked for loan ${loan.loanId}`,
      },
      {
        user: userId,
        userKind: "Borrower",
        type: "loan_disbursed",
        amountINR: loan.amountINR,
        loanId: loan._id,
        description: `Loan ${loan.loanId} disbursed to bank account`,
      },
    ]);

    return sendCreated(res, "Loan approved! INR will be disbursed to your bank in 2–4 hours.", {
      loan,
      disbursementDetails: {
        amountINR: loan.amountINR,
        bankAccount: user.borrowerProfile.bankAccountNumber,
        expectedBy: "2–4 banking hours",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/borrower/loan-draft/:loanId
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelLoanDraft = async (req, res, next) => {
  try {
    const loan = await findLoanForBorrower(req.params.loanId, req.user._id);
    if (!loan) return sendError(res, 404, "Loan not found.");
    if (loan.status !== LOAN_STATUS.AWAITING_COLLATERAL) {
      return sendError(res, 400, "Only draft applications can be cancelled.");
    }
    await Loan.deleteOne({ _id: loan._id });
    return sendOK(res, "Draft cancelled.", {});
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
      const releaseWei =
        loan.blockchainData?.expectedCollateralWei ||
        ethers.parseEther(Number(loan.collateral.cryptoAmount).toFixed(18)).toString();

      const releaseResult = await blockchainService.releaseCollateral(
        user.borrowerProfile.walletAddress,
        loan.loanId,
        releaseWei
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