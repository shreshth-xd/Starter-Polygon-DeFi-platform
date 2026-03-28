// src/services/blockchainService.js — ethers.js / Polygon interactions (with dev fallbacks)
const { ethers } = require("ethers");
const {
  getContract,
  getReadContract,
  getReadProvider,
  loadAbi,
} = require("../config/blockchain");

const MOCK_TX =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Verify lockCollateral tx: success receipt, correct contract, borrower, loanId, minimum value.
 */
const verifyCollateralLock = async (txHash, { borrowerWallet, loanId, expectedWei } = {}) => {
  const provider = getReadProvider();
  const contractAddr = process.env.CONTRACT_ADDRESS;

  if (!provider || !contractAddr) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[blockchain] Missing POLYGON_RPC_URL or CONTRACT_ADDRESS — mock collateral verification"
      );
      return {
        success: true,
        txHash,
        blockNumber: null,
        mock: true,
      };
    }
    throw new Error(
      "Blockchain not configured (set POLYGON_RPC_URL and CONTRACT_ADDRESS)"
    );
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error("Transaction not found on chain");
  if (receipt.status !== 1) throw new Error("Transaction failed on chain");

  const tx = await provider.getTransaction(txHash);
  if (!tx) throw new Error("Transaction could not be loaded");

  const expectedTo = ethers.getAddress(contractAddr);
  if (!tx.to) throw new Error("Not a contract call transaction");
  const txTo = ethers.getAddress(tx.to);
  if (txTo.toLowerCase() !== expectedTo.toLowerCase()) {
    throw new Error("Transaction did not interact with the CredAura contract");
  }

  if (borrowerWallet) {
    const from = ethers.getAddress(tx.from);
    if (from.toLowerCase() !== ethers.getAddress(borrowerWallet).toLowerCase()) {
      throw new Error("Transaction sender does not match borrower wallet");
    }
  }

  const abi = loadAbi();
  if (!abi.length) throw new Error("CredAura ABI not loaded");
  const iface = new ethers.Interface(abi);
  let parsed;
  try {
    parsed = iface.parseTransaction({ data: tx.data, value: tx.value });
  } catch {
    throw new Error("Could not decode transaction as CredAura call");
  }
  if (!parsed || parsed.name !== "lockCollateral") {
    throw new Error("Expected lockCollateral function call");
  }

  const onChainLoanId = parsed.args[0];
  if (loanId != null && onChainLoanId !== loanId) {
    throw new Error("loanId in transaction does not match your application");
  }

  if (expectedWei != null && expectedWei !== "") {
    const exp = BigInt(expectedWei);
    const val = BigInt(tx.value.toString());
    if (val < exp) {
      throw new Error(
        `Locked amount ${val.toString()} wei is below required ${exp.toString()} wei`
      );
    }
  }

  return {
    success: true,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
};

/**
 * @param {string} amountWei — decimal string integer wei (preferred) or human amount for legacy
 */
const releaseCollateral = async (borrowerWallet, contractLoanId, amountWei) => {
  const contract = getContract();
  if (!contract) {
    console.warn("[blockchain] Contract not configured — mock collateral release");
    return {
      success: true,
      txHash: MOCK_TX,
      mock: true,
    };
  }

  let amount;
  if (typeof amountWei === "bigint") {
    amount = amountWei;
  } else {
    const s = String(amountWei);
    amount = /^\d+$/.test(s) ? BigInt(s) : ethers.parseEther(s);
  }

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
