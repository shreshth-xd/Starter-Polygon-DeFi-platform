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
import ProtectedRoute from './components/auth/ProtectedRoute';
import LenderDashboard from './components/dashboard/LenderDashboard';
import BorrowerDashboard from './components/dashboard/BorrowerDashboard';


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

      <Route
        path="/lender/dashboard"
        element={
          <ProtectedRoute role="lender">
            <LenderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/borrower/dashboard"
        element={
          <ProtectedRoute role="borrower">
            <BorrowerDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
