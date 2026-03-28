// src/utils/accountLookup.js — Resolve lender/borrower by email for login & signup
const Lender = require("../Models/Lender");
const Borrower = require("../Models/Borrower");

async function emailExistsAnywhere(email) {
  const e = email.toLowerCase().trim();
  const [l, b] = await Promise.all([
    Lender.findOne({ email: e }).lean(),
    Borrower.findOne({ email: e }).lean(),
  ]);
  return !!(l || b);
}

/**
 * Find account for sign-in: returns document with password selected + role.
 */
async function findAccountByEmailForLogin(email) {
  const e = email.toLowerCase().trim();
  const lender = await Lender.findOne({ email: e }).select("+password");
  if (lender) return { account: lender, role: "lender" };
  const borrower = await Borrower.findOne({ email: e }).select("+password");
  if (borrower) return { account: borrower, role: "borrower" };
  return null;
}

module.exports = { emailExistsAnywhere, findAccountByEmailForLogin };
