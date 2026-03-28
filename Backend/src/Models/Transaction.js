// src/models/Transaction.js — Transaction History Model
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: [
        "deposit",          // Lender deposits INR
        "interest_credit",  // Monthly interest credited to lender
        "withdrawal",       // Lender withdraws at maturity
        "loan_disbursed",   // Borrower receives INR
        "loan_repayment",   // Borrower repays EMI
        "collateral_lock",  // Borrower locks crypto
        "collateral_release", // Crypto returned to borrower
        "liquidation",      // Collateral liquidated on default
      ],
      required: true,
    },

    amountINR:     { type: Number, default: null },
    cryptoAmount:  { type: Number, default: null },
    cryptoType:    { type: String, default: null },

    // Reference to loan or deposit
    loanId:    { type: mongoose.Schema.Types.ObjectId, ref: "Loan", default: null },
    depositId: { type: mongoose.Schema.Types.ObjectId, ref: "Deposit", default: null },

    // Blockchain details
    txHash:  { type: String, default: null },
    network: { type: String, default: "Polygon Mumbai" },

    description: { type: String, default: null },
    status:      { type: String, enum: ["pending", "success", "failed"], default: "success" },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);