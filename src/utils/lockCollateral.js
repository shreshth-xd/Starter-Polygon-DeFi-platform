// MetaMask → CredAura.lockCollateral(loanId) with exact wei value
import { BrowserProvider, Contract } from "ethers";

const LOCK_ABI = [
  "function lockCollateral(string loanId) external payable",
];

export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * @param {string} contractAddress — checksummed or hex
 * @param {string} loanId — must match backend draft (e.g. CA-2026-12345)
 * @param {string} collateralWei — integer wei as decimal string
 * @returns {Promise<string>} transaction hash
 */
export async function lockCollateralWithMetaMask(contractAddress, loanId, collateralWei) {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is required to lock collateral.");
  }
  if (!contractAddress) {
    throw new Error(
      "CredAura contract address is not configured. Deploy the contract and set CONTRACT_ADDRESS (backend) / VITE_CONTRACT_ADDRESS (optional)."
    );
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const c = new Contract(contractAddress, LOCK_ABI, signer);
  const tx = await c.lockCollateral(loanId, { value: BigInt(collateralWei) });
  const receipt = await tx.wait();
  return receipt.hash;
}
