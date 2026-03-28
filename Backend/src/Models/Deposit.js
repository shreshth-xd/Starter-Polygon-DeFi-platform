// src/models/Deposit.js — Lender Deposit Model
const mongoose = require("mongoose");
const { DEPOSIT_STATUS } = require("../utils/constants");

const DepositSchema = new mongoose.Schema(
  {
    depositId: { type: String, unique: true, required: true },

    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lender",
      required: true,
    },

    // ── Terms ─────────────────────────────────────────────────────────────
    amountINR:      { type: Number, required: true, min: 1000 },
    tenureMonths:   { type: Number, required: true, enum: [3, 6, 12] },
    interestRate:   { type: Number, required: true },    // e.g. 0.09
    totalInterest:  { type: Number, required: true },
    maturityValue:  { type: Number, required: true },
    monthlyCredit:  { type: Number, required: true },

    // ── Dates ─────────────────────────────────────────────────────────────
    startDate:    { type: Date, default: Date.now },
    maturityDate: { type: Date, required: true },
    status:       { type: String, enum: Object.values(DEPOSIT_STATUS), default: DEPOSIT_STATUS.ACTIVE },
    withdrawnAt:  { type: Date, default: null },

    // ── Payment ───────────────────────────────────────────────────────────
    payment: {
      method:      { type: String, default: null },   // UPI/NEFT/IMPS
      upiId:       { type: String, default: null },
      referenceId: { type: String, default: null },
      confirmedAt: { type: Date, default: null },
    },

    // ── Earned ───────────────────────────────────────────────────────────
    earnedInterest: { type: Number, default: 0 },

    // ── Monthly credits log ───────────────────────────────────────────────
    creditHistory: [
      {
        month:     Date,
        amountINR: Number,
        creditedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

DepositSchema.pre("save", function (next) {
  if (!this.depositId) {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 90000) + 10000;
    this.depositId = `DEP-${year}-${rand}`;
  }
  next();
});

DepositSchema.index({ lender: 1 });
DepositSchema.index({ status: 1, maturityDate: 1 });

module.exports = mongoose.model("Deposit", DepositSchema);