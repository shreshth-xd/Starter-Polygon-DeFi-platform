// src/config/blockchain.js — ethers.js provider + optional contract (Polygon)
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let provider = null;
let signer = null;
let contract = null;
let readContract = null;
let abiCache;

function loadAbi() {
  if (abiCache !== undefined) return abiCache;
  const abiPath = path.join(__dirname, "../../contracts/abi/CredAura.json");
  try {
    if (fs.existsSync(abiPath)) {
      abiCache = require(abiPath);
    } else {
      abiCache = [];
    }
  } catch {
    abiCache = [];
  }
  return abiCache;
}

/**
 * JSON-RPC provider only (tx receipts, reads). No ABI required.
 */
const getReadProvider = () => {
  if (!process.env.POLYGON_RPC_URL) return null;
  if (!provider) {
    provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  }
  return provider;
};

const getSigner = () => {
  if (!process.env.POLYGON_RPC_URL || !process.env.BACKEND_WALLET_PRIVATE_KEY) return null;
  if (!signer) {
    const p = getReadProvider();
    if (!p) return null;
    signer = new ethers.Wallet(process.env.BACKEND_WALLET_PRIVATE_KEY, p);
  }
  return signer;
};

/**
 * Writable contract — only when ABI + address + signer exist.
 */
const getContract = () => {
  const abi = loadAbi();
  if (!abi.length || !process.env.CONTRACT_ADDRESS) return null;
  if (!contract) {
    const s = getSigner();
    if (!s) return null;
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, s);
  }
  return contract;
};

/**
 * Read-only contract (same ABI + address, provider only).
 */
const getReadContract = () => {
  const abi = loadAbi();
  const p = getReadProvider();
  if (!abi.length || !process.env.CONTRACT_ADDRESS || !p) return null;
  if (!readContract) {
    readContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, p);
  }
  return readContract;
};

module.exports = {
  getReadProvider,
  getSigner,
  getContract,
  getReadContract,
  loadAbi,
};
