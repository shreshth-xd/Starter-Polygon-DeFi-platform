// src/services/blockchainService.js — All ethers.js / Polygon interactions
const { ethers }     = require("ethers");
const { getContract, getReadContract } = require("../config/blockchain");

/**
 * Lock collateral in the smart contract.
 * Called after borrower approves the transaction from their MetaMask.
 * Here the backend verifies the tx on-chain.
 *
 * @param {string} txHash - Transaction hash sent by borrower's MetaMask
 * @param {string} loanId - Internal loan ID
 */
const verifyCollateralLock = async (txHash) => {
  try {
    const provider = getContract().runner.provider;
    const receipt  = await provider.getTransactionReceipt(txHash);

    if (!receipt) throw new Error("Transaction not found on chain");
    if (receipt.status !== 1) throw new Error("Transaction failed on chain");

    return {
      success:     true,
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed:     receipt.gasUsed.toString(),
    };
  } catch (err) {
    throw new Error(`Collateral verification failed: ${err.message}`);
  }
};

/**
 * Call smart contract to release collateral back to borrower.
 * Triggered by backend after confirming full INR repayment.
 *
 * @param {string} borrowerWallet - Borrower's MetaMask address
 * @param {string} loanId         - Internal loan ID (passed to contract)
 * @param {string} cryptoAmount   - Amount of crypto to release (as string)
 */
const releaseCollateral = async (borrowerWallet, contractLoanId, cryptoAmount) => {
  try {
    const contract = getContract();
    const amount   = ethers.parseEther(cryptoAmount.toString());

    const tx = await contract.releaseCollateral(borrowerWallet, contractLoanId, amount);
    const receipt = await tx.wait();

    return {
      success:     true,
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    throw new Error(`Collateral release failed: ${err.message}`);
  }
};

/**
 * Call smart contract to liquidate collateral on default.
 * Triggered by cron job after grace period.
 */
const liquidateCollateral = async (borrowerWallet, contractLoanId) => {
  try {
    const contract = getContract();
    const tx       = await contract.liquidate(borrowerWallet, contractLoanId);
    const receipt  = await tx.wait();

    return {
      success:     true,
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    throw new Error(`Liquidation failed: ${err.message}`);
  }
};

/**
 * Get current ETH/MATIC/BTC price in INR from a simple on-chain or API call.
 * For hackathon purposes, uses a static mock. Replace with real oracle.
 */
const getCryptoPriceINR = async (cryptoType) => {
  // In production: use Chainlink price feed or CoinGecko API
  const MOCK_PRICES = {
    ETH:  64285,
    BTC:  5428500,
    MATIC: 72,
  };
  return MOCK_PRICES[cryptoType] || 0;
};

/**
 * Verify a wallet address format
 */
const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Get collateral balance locked by a borrower (read-only)
 */
const getLockedCollateral = async (borrowerWallet) => {
  try {
    const contract = getReadContract();
    const balance  = await contract.getLockedCollateral(borrowerWallet);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error("getLockedCollateral error:", err.message);
    return "0";
  }
};

/**
 * Get credit score from smart contract (on-chain record)
 */
const getOnChainCreditScore = async (walletAddress) => {
  try {
    const contract = getReadContract();
    const score    = await contract.getCreditScore(walletAddress);
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