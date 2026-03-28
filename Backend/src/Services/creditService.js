// src/services/creditService.js — Credit Score Logic (Node.js, no Python)
const User         = require("../Models/User");
const Loan         = require("../Models/Loan");
const { CREDIT, SCORE_TIERS, LOAN } = require("../utils/constants");

/**
 * Calculate credit score for a borrower.
 * Reads on-chain wallet history and past loan records from MongoDB.
 */
const calculateScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== "borrower") {
    throw new Error("Borrower not found");
  }
  return user.borrowerProfile.creditScore;
};

/**
 * Apply on-time repayment bonus (+100)
 */
const applyRepayBonus = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== "borrower") return;

  let newScore = Math.min(
    user.borrowerProfile.creditScore + CREDIT.REPAY_BONUS,
    CREDIT.MAX_SCORE
  );

  user.borrowerProfile.creditScore = newScore;
  await user.save();

  console.log(`✅ Credit bonus applied: user ${userId} → score ${newScore}`);
  return newScore;
};

/**
 * Apply default penalty (-150), check for ban
 */
const applyDefaultPenalty = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== "borrower") return;

  let newScore = user.borrowerProfile.creditScore - CREDIT.DEFAULT_PENALTY;

  if (newScore < CREDIT.MIN_SCORE) {
    // Permanent ban
    user.isBanned   = true;
    user.banReason  = "Credit score fell below minimum threshold after default";
    user.borrowerProfile.creditScore = 0;
    await user.save();
    console.log(`🚫 User ${userId} permanently banned after default`);
    return 0;
  }

  user.borrowerProfile.creditScore = newScore;
  await user.save();

  console.log(`⚠️  Default penalty: user ${userId} → score ${newScore}`);
  return newScore;
};

/**
 * Get the score tier object for a given score
 */
const getScoreTier = (score) => {
  return SCORE_TIERS.find((t) => score >= t.min && score <= t.max) || SCORE_TIERS[SCORE_TIERS.length - 1];
};

/**
 * Get maximum loan amount allowed for a given score
 */
const getMaxLoanAmount = (score) => {
  const tier = getScoreTier(score);
  return tier.maxLoan;
};

/**
 * Validate if a borrower is eligible for a loan of given amount
 */
const checkEligibility = async (userId, requestedAmount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.isBanned) {
    return { eligible: false, reason: "Account is permanently banned" };
  }

  const score   = user.borrowerProfile.creditScore;
  const maxLoan = getMaxLoanAmount(score);
  const tier    = getScoreTier(score);

  if (maxLoan === 0) {
    return { eligible: false, reason: "Credit score too low. Account banned.", score, tier };
  }

  if (requestedAmount < LOAN.MIN_AMOUNT_INR) {
    return { eligible: false, reason: `Minimum loan amount is ₹${LOAN.MIN_AMOUNT_INR}`, score, tier };
  }

  if (requestedAmount > LOAN.MAX_AMOUNT_INR) {
    return { eligible: false, reason: `Maximum loan amount is ₹${LOAN.MAX_AMOUNT_INR}`, score, tier };
  }

  if (requestedAmount > maxLoan) {
    return {
      eligible: false,
      reason: `Your score (${score}) allows a maximum of ₹${maxLoan}`,
      score, tier,
    };
  }

  // Check for existing active loan
  const activeLoan = await Loan.findOne({ borrower: userId, status: "active" });
  if (activeLoan) {
    return { eligible: false, reason: "You already have an active loan. Repay it first." };
  }

  return { eligible: true, score, tier, maxLoan };
};

/**
 * Calculate loan terms: interest, EMI, collateral needed
 */
const calculateLoanTerms = (amountINR, tenureMonths, cryptoPriceINR) => {
  const rate          = LOAN.RATES[tenureMonths];
  const totalInterest = Math.round((amountINR * rate * tenureMonths) / 12);
  const totalRepay    = amountINR + totalInterest;
  const monthlyEMI    = Math.round(totalRepay / tenureMonths);

  const collateralINR    = Math.ceil(amountINR * LOAN.COLLATERAL_RATIO);
  const collateralCrypto = cryptoPriceINR
    ? parseFloat((collateralINR / cryptoPriceINR).toFixed(6))
    : null;

  return {
    amountINR,
    tenureMonths,
    interestRate:   rate,
    totalInterest,
    totalRepayment: totalRepay,
    monthlyEMI,
    collateralINR,
    collateralCrypto,
  };
};

module.exports = {
  calculateScore,
  applyRepayBonus,
  applyDefaultPenalty,
  getScoreTier,
  getMaxLoanAmount,
  checkEligibility,
  calculateLoanTerms,
};