import React, { useEffect, useState, useCallback } from "react";
import { BrowserProvider, getAddress } from "ethers";
import { useAuth } from "../../context/AuthContext";
import { borrowerAPI, authAPI, fetchPublicConfig } from "../../services/api";
import { lockCollateralWithMetaMask, isMetaMaskAvailable } from "../../utils/lockCollateral";
import CreditScorePanel from "./CreditScorePanel";

const statCards = [
  { label: "Total Borrowed", key: "totalBorrowed", unit: "₹" },
  { label: "Total Repaid", key: "totalRepaid", unit: "₹" },
  { label: "Active Loans", key: "activeLoans", unit: "" },
];

const TENURES = [3, 6, 12];
const CRYPTOS = [
  { value: "MATIC", label: "MATIC (native — use on Polygon)" },
  { value: "ETH", label: "ETH (pricing mock)" },
  { value: "BTC", label: "BTC (pricing mock)" },
];

export default function BorrowerDashboard() {
  const { user, refreshUser, connectBorrowerWallet } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [contractAddress, setContractAddress] = useState(
    import.meta.env.VITE_CONTRACT_ADDRESS || ""
  );

  const [kycForm, setKycForm] = useState({ aadhaarNumber: "", panNumber: "" });
  const [kycBusy, setKycBusy] = useState(false);
  const [kycMsg, setKycMsg] = useState("");

  const [walletBusy, setWalletBusy] = useState(false);
  const [walletMsg, setWalletMsg] = useState("");

  const [loanAmount, setLoanAmount] = useState(5000);
  const [tenure, setTenure] = useState(6);
  const [cryptoType, setCryptoType] = useState("MATIC");
  const [loanBusy, setLoanBusy] = useState(false);
  const [loanErr, setLoanErr] = useState("");
  const [pendingLock, setPendingLock] = useState(null);

  const [repayAmt, setRepayAmt] = useState("");
  const [repayMethod, setRepayMethod] = useState("UPI");
  const [repayTxnId, setRepayTxnId] = useState("");
  const [repayBusy, setRepayBusy] = useState(false);
  const [repayMsg, setRepayMsg] = useState("");

  const loadDashboard = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    borrowerAPI
      .getDashboard()
      .then((res) => {
        setState({ loading: false, data: res.data.data, error: null });
        const al = res.data.data?.activeLoan;
        if (al?.monthlyEMI) setRepayAmt(String(al.monthlyEMI));
      })
      .catch((error) => {
        setState({
          loading: false,
          data: null,
          error: error.response?.data?.message || "Failed to load dashboard.",
        });
      });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (import.meta.env.VITE_CONTRACT_ADDRESS) return;
    fetchPublicConfig()
      .then((c) => {
        if (c?.contractAddress) setContractAddress(c.contractAddress);
      })
      .catch(() => {});
  }, []);

  const handleKyc = async (e) => {
    e.preventDefault();
    setKycBusy(true);
    setKycMsg("");
    try {
      await authAPI.submitKYC(kycForm);
      await refreshUser();
      setKycMsg("KYC verified. You can apply for a loan.");
      setKycForm({ aadhaarNumber: "", panNumber: "" });
    } catch (err) {
      setKycMsg(err.response?.data?.message || "KYC submission failed.");
    } finally {
      setKycBusy(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!isMetaMaskAvailable()) {
      setWalletMsg("Install MetaMask to continue.");
      return;
    }
    setWalletBusy(true);
    setWalletMsg("");
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = getAddress(await signer.getAddress());
      await connectBorrowerWallet(addr);
      setWalletMsg("Wallet linked. You can lock collateral with this address.");
    } catch (err) {
      setWalletMsg(err.response?.data?.message || err.message || "Could not connect wallet.");
    } finally {
      setWalletBusy(false);
    }
  };

  const startDraft = async (e) => {
    e.preventDefault();
    setLoanBusy(true);
    setLoanErr("");
    try {
      const res = await borrowerAPI.createLoanDraft({
        amountINR: loanAmount,
        tenureMonths: tenure,
        cryptoType,
      });
      const { lockInstructions, loan } = res.data.data;
      setPendingLock({ loan, ...lockInstructions });
      await loadDashboard();
    } catch (err) {
      setLoanErr(err.response?.data?.message || err.message || "Could not create application.");
    } finally {
      setLoanBusy(false);
    }
  };

  const runLockAndConfirm = async () => {
    if (!pendingLock?.loanId || !pendingLock?.collateralWei) return;
    setLoanBusy(true);
    setLoanErr("");
    try {
      const addr =
        contractAddress ||
        (await fetchPublicConfig()).contractAddress ||
        import.meta.env.VITE_CONTRACT_ADDRESS;
      if (!addr) {
        throw new Error(
          "Set CONTRACT_ADDRESS on the server (and redeploy) or VITE_CONTRACT_ADDRESS for the app."
        );
      }
      const txHash = await lockCollateralWithMetaMask(
        addr,
        pendingLock.loanId,
        pendingLock.collateralWei
      );
      await borrowerAPI.confirmLoan({
        loanId: pendingLock.loanId,
        collateralTxHash: txHash,
      });
      setPendingLock(null);
      await loadDashboard();
      await refreshUser();
    } catch (err) {
      setLoanErr(err.response?.data?.message || err.message || "Lock or confirm failed.");
    } finally {
      setLoanBusy(false);
    }
  };

  const resumeDraftFromServer = async (draft) => {
    const wei = draft.blockchainData?.expectedCollateralWei;
    if (!wei) {
      setLoanErr("Draft is missing collateral amount — cancel and create a new application.");
      return;
    }
    setPendingLock({
      loanId: draft.loanId,
      collateralWei: wei,
      collateralHuman: String(draft.collateral?.cryptoAmount ?? ""),
      cryptoType: draft.collateral?.cryptoType,
      loan: draft,
    });
  };

  const cancelDraft = async (loanId) => {
    setLoanBusy(true);
    setLoanErr("");
    try {
      await borrowerAPI.cancelLoanDraft(loanId);
      setPendingLock(null);
      await loadDashboard();
    } catch (err) {
      setLoanErr(err.response?.data?.message || err.message || "Cancel failed.");
    } finally {
      setLoanBusy(false);
    }
  };

  const submitRepay = async (e) => {
    e.preventDefault();
    const active = state.data?.activeLoan;
    if (!active) return;
    setRepayBusy(true);
    setRepayMsg("");
    try {
      const id = active.loanId || active._id;
      const res = await borrowerAPI.repay(id, {
        amountINR: Number(repayAmt),
        paymentMethod: repayMethod,
        transactionId: repayTxnId || `DEMO-${Date.now()}`,
      });
      setRepayMsg(
        res.data.data?.fullyRepaid
          ? "Loan fully repaid — collateral release initiated."
          : res.data.message || "Payment recorded."
      );
      setRepayTxnId("");
      await loadDashboard();
      await refreshUser();
    } catch (err) {
      setRepayMsg(err.response?.data?.message || err.message || "Repayment failed.");
    } finally {
      setRepayBusy(false);
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        Loading borrower dashboard...
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen grid place-items-center text-red-400">{state.error}</div>
    );
  }

  const { stats, creditScore, activeLoan, draftLoan } = state.data || {};
  const score = creditScore?.score ?? user?.borrowerProfile?.creditScore ?? 500;
  const kycOk = user?.kyc?.isVerified;
  const hasWallet = Boolean(user?.borrowerProfile?.walletAddress);

  return (
    <div className="min-h-screen bg-[#05080a] text-white pb-16 pt-24 px-4 md:px-8">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Borrower Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back, {user?.fullName || "Borrower"}.</p>
      </header>

      <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-3 mb-8">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-gray-800 bg-[#0a1226] p-5">
            <p className="text-sm text-gray-400">{card.label}</p>
            <p className="text-2xl font-bold mt-1">
              {card.unit}
              {stats ? stats[card.key] : 0}
            </p>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-2">
        <CreditScorePanel score={score} role="borrower" />

        <div className="bg-[#0A1326] border border-gray-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Borrow — lock collateral</h2>
          <p className="text-gray-400 text-sm">
            You must be logged in. Complete demo KYC, link the same MetaMask address you will use to
            send collateral, then create an application and confirm after the on-chain lock.
          </p>

          {!kycOk && (
            <form onSubmit={handleKyc} className="rounded-xl border border-amber-900/50 bg-[#0f1428] p-4 space-y-3">
              <p className="text-amber-200 text-sm font-medium">KYC required</p>
              <input
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                placeholder="Aadhaar (12 digits)"
                value={kycForm.aadhaarNumber}
                onChange={(e) => setKycForm((f) => ({ ...f, aadhaarNumber: e.target.value }))}
                maxLength={12}
              />
              <input
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                placeholder="PAN e.g. ABCDE1234F"
                value={kycForm.panNumber}
                onChange={(e) => setKycForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
              <button
                type="submit"
                disabled={kycBusy}
                className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {kycBusy ? "Submitting…" : "Verify KYC (demo)"}
              </button>
              {kycMsg && <p className="text-sm text-teal-300">{kycMsg}</p>}
            </form>
          )}

          {kycOk && !hasWallet && (
            <div className="rounded-xl border border-teal-900/50 bg-[#0f1428] p-4 space-y-2">
              <p className="text-teal-200 text-sm">Link MetaMask to this account</p>
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={walletBusy}
                className="rounded-lg bg-teal-700 hover:bg-teal-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {walletBusy ? "Connecting…" : "Connect MetaMask"}
              </button>
              {walletMsg && <p className="text-xs text-gray-400">{walletMsg}</p>}
            </div>
          )}

          {kycOk && hasWallet && (
            <p className="text-xs text-gray-500">
              Linked wallet:{" "}
              <span className="text-gray-300 font-mono">{user.borrowerProfile.walletAddress}</span>
            </p>
          )}

          {draftLoan && !pendingLock && !activeLoan && (
            <div className="rounded-xl border border-cyan-800 bg-[#0c1528] p-4 space-y-2">
              <p className="text-cyan-200 text-sm font-medium">You have a draft application</p>
              <p className="text-gray-400 text-sm">
                Loan ID <span className="text-white font-mono">{draftLoan.loanId}</span> — finish the
                on-chain lock or cancel.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => resumeDraftFromServer(draftLoan)}
                  className="rounded-lg bg-cyan-700 hover:bg-cyan-600 px-3 py-2 text-sm"
                >
                  Continue to MetaMask lock
                </button>
                <button
                  type="button"
                  onClick={() => cancelDraft(draftLoan.loanId)}
                  disabled={loanBusy}
                  className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300"
                >
                  Cancel draft
                </button>
              </div>
            </div>
           )}

          {pendingLock && (
            <div className="rounded-xl border border-emerald-800 bg-[#0c1820] p-4 space-y-3">
              <p className="text-emerald-200 font-medium">Lock collateral</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>
                  Loan ID: <span className="text-white font-mono">{pendingLock.loanId}</span>
                </li>
                <li>
                  Send{" "}
                  <span className="text-white">
                    {pendingLock.collateralHuman} {pendingLock.cryptoType}
                  </span>{" "}
                  (wei: {pendingLock.collateralWei})
                </li>
                <li className="text-xs">
                  Use the Polygon network that matches your deployed contract. Native MATIC is used for
                  the lock transaction value.
                </li>
              </ul>
              {!contractAddress && (
                <p className="text-xs text-amber-300">
                  Contract address not loaded — ensure the backend has CONTRACT_ADDRESS or set
                  VITE_CONTRACT_ADDRESS.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runLockAndConfirm}
                  disabled={loanBusy}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {loanBusy ? "Waiting for wallet…" : "Lock in MetaMask & confirm loan"}
                </button>
                <button
                  type="button"
                  onClick={() => cancelDraft(pendingLock.loanId)}
                  disabled={loanBusy}
                  className="rounded-lg border border-gray-600 px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {kycOk && hasWallet && !activeLoan && !draftLoan && !pendingLock && (
            <form onSubmit={startDraft} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Amount (INR)</label>
                <input
                  type="number"
                  min={2000}
                  max={20000}
                  className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tenure</label>
                <select
                  className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                >
                  {TENURES.map((t) => (
                    <option key={t} value={t}>
                      {t} months
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Collateral pricing symbol</label>
                <select
                  className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                  value={cryptoType}
                  onChange={(e) => setCryptoType(e.target.value)}
                >
                  {CRYPTOS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loanBusy}
                className="w-full rounded-lg bg-[#e8a020] text-black font-semibold py-2.5 disabled:opacity-50"
              >
                {loanBusy ? "Creating…" : "Create loan application"}
              </button>
            </form>
          )}

          {loanErr && <p className="text-sm text-red-400">{loanErr}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 grid gap-6 lg:grid-cols-2">
        <div className="bg-[#0A1326] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Loan summary</h2>
          {activeLoan ? (
            <div className="space-y-3">
              <p className="text-gray-300">
                <strong>Active loan:</strong>{" "}
                <span className="font-mono">{activeLoan.loanId || activeLoan._id}</span>
              </p>
              <p className="text-gray-300">
                <strong>Amount:</strong> ₹{activeLoan.amountINR}
              </p>
              <p className="text-gray-300">
                <strong>Status:</strong> {activeLoan.status}
              </p>
              <p className="text-gray-300">
                <strong>EMI:</strong> ₹{activeLoan.monthlyEMI} / month
              </p>
              <p className="text-gray-300">
                <strong>Due:</strong> {new Date(activeLoan.dueDate).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No active loan. Use the panel above to borrow.</p>
          )}
        </div>

        {activeLoan && (
          <div className="bg-[#0A1326] border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Repay EMI</h2>
            <p className="text-gray-400 text-sm">
              Pay each EMI with your reference ID; when all EMIs are marked paid, collateral is released
              on-chain (backend signer must match contract owner).
            </p>
            <form onSubmit={submitRepay} className="space-y-3">
              <input
                type="number"
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                value={repayAmt}
                onChange={(e) => setRepayAmt(e.target.value)}
                placeholder="EMI amount"
              />
              <select
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                value={repayMethod}
                onChange={(e) => setRepayMethod(e.target.value)}
              >
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="IMPS">IMPS</option>
              </select>
              <input
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                value={repayTxnId}
                onChange={(e) => setRepayTxnId(e.target.value)}
                placeholder="Your payment reference / UTR"
              />
              <button
                type="submit"
                disabled={repayBusy}
                className="rounded-lg bg-[#2d7a5f] hover:bg-[#3d9a75] px-4 py-2 font-medium disabled:opacity-50"
              >
                {repayBusy ? "Submitting…" : "Record EMI payment"}
              </button>
            </form>
            {repayMsg && <p className="text-sm text-teal-300">{repayMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
