// src/Models/Borrower.js — Borrower account (created at registration)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { CREDIT } = require("../utils/constants");

const BorrowerSchema = new mongoose.Schema(
  {
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
      select: false,
    },

    kyc: {
      isVerified: { type: Boolean, default: false },
      aadhaarNumber: { type: String, default: null, select: false },
      panNumber: { type: String, default: null, select: false },
      verifiedAt: { type: Date, default: null },
    },

    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },

    borrowerProfile: {
      bankAccountNumber: { type: String, default: null },
      ifscCode: { type: String, default: null },
      creditScore: { type: Number, default: CREDIT.STARTING_SCORE },
      walletAddress: { type: String, default: null },
      totalBorrowed: { type: Number, default: 0 },
      totalRepaid: { type: Number, default: 0 },
      activeLoans: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

BorrowerSchema.index({ "borrowerProfile.walletAddress": 1 });

BorrowerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

BorrowerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

BorrowerSchema.virtual("role").get(() => "borrower");

BorrowerSchema.virtual("publicProfile").get(function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: "borrower",
    isActive: this.isActive,
    isBanned: this.isBanned,
    kyc: { isVerified: this.kyc.isVerified },
    borrowerProfile: {
      creditScore: this.borrowerProfile.creditScore,
      walletAddress: this.borrowerProfile.walletAddress,
      totalBorrowed: this.borrowerProfile.totalBorrowed,
      totalRepaid: this.borrowerProfile.totalRepaid,
      activeLoans: this.borrowerProfile.activeLoans,
    },
    createdAt: this.createdAt,
  };
});

module.exports = mongoose.model("Borrower", BorrowerSchema);
