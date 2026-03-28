// src/models/Loan.js — Loan Model
const mongoose = require("mongoose");
const { LOAN_STATUS, ACCEPTED_CRYPTO } = require("../utils/constants");

const RepaymentSchema = new mongoose.Schema({
  emiNumber:     { type: Number, required: true },
  amountINR:     { type: Number, required: true },
  paidAt:        { type: Date, default: null },
  status:        { type: String, enum: ["paid", "pending", "overdue"], default: "pending" },
  paymentMethod: { type: String, default: null },
  transactionId: { type: String, default: null },
});

const LoanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      unique: true,
      required: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Loan Terms ────────────────────────────────────────────────────────
    amountINR:       { type: Number, required: true, min: 2000, max: 20000 },
    tenureMonths:    { type: Number, required: true, enum: [3, 6, 12] },
    interestRate:    { type: Number, required: true },   // e.g. 0.11 = 11%
    totalInterest:   { type: Number, required: true },
    totalRepayment:  { type: Number, required: true },
    monthlyEMI:      { type: Number, required: true },

    // ── Collateral ────────────────────────────────────────────────────────
    collateral: {
      cryptoType:       { type: String, enum: ACCEPTED_CRYPTO, required: true },
      cryptoAmount:     { type: Number, required: true },    // e.g. 0.304 ETH
      inrValueAtLock:   { type: Number, required: true },    // INR value when locked
      contractTxHash:   { type: String, default: null },     // Lock tx hash
    },

    // ── Status + Dates ────────────────────────────────────────────────────
    status:       { type: String, enum: Object.values(LOAN_STATUS), default: LOAN_STATUS.PENDING },
    startDate:    { type: Date, default: null },
    dueDate:      { type: Date, default: null },
    closedDate:   { type: Date, default: null },

    // ── Disbursement ──────────────────────────────────────────────────────
    disbursement: {
      method:        { type: String, default: null },   // NEFT/IMPS/UPI
      bankAccount:   { type: String, default: null },
      disbursedAt:   { type: Date, default: null },
      referenceId:   { type: String, default: null },
    },

    // ── Repayment Schedule ────────────────────────────────────────────────
    repaymentSchedule: [RepaymentSchema],

    // ── Liquidation ───────────────────────────────────────────────────────
    liquidation: {
      liquidatedAt:  { type: Date, default: null },
      txHash:        { type: String, default: null },
      amountReceived: { type: Number, default: null },
    },

    // ── Blockchain ───────────────────────────────────────────────────────
    blockchainData: {
      collateralLockTx:   { type: String, default: null },
      releaseTx:          { type: String, default: null },
      liquidationTx:      { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Auto-generate loan ID before saving
LoanSchema.pre("save", function (next) {
  if (!this.loanId) {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 90000) + 10000;
    this.loanId = `CA-${year}-${rand}`;
  }
  next();
});

LoanSchema.index({ borrower: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Loan", LoanSchema);