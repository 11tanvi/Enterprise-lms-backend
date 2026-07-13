import React from "react";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useApp();

  const handleGoHome = () => {
    if (userRole === "student") {
      navigate("/student/dashboard");
    } else if (userRole === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      navigate("/courses");
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in"
      id="forbidden-page-container"
    >
      <div
        className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 text-center space-y-6 relative overflow-hidden"
        id="forbidden-card"
      >
        {/* Visual Header Graphic */}
        <div className="relative mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 animate-pulse">
          <ShieldAlert className="w-12 h-12" />
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>

        {/* Content Details */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-[10px] font-mono font-black uppercase rounded-full">
            <Lock className="w-3 h-3" />
            Security Shield: Error 403
          </span>
          <h1 className="text-3xl font-display font-black text-black tracking-tight pt-2">
            Access Denied
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed font-sans px-4">
            You do not have the required role credentials to bypass this directory filter. This terminal endpoint is locked down.
          </p>
        </div>

        {/* Diagnostic info console */}
        <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 text-left font-mono text-[11px] text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Identity Class:</span>
            <span className="text-black font-bold uppercase">{userRole || "Anonymous"}</span>
          </div>
          <div className="flex justify-between">
            <span>Access Target:</span>
            <span className="text-[#6C1D5F] font-bold">Admin/Faculty Rail</span>
          </div>
          <div className="flex justify-between">
            <span>Security Status:</span>
            <span className="text-red-500 font-bold">FORBIDDEN</span>
          </div>
        </div>

        {/* Actions panel */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-black text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
            id="forbidden-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            id="forbidden-home-btn"
          >
            <Home className="w-4 h-4" />
            Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
