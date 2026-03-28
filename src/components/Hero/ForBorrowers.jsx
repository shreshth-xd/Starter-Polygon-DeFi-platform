import React from "react";
import { Link } from "react-router-dom";


const timeline = [
  {
    title: "You lock 0.304 ETH as collateral",
    desc: "Worth ≈ ₹19,000 on Polygon",
    tag: "Collateral locked",
  },
  {
    title: "ChainLend sends ₹12,000 to your bank",
    desc: "Via NEFT/IMPS in 2–4 hours",
    tag: "INR disbursed",
  },
  {
    title: "You repay ₹2,171/month for 6 months",
    desc: "Total repayment: ₹13,026",
    tag: "Monthly EMI",
  },
  {
    title: "Smart contract returns your crypto",
    desc: "100% of crypto back",
    tag: "Crypto returned",
  },
];

const features = [
  {
    title: "Keep your crypto",
    desc: "Your ETH/BTC stays locked — not sold.",
  },
  {
    title: "Smart contract vault",
    desc: "Immutable contract — no human control.",
  },
  {
    title: "INR in 2–4 hours",
    desc: "Fast bank transfer after verification.",
  },
  {
    title: "Build credit on blockchain",
    desc: "Repayments improve your score.",
  },
  {
    title: "No paperwork beyond KYC",
    desc: "No salary slips or CIBIL needed.",
  },
];

const ForBorrowers = () => {
  return (
    <section id="For-Borrowers" className="bg-[#050B18] text-white px-6 md:px-12 py-16 border-t border-gray-800">

      {/* Heading */}
      <div className="text-center mb-12 space-y-4">
        <p className="text-green-500 text-s tracking-widest">
          — FOR BORROWERS —
        </p>

        <h2 className="text-3xl md:text-5xl font-serif">
          Get ₹2,000–₹20,000 INR.
        </h2>

        <p className="text-gray-400">
          Without selling a single coin.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* LEFT TIMELINE */}
        <div className="flex-1 bg-[#0A1326] border border-gray-800 rounded-xl p-6">

          <h3 className="mb-12 font-semibold text-center text-xl">How a loan works</h3>

          <div className="flex flex-col gap-8">

            {timeline.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">

                {/* Circle + line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#0F1F3D] flex items-center justify-center text-green-500">
                    ✓
                  </div>

                  {index !== timeline.length - 1 && (
                    <div className="w-2px h-10 bg-gray-700 mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-gray-400 text-s">{item.desc}</p>

                  <span className="inline-block mt-2 text-xs px-3 py-1 border border-green-500 text-green-500 rounded-full">
                    {item.tag}
                  </span>
                </div>

              </div>
            ))}

          </div>

          {/* Example Box */}
          <div className="mt-8 bg-[#071C1A] border border-teal-800 rounded-lg p-4 text-sm">
            <p className="text-green-500 font-bold mb-2">
              Example: ₹12,000 loan
            </p>

            <div className="flex flex-wrap justify-between gap-4 text-gray-300">
              <p>Collateral: 0.304 ETH</p>
              <p>EMI: ₹2,171</p>
              <p>Interest: ₹1,026</p>
              <p className="text-green-500">100% returned</p>
            </div>
          </div>

        </div>

        {/* RIGHT FEATURES */}
        <div className="flex-1 flex flex-col gap-4">

          {features.map((item, index) => (
            <div
              key={index}
              className={`bg-[#0A1326] border border-gray-800 rounded-xl p-5 
                hover:scale-[1.02] hover:border-green-500 transition-all duration-300`}
            >
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-gray-400 text-m">{item.desc}</p>
            </div>
          ))}

          {/* CTA */}
          <div className="mt-6 text-center">
            <Link to="/signup" className="bg-green-600 text-black font-serif px-6 py-3 cursor-pointer rounded-full 
                               hover:scale-105 hover:bg-green-500 transition-all ">
              Apply for a Loan — ₹2K to ₹20K
            </Link>

            <p className="text-gray-400 text-s mt-2">
              Loan range ₹2,000 – ₹20,000 · Flexible tenure
            </p>
          </div>

        </div>

      </div>

    </section>
  );
};

export default ForBorrowers;