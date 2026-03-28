// src/controllers/creditController.js — Credit Score Endpoints
const Borrower = require("../Models/Borrower");
const creditService = require("../Services/creditService");
const { sendOK, sendError } = require("../utils/response");
const { SCORE_TIERS } = require("../utils/constants");

// GET /api/credit/score  — get current borrower's score + tier
exports.getMyScore = async (req, res, next) => {
  try {
    const { borrowerProfile } = req.user;
    const score = borrowerProfile.creditScore;
    const tier = creditService.getScoreTier(score);
    const max = creditService.getMaxLoanAmount(score);

    return sendOK(res, "Credit score fetched.", {
      score,
      tier: tier.risk,
      maxLoan: max,
      tiers: SCORE_TIERS,
      rules: {
        startingScore: 500,
        repayBonus: "+100 on on-time repayment",
        defaultPenalty: "-150 on default",
        minFloor: 200,
        maxCap: 1000,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/credit/score/:walletAddress  — public score lookup by wallet
exports.getScoreByWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const user = await Borrower.findOne({ "borrowerProfile.walletAddress": walletAddress });
    if (!user) return sendError(res, 404, "No borrower found with this wallet address.");

    const score = user.borrowerProfile.creditScore;
    const tier = creditService.getScoreTier(score);

    return sendOK(res, "Score fetched.", {
      walletAddress,
      score,
      tier: tier.risk,
    });
  } catch (err) {
    next(err);
  }
};
