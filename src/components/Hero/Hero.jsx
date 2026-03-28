import React from 'react';
import { Link } from "react-router-dom";

import heroImg from '../../assets/hero section image.png'; 

const Hero = () => {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-12 gap-10">

        {/* LEFT */}
        <div className="flex-1 space-y-6 py-12">

          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase">
            INR LENDING · CRYPTO COLLATERAL · WEB3 SECURED
          </p>

          <h1 className="text-4xl md:text-7xl font-serif text-white leading-tight">
            Invest in <span className="text-amber-500 font-serif" >INR.</span><br />
            Borrow in <span className="text-green-600">INR.</span><br />
            Secured by Crypto.
          </h1>

          <p className="text-gray-400 max-w-lg">
            Lenders deposit INR and earn 8–9% interest — no crypto needed.
            Borrowers lock crypto as collateral and get ₹2,000–₹20,000 directly in their bank account.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
           <Link to = "/signup"className="bg-amber-500 text-black px-6 py-3 rounded-full hover:scale-105 hover:bg-amber-600 transition-all cursor-pointer">
              Lend & Earn 9%
            </Link>

            <Link to = "/signup" className="bg-green-500 text-black px-6 py-3 rounded-full hover:scale-105 hover:bg-green-600 transition-all ease-in-out cursor-pointer ">
              Borrow Against Crypto
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 pt-6 text-sm">
            <div>
              <p className="text-amber-500 text-xl font-semibold">8–9%</p>
              <p className="text-gray-400">Lender interest</p>
            </div>
            <div>
              <p className="text-green-500 text-xl font-semibold">10–12%</p>
              <p className="text-gray-400">Borrower rate</p>
            </div>
            <div>
              <p className="text-white text-xl font-semibold">₹20,000</p>
              <p className="text-gray-400">Max loan</p>
            </div>
            <div>
              <p className="text-white text-xl font-semibold">150%</p>
              <p className="text-gray-400">Collateral ratio</p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col gap-6 w-full">
         <img 
              src={heroImg} 
              alt="Platform Preview" 
              className="relative z-10 w-full h-auto "
            />
        </div>

      </section>

    
  );
};

export default Hero;