// src/utils/walletAuthNonce.js — one-time nonces for wallet sign-in messages
const crypto = require("crypto");

const store = new Map();
const TTL_MS = 5 * 60 * 1000;

function prune() {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt < now) store.delete(k);
  }
}

function createNonce(normalizedAddress) {
  prune();
  const key = normalizedAddress.toLowerCase();
  const nonce = crypto.randomBytes(16).toString("hex");
  store.set(key, { nonce, expiresAt: Date.now() + TTL_MS });
  return nonce;
}

function consumeNonceIfValid(normalizedAddress, message) {
  prune();
  const key = normalizedAddress.toLowerCase();
  const row = store.get(key);
  if (!row || row.expiresAt < Date.now()) {
    store.delete(key);
    return false;
  }
  const needle = `Nonce: ${row.nonce}`;
  if (!message.includes(needle)) {
    return false;
  }
  store.delete(key);
  return true;
}

module.exports = { createNonce, consumeNonceIfValid };
