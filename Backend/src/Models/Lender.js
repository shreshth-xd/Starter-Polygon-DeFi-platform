// src/Models/Lender.js — Lender account (created at registration)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const LenderSchema = new mongoose.Schema(
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

    lenderProfile: {
      upiId: { type: String, default: null },
      totalDeposited: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

LenderSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

LenderSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

LenderSchema.virtual("role").get(() => "lender");

LenderSchema.virtual("publicProfile").get(function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: "lender",
    isActive: this.isActive,
    isBanned: this.isBanned,
    kyc: { isVerified: this.kyc.isVerified },
    lenderProfile: this.lenderProfile,
    createdAt: this.createdAt,
  };
});

module.exports = mongoose.model("Lender", LenderSchema);
