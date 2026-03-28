// src/context/AuthContext.jsx — Global Auth State (React Context)
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import { loginWithMetaMask } from "../utils/walletAuth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("credaura_token");
    const savedUser  = localStorage.getItem("credaura_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const saveSession = (token, user) => {
    localStorage.setItem("credaura_token", token);
    localStorage.setItem("credaura_user",  JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const signup = async (formData) => {
    const res = await authAPI.signup(formData);
    saveSession(res.data.data.token, res.data.data.user);
    return res.data.data;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    saveSession(res.data.data.token, res.data.data.user);
    return res.data.data;
  };

  const loginWithWallet = async () => {
    const data = await loginWithMetaMask();
    saveSession(data.token, data.user);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem("credaura_token");
    localStorage.removeItem("credaura_user");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      const updatedUser = res.data.data.user;
      setUser(updatedUser);
      localStorage.setItem("credaura_user", JSON.stringify(updatedUser));
    } catch (_) {
      logout();
    }
  };

  /** Link MetaMask address to the logged-in borrower (for email/password accounts). */
  const connectBorrowerWallet = async (walletAddress) => {
    const res = await authAPI.connectWallet(walletAddress);
    const updatedUser = res.data.data.user;
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem("credaura_user", JSON.stringify(updatedUser));
    }
    return res.data.data;
  };

  const isLoggedIn   = !!token && !!user;
  const isLender     = isLoggedIn && user?.role === "lender";
  const isBorrower   = isLoggedIn && user?.role === "borrower";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn,
        isLender,
        isBorrower,
        signup,
        login,
        loginWithWallet,
        logout,
        refreshUser,
        connectBorrowerWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;