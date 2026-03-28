// src/components/auth/Login.jsx — CredAura Login Page
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from?.pathname || null;

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Both fields are required."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      // Redirect based on role
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(data.user.role === "lender" ? "/lender/dashboard" : "/borrower/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left auth-left--dark">
        <div className="auth-brand">
          <div className="auth-logo">CA</div>
          <h1>CredAura</h1>
        </div>
        <div className="auth-left-content">
          <h2>Welcome back.<br />Your money is working for you.</h2>
          <div className="auth-mini-stats">
            <div className="mini-stat">
              <span className="mini-stat-val gold">8–9%</span>
              <span className="mini-stat-lbl">Lender annual return</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-val teal">₹20K</span>
              <span className="mini-stat-lbl">Max loan amount</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-val gold">150%</span>
              <span className="mini-stat-lbl">Collateral protection</span>
            </div>
          </div>
          <p className="auth-tagline">"The bank that runs on code, not trust."</p>
        </div>
        <div className="auth-left-footer">
          <span className="auth-badge">🔒 256-bit Encryption</span>
          <span className="auth-badge">Polygon Network</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Welcome back</h2>
          <p className="auth-card-sub">Log in to your CredAura dashboard</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>
                Password
                <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn btn--gold" disabled={loading}>
              {loading ? "Logging in..." : "Log In →"}
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="wallet-btns">
            <button className="wallet-btn" type="button">
              🦊&nbsp; MetaMask
            </button>
            <button className="wallet-btn" type="button">
              🔗&nbsp; WalletConnect
            </button>
          </div>

          <div className="auth-security-note">
            🔒 &nbsp;256-bit encryption &nbsp;·&nbsp; NBFC regulated &nbsp;·&nbsp; KYC verified
          </div>

          <p className="auth-switch">
            New to CredAura? <Link to="/signup">Create a free account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}