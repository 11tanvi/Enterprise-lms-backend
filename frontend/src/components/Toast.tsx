import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Automatically close the toast after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const backgrounds = {
    success: "bg-white border-emerald-200 text-emerald-800",
    error: "bg-white border-red-200 text-red-800",
    info: "bg-white border-blue-200 text-blue-800",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl transition-all duration-300 animate-fade-in ${backgrounds[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-bold">{message}</p>
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
