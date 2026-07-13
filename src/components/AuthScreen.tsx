import React, { useState } from "react";
import { Shield, KeyRound, Mail, UserPlus, Lock, RefreshCw, AlertCircle, Sparkles, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface AuthScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT";

export default function AuthScreen({ onLoginSuccess, theme, toggleTheme }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("LOGIN");
  const [email, setEmail] = useState("dispatcher@transitops.com"); // Pre-fill dispatcher as default for easier hackathon testing
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "DISPATCHER" | "DRIVER" | "CLIENT">("DISPATCHER");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "LOGIN") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login credentials verification failed.");
        onLoginSuccess(data.user, data.token);
      } else if (mode === "REGISTER") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, role, phone, company }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration validation failed.");
        onLoginSuccess(data.user, data.token);
      } else {
        // Forgot password
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed.");
        setSuccessMsg(data.message);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Quick preset login helper
  const handleRolePreset = (presetRole: "ADMIN" | "DISPATCHER" | "DRIVER" | "CLIENT") => {
    setError(null);
    setRole(presetRole);
    if (presetRole === "ADMIN") {
      setEmail("admin@transitops.com");
    } else if (presetRole === "DISPATCHER") {
      setEmail("dispatcher@transitops.com");
    } else if (presetRole === "DRIVER") {
      setEmail("driver@transitops.com");
    } else {
      setEmail("client@transitops.com");
    }
    setPassword("password");
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-[#f6f5f0] p-4 overflow-hidden">
      {/* Theme Toggle Button */}
      {toggleTheme && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center shadow-sm cursor-pointer backdrop-blur-md"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      )}

      {/* Background soft red glow circles */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#ef233c]/3 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#ef233c]/3 blur-[140px] pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Brand Logo and Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 mb-3 shadow-sm backdrop-blur-md">
          <span className="text-[10px] font-mono tracking-widest text-[#ef233c] font-bold uppercase">FLEET OPERATIONS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          Ship <span className="text-[#ef233c]">Happens</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto font-sans">
          Manage transport operations in one place.
        </p>
      </motion.div>

      {/* Main Elegant Auth Form Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] p-6 md:p-8 shadow-xl border-t-4 border-t-[#ef233c] z-10"
      >
        {/* Toggle Mode headers */}
        <div className="flex border-b border-slate-100 pb-4 mb-6 justify-between items-center text-xs">
          <button
            onClick={() => { setMode("LOGIN"); setError(null); }}
            className={`font-semibold pb-2 px-1 transition-all border-b-2 uppercase tracking-wider ${mode === "LOGIN" ? "text-[#ef233c] border-b-[#ef233c]" : "text-slate-400 border-b-transparent hover:text-slate-800"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("REGISTER"); setError(null); }}
            className={`font-semibold pb-2 px-1 transition-all border-b-2 uppercase tracking-wider ${mode === "REGISTER" ? "text-[#ef233c] border-b-[#ef233c]" : "text-slate-400 border-b-transparent hover:text-slate-800"}`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode("FORGOT"); setError(null); }}
            className={`font-semibold pb-2 px-1 transition-all border-b-2 uppercase tracking-wider ${mode === "FORGOT" ? "text-[#ef233c] border-b-[#ef233c]" : "text-slate-400 border-b-transparent hover:text-slate-800"}`}
          >
            Reset Password
          </button>
        </div>

        {/* Demo Role Select Preset Panel */}
        {mode === "LOGIN" && (
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <p className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider mb-2">DEMO QUICK ACCESS:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(["ADMIN", "DISPATCHER", "DRIVER", "CLIENT"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRolePreset(r)}
                  className={`text-[9px] font-bold py-1.5 rounded-lg border uppercase transition-all ${
                    role === r 
                      ? "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/30" 
                      : "bg-slate-100/80 text-slate-600 border-slate-200/60 hover:bg-slate-200/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Error Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-xs"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success message alerts */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs"
          >
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Core Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {mode === "REGISTER" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Vikram Malhotra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Meridian Retail"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2.5 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 99999 88888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2.5 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2.5 px-3 text-sm text-slate-800 focus:outline-none transition-all"
                  >
                    <option value="CLIENT">Client (Shipment tracking & booking)</option>
                    <option value="DRIVER">Driver (Freight & logistics)</option>
                    <option value="DISPATCHER">Dispatcher (Operations routing)</option>
                    <option value="ADMIN">Admin (Full system access)</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="dispatcher@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          {mode !== "FORGOT" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-700">Password</label>
                {mode === "LOGIN" && (
                  <button
                    type="button"
                    onClick={() => setMode("FORGOT")}
                    className="text-[11px] text-[#ef233c] hover:text-[#d90429] font-medium"
                  >
                    Recover Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#ef233c] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Core Submit Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ef233c] hover:bg-[#d90429] disabled:bg-[#ef233c]/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : mode === "LOGIN" ? (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : mode === "REGISTER" ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Footer Credentials Info */}
      <p className="text-[10px] font-mono text-slate-400 mt-8 uppercase tracking-widest">
        Secure Access &bull; Ship Happens
      </p>
    </div>
  );
}
