import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#050B18] text-white px-6 md:px-12 py-12 border-t border-gray-800">

      {/* Top Section */}
      <div className="flex flex-col lg:flex-row gap-10 justify-between">

        {/* LEFT - Logo + Info */}
        <div className="flex-1 space-y-4">

          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-black font-bold px-3 py-1 rounded-md">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
                Cred<span className="text-amber-500">Aura</span>
            </span>
          </div>

          <p className="text-gray-400 text-sm max-w-sm">
            India's crypto-collateral INR lending platform. Lend in INR,
            earn 8–9%. Borrow in INR using crypto as collateral.
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {["NBFC Compliant", "KYC Verified", "Smart Contract Audited"].map((tag, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 border border-yellow-400 text-yellow-400 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

        </div>

        {/* LINKS */}
        <div className="flex flex-wrap flex-1 justify-between gap-10">

          {/* Platform */}
          <div>
            <h3 className="text-sm text-gray-400 mb-4">PLATFORM</h3>
            <ul className="space-y-2 text-sm">
              {[
                "How It Works",
                "For Lenders",
                "For Borrowers",
                "Credit Score",
                "Loan Calculator",
                "Interest Rates",
              ].map((item, i) => (
                <li key={i} className="hover:text-amber-500 transition cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-sm text-gray-400 mb-4">DEVELOPERS</h3>
            <ul className="space-y-2 text-sm">
              {[
                "Smart Contracts",
                "API Documentation",
                "GitHub Repository",
                "Security Audit",
                "Polygon Network",
                "ethers.js Docs",
              ].map((item, i) => (
                <li key={i} className="hover:text-amber-500 transition cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm text-gray-400 mb-4">COMPANY</h3>
            <ul className="space-y-2 text-sm">
              {[
                "About Us",
                "Blog",
                "Careers",
                "Terms of Service",
                "Privacy Policy",
                "Contact Us",
              ].map((item, i) => (
                <li key={i} className="hover:text-amber-500 transition cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      {/* Bottom Section */}
      <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">

        <p className="text-gray-500 text-sm text-center md:text-left">
          © 2026 CredAura. Secured by Solidity. Compliant with Indian regulations.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          {["INR Transactions", "Non-Custodial Crypto", "Polygon Network"].map((tag, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 border border-green-500 text-green-500 rounded-full 
                         hover:bg-green-500 hover:text-black transition"
            >
              {tag}
            </span>
          ))}
        </div>

      </div>

    </footer>
  );
};

export default Footer;