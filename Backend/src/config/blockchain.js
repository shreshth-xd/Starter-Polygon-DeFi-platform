// src/config/blockchain.js — ethers.js provider + signer for Polygon
const { ethers } = require("ethers");
const CredAuraABI = require("../../contracts/abi/CredAura.json");

let provider = null;
let signer   = null;
let contract = null;

/**
 * Initialize provider, signer and contract instance.
 * Call once at startup or lazily on first use.
 */
const initBlockchain = () => {
  try {
    // JSON-RPC provider for Polygon Mumbai (or mainnet)
    provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

    // Backend wallet (signs transactions on behalf of users for collateral ops)
    signer = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY, provider);

    // Smart contract instance (with signer so it can send txns)
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CredAuraABI,
      signer
    );

    console.log("⛓️  Blockchain connection initialized — Polygon Network");
    console.log(`📄  Contract: ${process.env.CONTRACT_ADDRESS}`);
    return { provider, signer, contract };
  } catch (err) {
    console.error("❌ Blockchain init failed:", err.message);
    throw err;
  }
};

// Read-only provider (no private key needed — for read calls)
const getReadProvider = () => {
  if (!provider) initBlockchain();
  return provider;
};

// Write signer (used for backend-initiated txns)
const getSigner = () => {
  if (!signer) initBlockchain();
  return signer;
};

// Contract instance with signer
const getContract = () => {
  if (!contract) initBlockchain();
  return contract;
};

// Read-only contract (no gas, just reads)
const getReadContract = () => {
  const p = getReadProvider();
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, CredAuraABI, p);
};

module.exports = {
  initBlockchain,
  getReadProvider,
  getSigner,
  getContract,
  getReadContract,
};