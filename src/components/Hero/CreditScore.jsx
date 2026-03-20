import React from "react";

const CreditScore = () => {
  const score = 700;

  return (
    <section id="Credit-Score" className="bg-[#050B18] text-white px-6 md:px-12 py-16 border-t border-gray-800">

      {/* Heading */}
      <div className="text-center mb-12 space-y-4">
        <p className="text-amber-500 text-m tracking-widest">
          — BORROWER CREDIT SCORE —
        </p>

        <h2 className="text-3xl md:text-5xl font-serif">
          Your score. On-chain. Forever.
        </h2>

        <p className="text-gray-400">
          No CIBIL. No Equifax. Your identity lives on blockchain.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-center">

        {/* LEFT - Score Tiers */}
        <div className="flex-1 w-full bg-[#0A1326] border border-gray-800 rounded-xl p-6 space-y-4">

          <h3 className="font-semibold mb-4 text-center text-xl">Score Tiers</h3>

          {[
            { label: "700–1000", risk: "Low Risk", Loan: "Max Loan 20,000Rs" ,color: "bg-green-500 w-[80%]" },
            { label: "400–699", risk: "Medium Risk", Loan: "Max Loan 10,000Rs" ,color: "bg-amber-500 w-[50%]", active: true },
            { label: "200–399", risk: "High Risk", Loan: "Max Loan 5,000Rs" ,color: "bg-orange-600 w-[30%]" },
            { label: "Below 200", risk: "BANNED", Loan: "No Loans Ever" ,color: "bg-red-500 w-[10%]" },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                item.active
                  ? "border-amber-500 "
                  : "border-gray-600"
              }`}
            >
              <div className="flex justify-between mb-2">
                <span className="text-amber-500 font-bold">{item.label}</span>
                {item.active && (
                  <span className="text-xs text-amber-500">
                    YOUR SCORE
                  </span>
                )}
              </div>

              <p className="text-white text-m font-bold">{item.risk}</p>
              <p className="text-gray-400 text-sm">{item.Loan}</p>

              <div className="h-2 bg-gray-700 rounded mt-2">
                <div className={`h-full rounded ${item.color}`}></div>
              </div>
            </div>
          ))}

        </div>

        {/* CENTER - Circular Score */}
        <div className="flex-1 flex justify-center items-center">

          <div className="relative w-56 h-56 md:w-72 md:h-72">

            {/* Circle */}
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#22c55e ${score / 10}%, #facc15 ${
                  score / 10
                }% 75%, #1f2937 75%)`,
              }}
            >
              <div className="bg-[#050B18] w-[80%] h-[80%] rounded-full flex flex-col items-center justify-center">

                <h3 className="text-4xl md:text-5xl font-bold">
                  {score}
                </h3>

                <p className="text-gray-400 text-xl">/1000</p>

                <p className="text-amber-500 text-m mt-1">
                  Medium Risk
                </p>

              </div>
            </div>

          </div>

        </div>

        {/* RIGHT - Rules */}
        <div className="flex-1 w-full bg-[#0A1326] border border-gray-800 rounded-xl p-6 space-y-4">

          <h3 className="font-semibold mb-4">Scoring Rules</h3>

          {[
            { title: "500", desc: "Starting score",para: "Every New Borrowers Begin From Here" ,color: "text-amber-500" },
            { title: "+100", desc: "On repayment", para: "On-Time payment = +100 Points" ,color: "text-green-500" },
            { title: "-150", desc: "On default", para: "missed = -150 Points" ,color: "text-red-500" },
            { title: "1000", desc: "Maximum cap", para: "Highest Possible Credit Score" ,color: "text-white" },
            { title: "200", desc: "Minimum floor", para: "Below this = permanent banned for further Loans" ,color: "text-red-500" },
          ].map((rule, i) => (
            <div key={i} className="border border-gray-700 rounded-lg p-4">
              <h4 className={`font-bold text-center text-xl ${rule.color}`}>
                {rule.title}
              </h4>
              <p className="text-white text-m text-center font-bold">{rule.desc}</p>
              <p className="text-gray-400 text-sm text-center">{rule.para}</p>
            </div>
          ))}

        </div>

      </div>

      {/* Bottom Tips */}
      <div className="mt-12 bg-[#0A1326] border border-gray-800 rounded-xl p-6 text-center">

        <h4 className="mb-4 font-bold text-2xl">
          How to improve your score:
        </h4>

        <div className="flex flex-wrap justify-center gap-6 font-bold text-m text-gray-400">
          <p>✔ Repay EMI on time</p>
          <p>✔ Build wallet history</p>
          <p>✔ Take multiple loans</p>
          <p>✔ Grow from 500 → 1000</p>
        </div>

      </div>

    </section>
  );
};

export default CreditScore;