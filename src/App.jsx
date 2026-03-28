import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/navbar'
import Hero from './components/Hero/Hero';
import HowItWorks from './components/Hero/HowItWorks';
import ForLenders from './components/Hero/ForLenders';
import ForBorrowers from './components/Hero/ForBorrowers';
import CreditScore from './components/Hero/CreditScore';
import Footer from './components/Hero/Footer';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';


function Home() {
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
