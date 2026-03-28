import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { lenderAPI } from "../../services/api";
import CreditScorePanel from "./CreditScorePanel";

const statCards = [
  { label: "Total Deposited", key: "totalDeposited", unit: "₹" },
  { label: "Total Earned", key: "totalEarned", unit: "₹" },
  { label: "Active Deposits", key: "activeDepositsCount", unit: "" },
];

const TENURES = [3, 6, 12];

export default function LenderDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [amountINR, setAmountINR] = useState(10000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    lenderAPI
      .getDashboard()
      .then((res) => {
        setState({ loading: false, data: res.data.data, error: null });
      })
      .catch((err) => {
        setState({
          loading: false,
          data: null,
          error: err.response?.data?.message || "Failed to load lender dashboard.",
        });
      });
  };

  useEffect(() => {
    load();
  }, []);

  const submitDeposit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormErr("");
    setFormMsg("");
    try {
      await lenderAPI.createDeposit({
        amountINR,
        tenureMonths,
        paymentMethod,
        upiId: paymentMethod === "UPI" ? upiId || undefined : undefined,
      });
      setFormMsg("Deposit recorded. Interest accrues per your plan.");
      load();
    } catch (err) {
      setFormErr(err.response?.data?.message || err.message || "Deposit failed.");
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white">Loading lender dashboard...</div>
    );
  }

  if (state.error) {
    return <div className="min-h-screen grid place-items-center text-red-400">{state.error}</div>;
  }

  const { stats, activeDeposits } = state.data || {};
  const score = user?.lenderProfile?.totalDeposited
    ? Math.min(900, Math.max(300, Math.floor(user.lenderProfile.totalDeposited / 1000 + 500)))
    : 650;

  return (
    <div className="min-h-screen bg-[#05080a] text-white pb-16 pt-24 px-4 md:px-8">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Lender Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back, {user?.fullName || "Lender"}.</p>
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
        <CreditScorePanel score={score} role="lender" />

        <div className="bg-[#0A1326] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Lend — new deposit</h2>
          <p className="text-gray-400 text-sm">
            While you are logged in as a lender, place a fixed deposit to fund the pool. Demo flow records
            the deposit instantly in INR.
          </p>
          <form onSubmit={submitDeposit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Amount (INR) — min ₹1,000</label>
              <input
                type="number"
                min={1000}
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                value={amountINR}
                onChange={(e) => setAmountINR(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tenure</label>
              <select
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
              >
                {TENURES.map((t) => (
                  <option key={t} value={t}>
                    {t} months
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Payment method</label>
              <select
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="IMPS">IMPS</option>
              </select>
            </div>
            {paymentMethod === "UPI" && (
              <input
                className="w-full rounded-lg bg-[#05080a] border border-gray-700 px-3 py-2"
                placeholder="UPI ID (optional for demo)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#e8a020] text-black font-semibold py-2.5 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Create deposit"}
            </button>
          </form>
          {formMsg && <p className="text-sm text-teal-300">{formMsg}</p>}
          {formErr && <p className="text-sm text-red-400">{formErr}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-[#0A1326] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Your top deposits</h2>
          {activeDeposits?.length > 0 ? (
            <div className="space-y-3">
              {activeDeposits.slice(0, 4).map((deposit) => (
                <div key={deposit._id} className="border border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between">
                    <p className="text-gray-200">₹{deposit.amountINR}</p>
                    <p className="text-green-300">{deposit.interestRate * 100}% p.a.</p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Tenure {deposit.tenureMonths} months • Matures{" "}
                    {new Date(deposit.maturityDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No active deposits yet — add one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
