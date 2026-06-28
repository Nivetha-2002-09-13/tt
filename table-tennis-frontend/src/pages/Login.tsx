import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../services/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/app/dashboard");
    } catch (error: any) {
      if (error.response?.status === 403) setUnverifiedEmail(email);
      else toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: unverifiedEmail });
      toast.success("Verification email sent! Check your inbox.");
      setUnverifiedEmail("");
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Please enter your email address"); return; }
    setIsResetting(true);
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
      toast.success("Password reset link sent! Check your email.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch {
      toast.error("Failed to send reset link");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex text-white" style={{ background: "#061D23" }}>
      {/* ── Left Half: Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 bg-[#061D23]">
        <Link to="/" className="absolute top-8 left-8 sm:left-12 flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/60 rounded-lg
                          flex items-center justify-center transform transition-all group-hover:scale-110">
            <span className="text-white text-sm">🏓</span>
          </div>
          <span className="font-black text-lg tracking-tight">TT<span className="text-[#4AEEFF]">MS</span></span>
        </Link>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit}>
              <p className="text-[#4AEEFF] font-bold text-sm tracking-widest uppercase mb-2">Welcome Back</p>
              <h2 className="text-4xl font-black text-white mb-8">Account Sign In</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3.5
                               text-white placeholder-[#D8FBFF]/30 focus:border-[#4AEEFF] focus:bg-[#12679E]/20
                               transition-all outline-none"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl pl-4 pr-12 py-3.5
                                 text-white placeholder-[#D8FBFF]/30 focus:border-[#4AEEFF] focus:bg-[#12679E]/20
                                 transition-all outline-none"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4AEEFF]/60 hover:text-[#4AEEFF] transition-colors"
                    >
                      {showPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>

                {unverifiedEmail && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-red-300">Email not verified.</span>
                    <button type="button" onClick={handleResend} disabled={resending}
                            className="text-xs font-bold text-red-400 hover:text-red-300 underline">
                      {resending ? "Sending…" : "Resend Link"}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] font-black
                             py-3.5 rounded-xl text-sm uppercase tracking-widest hover:from-[#CFF9FF]
                             hover:to-[#4AEEFF] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(74,238,255,0.2)]"
                >
                  {isLoading ? "Signing In…" : "Sign In"}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-[#12679E]/30 text-center space-y-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-semibold text-[#D8FBFF]/60 hover:text-[#4AEEFF] transition-colors"
                >
                  Forgot your password?
                </button>
                <p className="text-sm text-[#D8FBFF]/40">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-[#4AEEFF] font-bold hover:underline">
                    Create one
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <p className="text-[#4AEEFF] font-bold text-sm tracking-widest uppercase mb-2">Recovery</p>
              <h2 className="text-4xl font-black text-white mb-8">Reset Password</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3.5
                               text-white placeholder-[#D8FBFF]/30 focus:border-[#4AEEFF] transition-all outline-none"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] font-black
                             py-3.5 rounded-xl text-sm uppercase tracking-widest hover:from-[#CFF9FF] transition-all"
                >
                  {isResetting ? "Sending…" : "Send Reset Link"}
                </button>
              </div>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm font-semibold text-[#D8FBFF]/60 hover:text-[#4AEEFF] transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* ── Right Half: Abstract Visual ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#0a2535] border-l border-[#12679E]/30"
           style={{ background: "linear-gradient(135deg, #0a2535 0%, #061D23 100%)" }}>
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.08] blur-3xl pointer-events-none"
             style={{ background: "radial-gradient(circle, #4AEEFF, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-3xl pointer-events-none"
             style={{ background: "radial-gradient(circle, #12679E, transparent)" }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
             style={{
               backgroundImage: `linear-gradient(#4AEEFF 1px, transparent 1px), linear-gradient(90deg, #4AEEFF 1px, transparent 1px)`,
               backgroundSize: "60px 60px",
             }}
        />

        <div className="relative z-10 m-auto max-w-lg text-center px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/40 rounded-3xl
                            flex items-center justify-center border border-[#4AEEFF]/30 shadow-[0_0_50px_rgba(74,238,255,0.2)]">
              <span className="text-6xl text-white">🏓</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-4">Master the Table</h3>
            <p className="text-[#D8FBFF]/60 text-lg">
              Manage your tournaments, track your statistics, and dominate the leaderboard in one seamless experience.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;