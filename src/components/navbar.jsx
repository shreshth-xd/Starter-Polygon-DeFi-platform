import React from "react";
import { Link } from "react-router-dom";


const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#05080a]/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* 1. Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-black text-xl">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Cred<span className="text-amber-500">Aura</span>
          </span>
        </div>

        {/* 2. Navigation Links (Center) */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#How-It-Works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How It Works</a>
          <a href="#For-Lenders" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">For Lenders</a>
          <a href="#For-Borrowers" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">For Borrowers</a>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Calculater</a>
          <a href="#Credit-Score" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Credit Score</a>
        </div>

        {/* 3. Action Buttons (Right) */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2 text-sm cursor-pointer font-medium text-slate-300 hover:text-white border border-slate-700 rounded-full transition-all hover:bg-slate-800"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 text-sm cursor-pointer font-bold text-black bg-amber-500 rounded-full hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            Get Started
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;