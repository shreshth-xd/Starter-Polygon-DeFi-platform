// src/components/auth/ProtectedRoute.jsx — Route guard
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Wraps a route and redirects to /login if not authenticated.
 * Optionally restricts to a specific role ("lender" | "borrower").
 *
 * Usage:
 *   <Route path="/lender/dashboard" element={
 *     <ProtectedRoute role="lender"><LenderDashboard /></ProtectedRoute>
 *   } />
 */ 
export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#080b12", color:"#e8a020", fontSize:18 }}>
        Loading CredAura...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    // Wrong role — redirect to their own dashboard
    return <Navigate to={user.role === "lender" ? "/lender/dashboard" : "/borrower/dashboard"} replace />;
  }

  return children;
}