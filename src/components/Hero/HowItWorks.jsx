import React, { useState } from "react";

const borrowerSteps = [
  {
    id: "01",
    title: "Create account + KYC",
    desc: "Sign up with email, phone, and complete Aadhaar + PAN KYC.",
    tag: "Email + Aadhaar KYC",
  },
  {
    id: "02",
    title: "Connect MetaMask wallet",
    desc: "Link your crypto wallet — used only for locking collateral.",
    tag: "MetaMask connect",
  },
  {
    id: "03",
    title: "Get your on-chain credit score",
    desc: "Wallet history assigns score from 200–1000.",
    tag: "Score starts at 500",
  },
  {
    id: "04",
    title: "Lock crypto as collateral",
    desc: "Deposit ETH/BTC/MATIC worth 1.5x your loan.",
    tag: "ETH / BTC / MATIC",
  },
  {
    id: "05",
    title: "Receive INR in bank",
    desc: "Get funds via NEFT/IMPS in 2–4 hours.",
    tag: "₹2,000 – ₹20,000",
  },
  {
    id: "06",
    title: "Repay & unlock crypto",
    desc: "Repay loan + interest and get crypto back.",
    tag: "Crypto auto-released",
  },
];

const lenderSteps = [
  {
    id: "01",
    title: "Create your account",
    desc: "Sign up with email and phone. No crypto wallet needed.",
    tag: "Email signup only",
  },
  {
    id: "02",
    title: "Deposit INR via UPI / NEFT / IMPS",
    desc: "Transfer funds just like a bank transfer.",
    tag: "UPI / NEFT / IMPS",
  },
  {
    id: "03",
    title: "Choose your tenure plan",
    desc: "Pick 3, 6, or 12 months. Higher tenure = higher returns.",
    tag: "3 / 6 / 12 months",
  },
  {
    id: "04",
    title: "Funds matched automatically",
    desc: "Your funds are matched with verified borrowers.",
    tag: "Fully passive",
  },
  {
    id: "05",
    title: "Earn 8–9% interest",
    desc: "Returns are secured by crypto collateral.",
    tag: "8–9% guaranteed",
  },
  {
    id: "06",
    title: "Withdraw to your bank",
    desc: "Principal + interest sent to bank after maturity.",
    tag: "INR to bank account",
  },
];

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState("borrowers");

  const isBorrower = activeTab === "borrowers";
  const steps = isBorrower ? borrowerSteps : lenderSteps;

  return (
    <section id="How-It-Works" className="bg-[#050B18] text-white px-6 md:px-12 py-16 border-t border-gray-800">

      {/* Heading */}
      <div className="text-center space-y-4 mb-10">
        <p className={`text-sm tracking-widest ${
          isBorrower ? "text-green-500" : "text-amber-500"
        }`}>
          — HOW IT WORKS —
        </p>

        <h2 className="text-3xl md:text-5xl font-serif">
          Simple. Fast. Trustless.
        </h2>

        <p className="text-gray-400">
          Lenders use CredAura like a better FD. Borrowers unlock INR from crypto.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-[#0A1326] p-1 rounded-full flex w-full max-w-md">

          <button
            onClick={() => setActiveTab("borrowers")}
            className={`flex-1 py-2 cursor-pointer rounded-full transition-all ${
              isBorrower
                ? "bg-green-500 text-black"
                : "text-gray-400"
            }`}
          >
            For Borrowers
          </button>

          <button
            onClick={() => setActiveTab("lenders")}
            className={`flex-1 py-2 cursor-pointer rounded-full transition-all ${
              !isBorrower
                ? "bg-amber-500 text-black"
                : "text-gray-400"
            }`}
          >
            For Lenders
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`w-full md:w-[48%] bg-[#0A1326] border border-gray-800 rounded-xl p-6 
              hover:scale-[1.02] transition-all duration-300
              ${isBorrower ? "hover:border-green-600" : "hover:border-amber-600"}
            `}
          >

            {/* Step Header */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isBorrower
                    ? "bg-[#0F1F3D] text-green-500"
                    : "bg-[#1F1A0F] text-amber-500"
                }`}
              >
                {step.id}
              </div>

              <div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{step.desc}</p>
              </div>
            </div>

            {/* Tag */}
            <div className="mt-4">
              <span
                className={`text-xs px-3 py-1 border rounded-full ${
                  isBorrower
                    ? "border-green-500 text-green-500"
                    : "border-amber-500 text-amber-500"
                }`}
              >
                {step.tag}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-12 space-y-4">
        <p className="text-gray-300">
          {isBorrower
            ? "Ready to get your first loan?"
            : "Ready to start earning?"}
        </p>

        <button
          className={`px-6 py-3 rounded-full cursor-pointer transition-all hover:scale-105 ${
            isBorrower
              ? "bg-green-500 text-black hover:bg-green-600"
              : "bg-amber-500 text-black hover:bg-amber-600"
          }`}
        >
          {isBorrower
            ? "Apply for a Loan"
            : "Create Lender Account"}
        </button>
      </div>

    </section>
  );
};

export default HowItWorks;