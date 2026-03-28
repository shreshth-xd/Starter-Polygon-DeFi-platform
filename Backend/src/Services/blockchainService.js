// src/services/blockchainService.js — ethers.js / Polygon interactions (with dev fallbacks)
const { ethers } = require("ethers");
const { getContract, getReadContract, getReadProvider } = require("../config/blockchain");

const MOCK_TX =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Verify a collateral lock tx on-chain. Without RPC, dev mode can mock-verify.
 */
const verifyCollateralLock = async (txHash) => {
  const provider = getReadProvider();
  if (!provider) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[blockchain] No POLYGON_RPC_URL — mock collateral verification");
      return {
        success: true,
        txHash,
        blockNumber: null,
        mock: true,
      };
    }
    throw new Error("Blockchain provider not configured (set POLYGON_RPC_URL)");
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error("Transaction not found on chain");
  if (receipt.status !== 1) throw new Error("Transaction failed on chain");

  return {
    success: true,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
};

const releaseCollateral = async (borrowerWallet, contractLoanId, cryptoAmount) => {
  const contract = getContract();
  if (!contract) {
    console.warn("[blockchain] Contract not configured — mock collateral release");
    return {
      success: true,
      txHash: MOCK_TX,
      mock: true,
    };
  }

  const amount = ethers.parseEther(String(cryptoAmount));
  const tx = await contract.releaseCollateral(borrowerWallet, contractLoanId, amount);
  const receipt = await tx.wait();
  return {
    success: true,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

const liquidateCollateral = async (borrowerWallet, contractLoanId) => {
  const contract = getContract();
  if (!contract) {
    console.warn("[blockchain] Contract not configured — mock liquidation");
    return {
      success: true,
      txHash: MOCK_TX,
      mock: true,
    };
  }

  const tx = await contract.liquidate(borrowerWallet, contractLoanId);
  const receipt = await tx.wait();
  return {
    success: true,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

const MOCK_PRICES = {
  ETH: 64285,
  BTC: 5428500,
  MATIC: 72,
};

const getCryptoPriceINR = async (cryptoType) => {
  return MOCK_PRICES[cryptoType] || MOCK_PRICES.ETH;
};

const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

const getLockedCollateral = async (borrowerWallet) => {
  try {
    const contract = getReadContract();
    if (!contract) return "0";
    const balance = await contract.getLockedCollateral(borrowerWallet);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error("getLockedCollateral error:", err.message);
    return "0";
  }
};

const getOnChainCreditScore = async (walletAddress) => {
  try {
    const contract = getReadContract();
    if (!contract) return null;
    const score = await contract.getCreditScore(walletAddress);
    return Number(score);
  } catch (err) {
    console.error("getOnChainCreditScore error:", err.message);
    return null;
  }
};

module.exports = {
  verifyCollateralLock,
  releaseCollateral,
  liquidateCollateral,
  getCryptoPriceINR,
  isValidAddress,
  getLockedCollateral,
  getOnChainCreditScore,
};
