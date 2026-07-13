import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Search,
  Bell,
  History,
  HelpCircle,
  ChevronDown,
  User,
  Shield,
  Key,
  LogOut,
  Menu,
} from "lucide-react";

interface HeaderProps {
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  placeholderText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchChange,
  searchValue = "",
  placeholderText = "Search courses, categories, or students...",
}) => {
  const {
    userRole,
    currentUser,
    logout,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      text: "Course 'GDPR & Privacy' has 10 new enrolments.",
      time: "10 mins ago",
      isUnread: true,
    },
    {
      id: 2,
      text: "System maintenance scheduled for Sunday 2 AM UTC.",
      time: "4 hours ago",
      isUnread: true,
    },
    {
      id: 3,
      text: "Active learner streak milestone unlocked.",
      time: "1 day ago",
      isUnread: false,
    },
  ];

  const handleProfileOptionClick = (option: string) => {
    alert(`Profile Option: "${option}" simulated successfully.`);
    setShowProfileMenu(false);
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm transition-all duration-300">
      {/* Sidebar Toggle & Search Input */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        <button
          onClick={handleToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 -ml-2 text-gray-500 hover:text-[#510047] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-5 h-5 transition-transform duration-200 active:scale-95" />
        </button>

        <div className="relative w-full max-w-[110px] min-[360px]:max-w-[150px] min-[400px]:max-w-[180px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-transparent rounded-full font-sans text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#510047] focus:ring-2 focus:ring-[#ffd7f0] transition-all placeholder:text-gray-400 text-gray-800 truncate"
            placeholder={placeholderText}
          />
        </div>
      </div>

      {/* Action Utilities & Profile details */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-500 hover:text-[#510047] hover:bg-gray-100 p-1.5 sm:p-2 rounded-full transition-colors relative"
          >
            <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                <span className="font-semibold text-xs sm:text-sm text-gray-800">
                  Notifications
                </span>
                <span
                  className="text-xs text-[#01AC9F] font-semibold cursor-pointer"
                  onClick={() => alert("Marked all as read")}
                >
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer ${notif.isUnread ? "bg-[#ffd7f0]/10" : ""}`}
                  >
                    <p className="text-xs text-gray-700 leading-normal">
                      {notif.text}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {notif.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History Clock Action */}
        <button
          onClick={() =>
            alert(
              "Simulated System Activity Log: Checked courses taxonomy and security records.",
            )
          }
          className="text-gray-500 hover:text-[#510047] hover:bg-gray-100 p-1.5 sm:p-2 rounded-full transition-colors hidden sm:block"
          title="Activity History"
        >
          <History className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        <div className="h-6 w-[1px] bg-gray-200 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1 sm:gap-2 cursor-pointer group select-none py-1 px-1.5 sm:py-1.5 sm:px-2.5 hover:bg-gray-50 rounded-xl transition-all"
          >
            <div className="text-right">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-[#510047] transition-colors truncate max-w-[65px] sm:max-w-none">
                {currentUser
                  ? currentUser.fullName
                  : userRole === "admin"
                    ? "Alex Rivera"
                    : "Student Learner"}
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-wide hidden sm:block">
                {currentUser
                  ? currentUser.role === "admin"
                    ? "LMS Administrator"
                    : "Academy Student"
                  : userRole === "admin"
                    ? "LMS Administrator"
                    : "Academy Student"}
              </p>
            </div>
            <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
          </div>

          {/* Profile Contextual Actions Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {currentUser ? currentUser.email : "sayabalaji1@gmail.com"}
                </p>
              </div>

              <button
                onClick={() => handleProfileOptionClick("My Profile")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" /> My Profile
              </button>
              <button
                onClick={() => handleProfileOptionClick("Security Settings")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Shield className="w-4 h-4 text-gray-400" /> Security
              </button>
              <button
                onClick={() => handleProfileOptionClick("API Access Keys")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Key className="w-4 h-4 text-gray-400" /> Developer Console
              </button>

              <div className="h-px bg-gray-50 my-1" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  if (confirm("Log out?")) {
                    logout();
                    navigate("/login");
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50/50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
