    // src/utils/constants.js — App-wide constants

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = {
  LENDER:   "lender",
  BORROWER: "borrower",
};

// ── Loan Status ───────────────────────────────────────────────────────────────
const LOAN_STATUS = {
  PENDING:              "pending",               // Legacy / reserved
  AWAITING_COLLATERAL:  "awaiting_collateral",    // Draft: lock collateral on-chain next
  ACTIVE:               "active",                // INR disbursed, loan ongoing
  REPAID:      "repaid",       // Fully repaid, crypto returned
  DEFAULTED:   "defaulted",    // Grace period passed, liquidated
  LIQUIDATED:  "liquidated",   // Collateral sold, lender paid
};

// ── Deposit Status ────────────────────────────────────────────────────────────
const DEPOSIT_STATUS = {
  ACTIVE:   "active",
  MATURED:  "matured",
  WITHDRAWN: "withdrawn",
};

// ── Credit Score ──────────────────────────────────────────────────────────────
const CREDIT = {
  STARTING_SCORE:    500,
  MAX_SCORE:         1000,
  MIN_SCORE:         200,
  REPAY_BONUS:       100,   // +100 on on-time repayment
  DEFAULT_PENALTY:   150,   // -150 on default
  BAN_THRESHOLD:     200,   // Below this → permanent ban
};

// ── Loan Limits ───────────────────────────────────────────────────────────────
const LOAN = {
  MIN_AMOUNT_INR:   2000,
  MAX_AMOUNT_INR:   20000,
  COLLATERAL_RATIO: 1.5,    // 150%
  // Interest rates per annum (decimal)
  RATES: {
    3:  0.10,  // 3-month loan: 10% p.a.
    6:  0.11,  // 6-month loan: 11% p.a.
    12: 0.12,  // 12-month loan: 12% p.a.
  },
  GRACE_PERIOD_HOURS: 24,   // Grace before liquidation
};

// ── Deposit Rates ─────────────────────────────────────────────────────────────
const DEPOSIT = {
  MIN_AMOUNT_INR: 1000,
  RATES: {
    3:  0.08,   // 3 months: 8% p.a.
    6:  0.085,  // 6 months: 8.5% p.a.
    12: 0.09,   // 12 months: 9% p.a.
  },
};

// ── Score Tier → Max Loan ────────────────────────────────────────────────────
const SCORE_TIERS = [
  { min: 700, max: 1000, maxLoan: 20000, risk: "Low Risk" },
  { min: 400, max: 699,  maxLoan: 10000, risk: "Medium Risk" },
  { min: 200, max: 399,  maxLoan: 5000,  risk: "High Risk" },
  { min: 0,   max: 199,  maxLoan: 0,     risk: "Banned" },
];

// ── Accepted Crypto ───────────────────────────────────────────────────────────
const ACCEPTED_CRYPTO = ["ETH", "BTC", "MATIC"];

// ── Payment Methods ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = ["UPI", "NEFT", "IMPS"];

module.exports = {
  ROLES,
  LOAN_STATUS,
  DEPOSIT_STATUS,
  CREDIT,
  LOAN,
  DEPOSIT,
  SCORE_TIERS,
  ACCEPTED_CRYPTO,
  PAYMENT_METHODS,
}; 