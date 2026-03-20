import React from "react";

const features = [
  {
    title: "Deposit in INR via UPI / NEFT / IMPS",
    desc: "Just like transferring to a savings account.",
  },
  {
    title: "Choose 3, 6, or 12-month tenure",
    desc: "Longer tenure = higher rate.",
  },
  {
    title: "Interest credited monthly",
    desc: "Track earnings live on dashboard.",
  },
  {
    title: "150% crypto collateral protects you",
    desc: "Loans backed by locked crypto.",
  },
  {
    title: "Even on default — you're paid in full",
    desc: "Crypto auto-liquidates if borrower defaults.",
  },
  {
    title: "Withdraw to bank at maturity",
    desc: "Principal + interest sent to your bank.",
  },
];

const plans = [
  {
    duration: "3 Months",
    rate: "8%",
    earn: "₹2,400",
    total: "₹12,400",
  },
  {
    duration: "6 Months",
    rate: "8.5%",
    earn: "₹4,250",
    total: "₹14,250",
  },
  {
    duration: "12 Months",
    rate: "9%",
    earn: "₹9,000",
    total: "₹19,000",
  },
];

const ForLenders = () => {
  return (
    <section id="For-Lenders" className="bg-[#050B18] text-white px-6 md:px-12 py-16 border-t border-gray-800">

      {/* Heading */}
      <div className="text-center mb-12 space-y-4">
        <p className="text-amber-500 text-sm tracking-widest">
          — FOR LENDERS —
        </p>

        <h2 className="text-3xl md:text-5xl font-serif">
          Earn 8–9% on your INR.
        </h2>

        <p className="text-gray-400">
          No crypto. No wallet. No complexity.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* LEFT FEATURES */}
        <div className="flex-1 flex flex-col gap-4">

          {features.map((item, index) => (
            <div
              key={index}
              className="bg-[#0A1326] border border-gray-800 rounded-xl p-5 
                         hover:border-amber-500 hover:scale-[1.02] 
                         transition-all duration-300"
            >
              <h3 className="font-semibold mb-1">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Plans */}
          <div className="bg-[#0A1326] border border-gray-800 rounded-xl p-6">

            <h3 className="text-center mb-6 font-bold">
              How much can you earn?
            </h3>

            <div className="flex flex-col md:flex-row gap-4">

              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`flex-1 border rounded-xl p-4 text-center 
                    transition-all duration-300 hover:scale-105
                    ${
                      plan.highlight
                        ? "border-amber-500"
                        : "border-gray-700"
                    }`}
                >
                  <p className="text-sm text-gray-400">
                    {plan.duration}
                  </p>

                  <h4 className="text-2xl font-bold text-amber-500">
                    {plan.rate}
                  </h4>

                  <p className="text-xs text-gray-400">
                    per annum
                  </p>

                  <p className="text-green-500 text-sm mt-2">
                    Earn: {plan.earn}
                  </p>

                  <p className="text-gray-400 text-xs">
                    Total: {plan.total}
                  </p>
                </div>
              ))}

            </div>
          </div>

          {/* Protection Box */}
          <div className="bg-[#071C1A] border border-green-800 rounded-xl p-6">

            <h3 className="font-bold text-center mb-4">
              Your Money is Always Protected
            </h3>

            <ul className="space-y-3 text-s text-gray-300">
              <li>• Borrower locks 150% crypto before receiving a single rupee</li>
              <li>• If crypto value drops, smart contract alerts and liquidates</li>
              <li>• Default triggers auto-liquidation - lender repaid in full</li>
              <li>• Principal + full interest guarenteed in all scenarios</li>
            </ul>

          </div>

          {/* CTA */}
          <div className="text-center">
            <button className="bg-amber-500 text-black px-6 py-3 cursor-pointer rounded-full 
                               hover:scale-105 hover:bg-amber-600 transition-all">
              Create Lender Account
            </button>

            <p className="text-gray-400 text-s mt-2">
              Minimum deposit ₹1,000 · Free to join
            </p>
          </div>

        </div>

      </div>

      {/* Bottom Stats */}
      <div className="mt-12 bg-[#0A1326] border border-gray-800 rounded-xl p-6 
                      flex flex-wrap justify-between gap-6 text-center">

        <div >
          <p className="text-amber-500 text-2xl font-semibold">8–9%</p>
          <p className="text-gray-400 text-s">Annual interest</p>
        </div>

        <div>
          <p className="text-amber-500 text-2xl font-semibold">₹1,000</p>
          <p className="text-gray-400 text-s">Minimum deposit</p>
        </div>

        <div>
          <p className="text-amber-500 text-2xl font-semibold">3 Plans</p>
          <p className="text-gray-400 text-s">3 / 6 / 12 months</p>
        </div>

        <div>
          <p className="text-amber-500 text-2xl font-semibold">100%</p>
          <p className="text-gray-400 text-s">Protected</p>
        </div>

        <div>
          <p className="text-amber-500 text-2xl font-semibold">Monthly</p>
          <p className="text-gray-400 text-s">Interest credited</p>
        </div>

      </div>

    </section>
  );
};

export default ForLenders;