// src/services/api.js — Axios API Client
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("credaura_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("credaura_token");
      localStorage.removeItem("credaura_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup:        (data)   => API.post("/auth/signup", data),
  login:         (data)   => API.post("/auth/login", data),
  walletChallenge: (address) =>
    API.get("/auth/wallet-challenge", { params: { address } }),
  walletLogin:   (data)   => API.post("/auth/wallet-login", data),
  getMe:         ()       => API.get("/auth/me"),
  updateProfile: (data)   => API.patch("/auth/update-profile", data),
  submitKYC:     (data)   => API.post("/auth/submit-kyc", data),
  connectWallet: (wallet) => API.post("/auth/connect-wallet", { walletAddress: wallet }),
};

// ── Lender ────────────────────────────────────────────────────────────────────
export const lenderAPI = {
  getDashboard:    ()     => API.get("/lender/dashboard"),
  getDeposits:     ()     => API.get("/lender/deposits"),
  getDeposit:      (id)   => API.get(`/lender/deposits/${id}`),
  createDeposit:   (data) => API.post("/lender/deposit", data),
  withdraw:        (id)   => API.post(`/lender/deposits/${id}/withdraw`),
  getTransactions: ()     => API.get("/lender/transactions"),
  calculate:       (params) => API.get("/lender/calculator", { params }),
};

// ── Borrower ──────────────────────────────────────────────────────────────────
export const borrowerAPI = {
  getDashboard:     ()       => API.get("/borrower/dashboard"),
  checkEligibility: (amount) => API.post("/borrower/check-eligibility", { amountINR: amount }),
  calculateLoan:    (data)   => API.post("/borrower/calculate-loan", data),
  applyLoan:        (data)   => API.post("/borrower/apply-loan", data),
  getLoans:         ()       => API.get("/borrower/loans"),
  getLoan:          (id)     => API.get(`/borrower/loans/${id}`),
  repay:            (id, data) => API.post(`/borrower/loans/${id}/repay`, data),
  getTransactions:  ()       => API.get("/borrower/transactions"),
};

// ── Credit ────────────────────────────────────────────────────────────────────
export const creditAPI = {
  getMyScore:     ()       => API.get("/credit/score"),
  getByWallet:    (wallet) => API.get(`/credit/score/${wallet}`),
};

export default API;