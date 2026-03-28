// src/models/User.js — User Model (covers both Lender and Borrower)
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const { ROLES, CREDIT } = require("../utils/constants");

const UserSchema = new mongoose.Schema(
  {
    // ── Personal Info ──────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9]{10,13}$/, "Please enter a valid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries
    },

    // ── Role ───────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, "Role is required"],
    },

    // ── KYC ───────────────────────────────────────────────────────────────
    kyc: {
      isVerified:    { type: Boolean, default: false },
      aadhaarNumber: { type: String, default: null, select: false },
      panNumber:     { type: String, default: null, select: false },
      verifiedAt:    { type: Date, default: null },
    },

    // ── Account Status ────────────────────────────────────────────────────
    isActive:  { type: Boolean, default: true },
    isBanned:  { type: Boolean, default: false },
    banReason: { type: String, default: null },

    // ── Lender-specific ───────────────────────────────────────────────────
    lenderProfile: {
      upiId:         { type: String, default: null },
      totalDeposited: { type: Number, default: 0 },
      totalEarned:   { type: Number, default: 0 },
    },

    // ── Borrower-specific ─────────────────────────────────────────────────
    borrowerProfile: {
      bankAccountNumber: { type: String, default: null },
      ifscCode:         { type: String, default: null },
      creditScore:      { type: Number, default: CREDIT.STARTING_SCORE },
      walletAddress:    { type: String, default: null },  // MetaMask address
      totalBorrowed:    { type: Number, default: 0 },
      totalRepaid:      { type: Number, default: 0 },
      activeLoans:      { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ "borrowerProfile.walletAddress": 1 });
UserSchema.index({ role: 1 });

// ── Pre-save hook — hash password ─────────────────────────────────────────────
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method — compare password ───────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual — safe public profile ─────────────────────────────────────────────
UserSchema.virtual("publicProfile").get(function () {
  return {
    id:       this._id,
    fullName: this.fullName,
    email:    this.email,
    phone:    this.phone,
    role:     this.role,
    isActive: this.isActive,
    isBanned: this.isBanned,
    kyc:      { isVerified: this.kyc.isVerified },
    ...(this.role === "lender" && { lenderProfile: this.lenderProfile }),
    ...(this.role === "borrower" && {
      borrowerProfile: {
        creditScore:   this.borrowerProfile.creditScore,
        walletAddress: this.borrowerProfile.walletAddress,
        totalBorrowed: this.borrowerProfile.totalBorrowed,
        totalRepaid:   this.borrowerProfile.totalRepaid,
        activeLoans:   this.borrowerProfile.activeLoans,
      },
    }),
    createdAt: this.createdAt,
  };
});

module.exports = mongoose.model("User", UserSchema);