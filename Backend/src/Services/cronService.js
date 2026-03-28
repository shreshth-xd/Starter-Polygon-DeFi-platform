// src/services/cronService.js — Daily Cron Jobs
const cron             = require("node-cron");
const Loan             = require("../Models/Loan");
const Deposit          = require("../Models/Deposit");
const User             = require("../Models/User");
const Transaction      = require("../Models/Transaction");
const { applyDefaultPenalty } = require("./creditService");
const { liquidateCollateral } = require("./blockchainService");
const { LOAN_STATUS, DEPOSIT_STATUS, DEPOSIT } = require("../utils/constants");

// ── 1. Check overdue loans and trigger liquidation ────────────────────────────
const checkOverdueLoans = async () => {
  console.log("🕐 [CRON] Checking overdue loans...");
  try {
    const graceDeadline = new Date();
    graceDeadline.setHours(graceDeadline.getHours() - 24); // 24hr grace

    const overdueLoans = await Loan.findOne({
      status:  LOAN_STATUS.ACTIVE,
      dueDate: { $lt: graceDeadline },
    }).populate("borrower");

    for (const loan of overdueLoans) {
      console.log(`⚠️  Liquidating loan ${loan.loanId}`);
      try {
        // Trigger smart contract liquidation
        const result = await liquidateCollateral(
          loan.borrower.borrowerProfile.walletAddress,
          loan.loanId
        );

        // Update loan
        loan.status = LOAN_STATUS.LIQUIDATED;
        loan.closedDate = new Date();
        loan.liquidation = {
          liquidatedAt:   new Date(),
          txHash:         result.txHash,
          amountReceived: loan.collateral.inrValueAtLock,
        };
        await loan.save();

        // Penalise credit score
        await applyDefaultPenalty(loan.borrower._id);

        // Update borrower stats
        await User.findByIdAndUpdate(loan.borrower._id, {
          $inc: { "borrowerProfile.activeLoans": -1 },
        });

        // Log transaction
        await Transaction.create({
          user:        loan.borrower._id,
          type:        "liquidation",
          cryptoAmount: loan.collateral.cryptoAmount,
          cryptoType:  loan.collateral.cryptoType,
          loanId:      loan._id,
          txHash:      result.txHash,
          description: `Collateral liquidated for loan ${loan.loanId}`,
        });

        console.log(`✅ Loan ${loan.loanId} liquidated. Tx: ${result.txHash}`);
      } catch (err) {
        console.error(`❌ Liquidation failed for ${loan.loanId}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ [CRON] checkOverdueLoans error:", err.message);
  }
};

// ── 2. Credit monthly interest to lenders ────────────────────────────────────
const creditMonthlyInterest = async () => {
  console.log("💰 [CRON] Crediting monthly interest to lenders...");
  try {
    const now    = new Date();
    const month  = now.getMonth();
    const year   = now.getFullYear();

    const activeDeposits = await Deposit.find({ status: DEPOSIT_STATUS.ACTIVE });

    for (const deposit of activeDeposits) {
      // Check if already credited this month
      const alreadyCredited = deposit.creditHistory.some((c) => {
        const d = new Date(c.month);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      if (alreadyCredited) continue;

      const monthlyInterest = Math.round(deposit.monthlyCredit);

      deposit.earnedInterest += monthlyInterest;
      deposit.creditHistory.push({ month: now, amountINR: monthlyInterest });
      await deposit.save();

      // Update lender's total earned
      await User.findByIdAndUpdate(deposit.lender, {
        $inc: { "lenderProfile.totalEarned": monthlyInterest },
      });

      // Log transaction
      await Transaction.create({
        user:      deposit.lender,
        type:      "interest_credit",
        amountINR: monthlyInterest,
        depositId: deposit._id,
        description: `Monthly interest for deposit ${deposit.depositId}`,
      });

      console.log(`✅ Credited ₹${monthlyInterest} to deposit ${deposit.depositId}`);
    }
  } catch (err) {
    console.error("❌ [CRON] creditMonthlyInterest error:", err.message);
  }
};

// ── 3. Mark matured deposits ──────────────────────────────────────────────────
const markMaturedDeposits = async () => {
  console.log("📅 [CRON] Checking matured deposits...");
  try {
    await Deposit.updateMany(
      { status: DEPOSIT_STATUS.ACTIVE, maturityDate: { $lte: new Date() } },
      { $set: { status: DEPOSIT_STATUS.MATURED } }
    );
  } catch (err) {
    console.error("❌ [CRON] markMaturedDeposits error:", err.message);
  }
};

// ── Register all cron jobs ────────────────────────────────────────────────────
const startAll = () => {
  // Every day at 00:01 AM
  cron.schedule("1 0 * * *", checkOverdueLoans);

  // 1st of every month at 08:00 AM
  cron.schedule("0 8 1 * *", creditMonthlyInterest);

  // Every day at 00:05 AM
  cron.schedule("5 0 * * *", markMaturedDeposits);

  console.log("⏰ Cron jobs started (overdue loans, monthly interest, deposit maturity)");
};

module.exports = { startAll, checkOverdueLoans, creditMonthlyInterest };