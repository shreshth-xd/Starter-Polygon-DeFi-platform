import React from "react";

const tiers = [
  { label: "700–1000", risk: "Low Risk", maxLoan: "₹20,000", color: "bg-green-500 w-[80%]" },
  { label: "400–699", risk: "Medium Risk", maxLoan: "₹10,000", color: "bg-amber-500 w-[50%]" },
  { label: "200–399", risk: "High Risk", maxLoan: "₹5,000", color: "bg-orange-600 w-[30%]" },
  { label: "Below 200", risk: "BANNED", maxLoan: "No loan", color: "bg-red-500 w-[10%]" },
];

const rules = [
  { title: "500", desc: "Starting score", para: "New borrowers begin here", color: "text-amber-500" },
  { title: "+100", desc: "On repayment", para: "On-time payment = +100 points", color: "text-green-500" },
  { title: "-150", desc: "On default", para: "Missed payment = -150 points", color: "text-red-500" },
  { title: "1000", desc: "Maximum cap", para: "Highest possible credit score", color: "text-white" },
  { title: "200", desc: "Minimum floor", para: "Below this = banned for loans", color: "text-red-500" },
];

function getTier(score) {
  if (score >= 700) return "Low Risk";
  if (score >= 400) return "Medium Risk";
  if (score >= 200) return "High Risk";
  return "BANNED";
}

export default function CreditScorePanel({ score = 500, role }) {
  const safeScore = Math.min(Math.max(score, 0), 1000);
  const tierName = getTier(safeScore);

  return (
    <section className="bg-[#050B18] text-white p-6 md:p-10 rounded-2xl border border-gray-800">
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">{role === "lender" ? "Lender" : "Borrower"} Credit Score</h2>
        <p className="text-gray-400 mt-2">Current score, risk tier and scoring model</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 flex items-center justify-center">
          <div
            className="relative rounded-full"
            style={{ width: "210px", height: "210px", background: `conic-gradient(#22c55e ${safeScore/10}%, #facc15 ${safeScore/10}%, #1f2937 75%)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#050B18]">
              <div className="text-center">
                <h3 className="text-4xl md:text-5xl font-bold">{safeScore}</h3>
                <p className="text-gray-400 mt-1">/1000</p>
                <p className="text-amber-500 mt-2 font-semibold">{tierName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid gap-4">
          <div className="bg-[#0A1326] rounded-xl border border-gray-800 p-5">
            <h4 className="font-semibold mb-4">Score Tiers</h4>
            <div className="space-y-3">
              {tiers.map((item) => (
                <div key={item.label} className="p-3 border rounded-lg border-gray-700">
                  <div className="flex justify-between mb-2">
                    <span className="text-amber-500 font-bold">{item.label}</span>
                    {item.risk === tierName && <span className="text-xs text-amber-500">Current Tier</span>}
                  </div>
                  <p className="text-white font-bold">{item.risk}</p>
                  <p className="text-gray-400 text-sm">Max loan: {item.maxLoan}</p>
                  <div className="h-2 bg-gray-700 rounded mt-2">
                    <div className={`h-full rounded ${item.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A1326] rounded-xl border border-gray-800 p-5">
            <h4 className="font-semibold mb-4">Scoring Rules</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {rules.map((rule) => (
                <div key={rule.title} className="border border-gray-700 rounded-lg p-3">
                  <h5 className={`font-bold text-lg text-center ${rule.color}`}>{rule.title}</h5>
                  <p className="text-white text-sm text-center font-bold">{rule.desc}</p>
                  <p className="text-gray-400 text-xs text-center">{rule.para}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-gray-400 text-sm text-center">
        🔎 The credit score is derived from repayment history, on-chain wallet actions, and loan performance.
      </div>
    </section>
  );
}
