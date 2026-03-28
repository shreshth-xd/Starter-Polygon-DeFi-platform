// src/utils/walletAuth.js — MetaMask + CredAura wallet sign-in
import { BrowserProvider, getAddress } from "ethers";
import { authAPI } from "../services/api";

export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * Request accounts, fetch sign-in message from API, sign it, exchange for JWT.
 * Only works for borrowers who already linked this wallet to their account.
 */
export async function loginWithMetaMask() {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not installed. Add the extension, then try again.");
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();
  const normalized = getAddress(walletAddress);

  const challengeRes = await authAPI.walletChallenge(normalized);
  const message = challengeRes.data.data.message;

  const signature = await signer.signMessage(message);

  const loginRes = await authAPI.walletLogin({
    walletAddress: normalized,
    message,
    signature,
  });

  return loginRes.data.data;
}
