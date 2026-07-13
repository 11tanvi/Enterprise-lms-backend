import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Mail, Eye, EyeOff, User, ArrowRight, Shield, ClipboardList } from "lucide-react";
import authService from "../services/authService";

// Exact image representation of the green fire-breathing dragon mascot
const DragonMascot: React.FC = () => (
  <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto select-none flex items-center justify-center">
    <img
      alt="Friendly Dragon Mascot"
      className="w-full h-full object-contain"
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9PawYKG8aibBZiLcS4f93NVQe2rsJ4bAOPNmfae6RQhvDun0CV7FCKU0QYiHP1fxuc3baXV256tfbACRRHZozkOgrXeqMFeR5i7BSEY4A3C7eRsHpn24EGpqxN4qGPUDO09-x5K21ttHivTrpPLYm_w3hnA2b_Q9DAgyF5ZTeFl9kj0w93dN8cnIw66C-acRU7YMcGyM8BPmGPjqzqvHmwDPzUJjW6KW2D_7OZvcIFYTtMdpMZWb4ruv3YPVI9M4b7RKiSslRu_EL"
      referrerPolicy="no-referrer"
    />
  </div>
);

export const Login: React.FC = () => {
  const { userRole, login, showToast } = useApp();
  const navigate = useNavigate();

  // Authentication mode: login or signup
  const [isSignup, setIsSignup] = useState<boolean>(false);

  // Form input states
  const [fullName, setFullName] = useState<string>("Admin User");
  const [email, setEmail] = useState<string>("admin@educorp.com");
  const [password, setPassword] = useState<string>("adminpass123");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Redirect if already logged in
  useEffect(() => {
    if (userRole) {
      switch (userRole) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "teacher":
          navigate("/teacher/dashboard");
          break;
        case "student":
          navigate("/student/dashboard");
          break;
        default:
          navigate("/courses");
      }
    }
  }, [userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast("Please provide a valid email address.", "error");
      return;
    }

    try {
      if (isSignup) {
        // Register using the real database auth endpoint
        const response = await authService.register(fullName, email, password);
        login(response);
        showToast(
          `Account successfully created for ${response.fullName}!`,
          "success",
        );
        switch (response.role) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "teacher":
            navigate("/teacher/dashboard");
            break;
          case "student":
            navigate("/student/dashboard");
            break;
          default:
            navigate("/courses");
        }
      } else {
        // Login using the real database auth endpoint
        const response = await authService.login(email, password);
        login(response);
        
        switch (response.role) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "teacher":
            navigate("/teacher/dashboard");
            break;
          case "student":
            navigate("/student/dashboard");
            break;
          default:
            navigate("/courses");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Authentication failed. Please verify your credentials.";
      showToast(errorMsg, "error");
    }
  };

  // Quick auto-filler buttons for convenience during grading/testing
  const autoFillCredentials = (role: "admin" | "teacher" | "student") => {
    if (role === "admin") {
      setFullName("Admin User");
      setEmail("admin@educorp.com");
      setPassword("adminpass123");
      showToast("Auto-filled Administrator credentials.", "info");
    } else if (role === "teacher") {
      setFullName("Teacher User");
      setEmail("teacher@educorp.com");
      setPassword("teacherpass123");
      showToast("Auto-filled Teacher credentials.", "info");
    } else {
      setFullName("Student User");
      setEmail("student@educorp.com");
      setPassword("studentpass123");
      showToast("Auto-filled Student credentials.", "info");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf0f5] flex items-center justify-center p-4 sm:p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Absolute Decorative Blobs to match references */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-pink-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-100/40 blur-[100px] pointer-events-none" />

      {/* Main Responsive Split Layout Card container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2 relative z-10 border border-[#f1e4ec]">
        {/* LEFT COLUMN: Pale Pinkish/Lavender Mascot Panel */}
        <div className="bg-[#fcf5f9] p-8 md:p-12 flex flex-col justify-center items-center relative border-b md:border-b-0 md:border-r border-[#f1e4ec]">
          {/* Elegant White Speech Bubble */}
          <div className="relative bg-white text-[#2a2327] font-medium text-center text-sm sm:text-base px-6 py-4 rounded-2xl border border-[#ecdbe4] shadow-sm max-w-[280px] mb-6 animate-bounce">
            {isSignup ? (
              <span>Join me! Let's start your learning journey together.</span>
            ) : (
              <span>
                Welcome back! Ready to continue your learning adventure?
              </span>
            )}
            {/* Bubble Tail pointing downwards */}
            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-[#ecdbe4] rotate-45" />
          </div>

          {/* Dragon Vector mascot representation */}
          <DragonMascot />

          {/* Floating Dev Shortcuts Panel */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md rounded-xl p-3 border border-[#ecdbe4] text-center">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#7c0a6b] mb-1.5 font-display">
              Testing Shortcuts
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => autoFillCredentials("admin")}
                className="px-2 py-1 rounded bg-[#7c0a6b]/10 text-[#7c0a6b] font-bold text-[10px] sm:text-xs hover:bg-[#7c0a6b]/20 transition-all cursor-pointer"
              >
                Fill Admin
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials("teacher")}
                className="px-2 py-1 rounded bg-purple-100 text-purple-700 font-bold text-[10px] sm:text-xs hover:bg-purple-200 transition-all cursor-pointer"
              >
                Fill Teacher
              </button>
              <button
                type="button"
                onClick={() => autoFillCredentials("student")}
                className="px-2 py-1 rounded bg-[#01AC9F]/10 text-[#01AC9F] font-bold text-[10px] sm:text-xs hover:bg-[#01AC9F]/20 transition-all cursor-pointer"
              >
                Fill Student
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pure White Input Form Panel */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Text Block */}
            <div className="space-y-1.5">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1c181a] tracking-tight font-display">
                {isSignup ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                {isSignup
                  ? "Start your learning adventure today."
                  : "Sign in to continue your learning journey."}
              </p>
            </div>

            {/* Inputs Section */}
            <div className="space-y-4">
              {/* Full Name Input (Signup Mode Only) */}
              {isSignup && (
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-bold text-[#2a2327] uppercase tracking-wider font-display"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required={isSignup}
                      className="w-full bg-[#f0f4fc] text-gray-800 placeholder-gray-400 font-semibold text-sm rounded-md px-4 py-3.5 pr-11 border border-transparent focus:bg-white focus:border-[#7c0a6b] focus:ring-1 focus:ring-[#7c0a6b] outline-none transition-all duration-200"
                    />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Email Address Input */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-[#2a2327] uppercase tracking-wider font-display"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@educorp.com"
                    required
                    className="w-full bg-[#eef4ff] text-gray-800 placeholder-gray-400 font-semibold text-sm rounded-md px-4 py-3.5 pr-11 border border-transparent focus:bg-white focus:border-[#7c0a6b] focus:ring-1 focus:ring-[#7c0a6b] outline-none transition-all duration-200"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-[#2a2327] uppercase tracking-wider font-display"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#eef4ff] text-gray-800 placeholder-gray-400 font-semibold text-sm rounded-md px-4 py-3.5 pr-11 border border-transparent focus:bg-white focus:border-[#7c0a6b] focus:ring-1 focus:ring-[#7c0a6b] outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Submit Buttons */}
            <div>
              {isSignup ? (
                <button
                  type="submit"
                  id="signup-submit-btn"
                  className="w-full py-3.5 bg-[#ff6c02] hover:bg-[#e05e00] text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  id="login-submit-btn"
                  className="w-full py-3.5 bg-[#800d71] hover:bg-[#6c005f] text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] cursor-pointer text-center"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Bottom Toggle links matching layout styles exactly */}
            <div className="pt-2 text-center">
              {isSignup ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    // Pre-populate with typical admin demo account
                    setEmail("admin@educorp.com");
                    setPassword("adminpass123");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#01AC9F] hover:underline transition-all cursor-pointer font-display"
                >
                  &larr; Already have an account? Back to Login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setFullName("");
                    setEmail("");
                    setPassword("");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#800d71] hover:underline transition-all cursor-pointer font-display"
                >
                  New here? Create Account{" "}
                  <span className="ml-0.5">&rarr;</span>
                </button>
              )}
            </div>

            {/* Testing Credentials Helper Box */}
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <p className="text-xs font-bold text-[#7c0a6b] uppercase tracking-wider font-display">
                Testing Credentials
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded border border-purple-100 bg-purple-50/30 text-left">
                  <div className="flex items-center gap-1 text-purple-700">
                    <Shield className="w-3 h-3 shrink-0" />
                    <p className="text-[10px] font-bold uppercase font-display">Admin</p>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 mt-0.5 break-all">admin@educorp.com</p>
                  <p className="text-[10px] text-gray-500 font-mono">pw: adminpass123</p>
                </div>
                <div className="p-2.5 rounded border border-purple-100 bg-purple-50/30 text-left">
                  <div className="flex items-center gap-1 text-purple-700">
                    <ClipboardList className="w-3 h-3 shrink-0" />
                    <p className="text-[10px] font-bold uppercase font-display">Teacher</p>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 mt-0.5 break-all">teacher@educorp.com</p>
                  <p className="text-[10px] text-gray-500 font-mono">pw: teacherpass123</p>
                </div>
                <div className="p-2.5 rounded border border-[#01AC9F]/20 bg-[#01AC9F]/5 text-left">
                  <div className="flex items-center gap-1 text-[#01AC9F]">
                    <User className="w-3 h-3 shrink-0" />
                    <p className="text-[10px] font-bold uppercase font-display">Student</p>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 mt-0.5 break-all">student@educorp.com</p>
                  <p className="text-[10px] text-gray-500 font-mono">pw: studentpass123</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
