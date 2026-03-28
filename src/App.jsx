import { useState } from 'react'
import './App.css'
import Navbar from './components/navbar'
import Hero from './components/Hero/Hero';
import HowItWorks from './components/Hero/HowItWorks';
import ForLenders from './components/Hero/ForLenders';
import ForBorrowers from './components/Hero/ForBorrowers';
import CreditScore from './components/Hero/CreditScore';
import Footer from './components/Hero/Footer';


function App() {
  return (
    <div className="min-h-screen bg-[#05080a]">
      <Navbar />
      <Hero />
      <HowItWorks/>
      <ForLenders/>
      <ForBorrowers/>
      <CreditScore/>
      <Footer/>
    </div>
  );
}

export default App;
