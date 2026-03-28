// src/components/auth/Signup.jsx — CredAura Sign Up Page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

const INITIAL = {
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  role: "borrower", upiId: "", bankAccountNumber: "",
};

export default function Signup() {
  const { signup }    = useAuth();
  const navigate      = useNavigate();
  const [form,  setForm]    = useState(INITIAL);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [step,  setStep]    = useState(1); // 1 = pick role, 2 = fill form

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validateForm = () => {
    if (!form.fullName.trim())  return "Full name is required.";
    if (!form.email.trim())     return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email.";
    if (!form.phone.trim())     return "Phone number is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (form.role === "lender" && !form.upiId.trim()) return "UPI ID is required for lenders.";
    if (form.role === "borrower" && !form.bankAccountNumber.trim())
      return "Bank account number is required for borrowers.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
        role:     form.role,
        ...(form.role === "lender"   && { upiId:             form.upiId }),
        ...(form.role === "borrower" && { bankAccountNumber: form.bankAccountNumber }),
      };
      await signup(payload);
      navigate(form.role === "lender" ? "/lender/dashboard" : "/borrower/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">CA</div>
          <h1>CredAura</h1>
        </div>
        <div className="auth-left-content">
          <h2>Start your journey to smarter finance.</h2>
          <ul className="auth-benefits">
            <li><span className="benefit-icon gold">💰</span>Lenders earn 8–9% on INR — no crypto needed</li>
            <li><span className="benefit-icon teal">🏠</span>Borrowers get ₹2K–₹20K without selling crypto</li>
            <li><span className="benefit-icon teal">🔒</span>Smart contract secures every transaction</li>
            <li><span className="benefit-icon gold">⚡</span>Account created in under 2 minutes</li>
          </ul>
        </div>
        <div className="auth-left-footer">
          <span className="auth-badge">NBFC Compliant</span>
          <span className="auth-badge">KYC Verified</span>
          <span className="auth-badge">Audited</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Create your account</h2>
          <p className="auth-card-sub">Free to join. Start in 2 minutes.</p>

          {/* Role toggle */}
          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn ${form.role === "lender" ? "role-btn--gold" : ""}`}
              onClick={() => setForm((p) => ({ ...p, role: "lender" }))}
            >
              💰 Lend &amp; Earn INR
            </button>
            <button
              type="button"
              className={`role-btn ${form.role === "borrower" ? "role-btn--teal" : ""}`}
              onClick={() => setForm((p) => ({ ...p, role: "borrower" }))}
            >
              🏠 Borrow Against Crypto
            </button>
          </div>

          {/* Role note */}
          <div className={`auth-note ${form.role === "lender" ? "auth-note--gold" : "auth-note--teal"}`}>
            {form.role === "lender"
              ? "💡 No crypto wallet needed. Just create account → deposit INR → start earning."
              : "🦊 You'll connect MetaMask after signup to lock crypto as collateral for INR loans."}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input name="fullName" type="text" placeholder="Rahul Sharma"
                  value={form.fullName} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" type="tel" placeholder="+91 98765 43210"
                  value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input name="password" type="password" placeholder="Min 8 characters"
                  value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input name="confirmPassword" type="password" placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            {form.role === "lender" && (
              <div className="form-group">
                <label>UPI ID <span className="label-hint">(for receiving interest payments)</span></label>
                <input name="upiId" type="text" placeholder="yourname@upi"
                  value={form.upiId} onChange={handleChange} />
              </div>
            )}

            {form.role === "borrower" && (
              <div className="form-group">
                <label>Bank Account Number <span className="label-hint">(for INR loan disbursement)</span></label>
                <input name="bankAccountNumber" type="text" placeholder="Enter your bank account number"
                  value={form.bankAccountNumber} onChange={handleChange} />
              </div>
            )}

            <button
              type="submit"
              className={`auth-submit-btn ${form.role === "lender" ? "btn--gold" : "btn--teal"}`}
              disabled={loading}
            >
              {loading ? "Creating account..." : form.role === "lender"
                ? "Create Lender Account →"
                : "Create Borrower Account →"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}