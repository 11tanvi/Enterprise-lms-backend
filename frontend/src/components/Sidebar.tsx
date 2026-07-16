import React, { useState } from "react";
import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  BookOpen,
  HelpCircle,
  LogOut,
  FolderTree,
  Sparkles,
  Shield,
  User,
  X,
  ClipboardList,
  BarChart3,
  Users,
  Calendar, // <-- Added the Calendar icon here for your Events button
} from "lucide-react";
import { BRAND_CONFIG } from "../lib/brandConfig";

export const Sidebar: React.FC = () => {
  const {
    userRole,
    currentUser,
    logout,
    sidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
      setMobileSidebarOpen(false);
      navigate("/login");
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#510047] text-white flex flex-col py-6 z-50 shadow-xl border-r border-[#3c0034] transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "md:w-[80px]" : "md:w-[280px]"
      } ${
        mobileSidebarOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      } w-[280px]`}
    >
      {/* Brand Header & Mobile Close */}
      <div
        className={`px-6 mb-8 flex items-center justify-between ${sidebarCollapsed ? "md:px-0 md:justify-center" : ""}`}
      >
        <Link to="/courses" className="flex items-center gap-3">
          {logoError ? (
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xl text-[#76f7e8] border border-white/20 shadow-inner select-none shrink-0">
              X
            </div>
          ) : (
            <img
              src={BRAND_CONFIG.logoWhite}
              alt={`${BRAND_CONFIG.name} Logo`}
              onError={() => setLogoError(true)}
              referrerPolicy="no-referrer"
              className="h-10 w-auto max-w-[120px] object-contain transition-transform duration-300 hover:scale-105 cursor-pointer shrink-0"
            />
          )}
          <span
            className={`text-lg font-extrabold tracking-tight text-white select-none transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
          >
            {BRAND_CONFIG.name}
          </span>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors md:hidden cursor-pointer"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Mini Profile Detail */}
      <div
        className={`mx-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 transition-all duration-300 relative group/profile ${sidebarCollapsed ? "md:mx-2 md:p-3 md:justify-center" : ""}`}
      >
        <div
          className={`p-2 rounded-lg shrink-0 ${
            userRole === "admin"
              ? "bg-[#ffd7f0]/20 text-[#76f7e8]"
              : userRole === "teacher"
                ? "bg-purple-100/20 text-purple-300"
                : "bg-[#01AC9F]/20 text-[#76f7e8]"
          }`}
        >
          {userRole === "admin" ? (
            <Shield className="w-5 h-5 text-[#ffd7f0]" />
          ) : userRole === "teacher" ? (
            <ClipboardList className="w-5 h-5 text-purple-300" />
          ) : (
            <User className="w-5 h-5 text-[#01AC9F]" />
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
        >
          <p className="text-[10px] font-extrabold text-white/50 tracking-wider uppercase truncate">
            {currentUser ? currentUser.fullName : "Active Session"}
          </p>
          <p className="text-xs font-bold text-white truncate">
            {currentUser
              ? currentUser.role === "admin"
                ? "Administrator"
                : currentUser.role === "teacher"
                  ? "Teacher"
                  : "Student"
              : userRole === "admin"
                ? "Administrator"
                : userRole === "teacher"
                  ? "Teacher"
                  : "Student"}
          </p>
        </div>

        {/* Tooltip on hover when collapsed */}
        {sidebarCollapsed && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/profile:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50 font-medium hidden md:block">
            <p className="font-bold">
              {currentUser ? currentUser.fullName : "Active Session"}
            </p>
            <p className="text-white/60 text-[10px]">
              {currentUser
                ? currentUser.role === "admin"
                  ? "Administrator"
                  : currentUser.role === "teacher"
                    ? "Teacher"
                    : "Student"
                : userRole === "admin"
                  ? "Administrator"
                  : userRole === "teacher"
                    ? "Teacher"
                    : "Student"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow space-y-1">
        <NavLink
          to="/courses"
          onClick={() => setMobileSidebarOpen(false)}
          className={({ isActive }) =>
            `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
              isActive
                ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                : "text-white/70 hover:text-white hover:bg-white/5"
            } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
          }
        >
          {({ isActive }) => (
            <>
              {sidebarCollapsed && isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
              )}

              <BookOpen
                className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
              />
              <span
                className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
              >
                Course Catalog
              </span>
              {isActive && !sidebarCollapsed && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
              )}

              {/* Hover Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                  Course Catalog
                </div>
              )}
            </>
          )}
        </NavLink>

        {/* --- NEW CAMPUS EVENTS LINK STARTS HERE --- */}
        <NavLink
          to="/events"
          onClick={() => setMobileSidebarOpen(false)}
          className={({ isActive }) =>
            `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
              isActive
                ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                : "text-white/70 hover:text-white hover:bg-white/5"
            } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
          }
        >
          {({ isActive }) => (
            <>
              {sidebarCollapsed && isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
              )}

              <Calendar
                className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
              />
              <span
                className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
              >
                Campus Events
              </span>
              {isActive && !sidebarCollapsed && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
              )}

              {/* Hover Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                  Campus Events
                </div>
              )}
            </>
          )}
        </NavLink>
        {/* --- NEW CAMPUS EVENTS LINK ENDS HERE --- */}

        {/* Admin-Only navigation item */}
        {userRole === "admin" && (
          <NavLink
            to="/categories"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
                isActive
                  ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                {sidebarCollapsed && isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
                )}

                <FolderTree
                  className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
                />
                <span
                  className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
                >
                  Category Management
                </span>
                {isActive && !sidebarCollapsed && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
                )}

                {/* Hover Tooltip when collapsed */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                    Category Management
                  </div>
                )}
              </>
            )}
          </NavLink>
        )}

        {/* Teacher/Admin navigation items */}
        {(userRole === "admin" || userRole === "teacher") && (
          <>
            <NavLink
              to="/teacher/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
                  isActive
                    ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {sidebarCollapsed && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
                  )}

                  <ClipboardList
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
                  />
                  <span
                    className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
                  >
                    Teacher Assignments
                  </span>
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
                  )}

                  {/* Hover Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                      Teacher Assignments
                    </div>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/teacher/batches"
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
                  isActive
                    ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {sidebarCollapsed && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
                  )}

                  <Users
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
                  />
                  <span
                    className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
                  >
                    Batch Management
                  </span>
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
                  )}

                  {/* Hover Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                      Batch Management
                    </div>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/teacher/reports"
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
                  isActive
                    ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {sidebarCollapsed && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
                  )}

                  <BarChart3
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
                  />
                  <span
                    className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
                  >
                    Reports & Analytics
                  </span>
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
                  )}

                  {/* Hover Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                      Reports & Analytics
                    </div>
                  )}
                </>
              )}
            </NavLink>
          </>
        )}

        {/* Student-Only navigation item */}
        {userRole === "student" && (
          <>
            <NavLink
              to="/student/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
                  isActive
                    ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {sidebarCollapsed && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
                  )}

                  <ClipboardList
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
                  />
                  <span
                    className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
                  >
                    My Assignments
                  </span>
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
                  )}

                  {/* Hover Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                      My Assignments
                    </div>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/student/batches"
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-200 group relative ${
                  isActive
                    ? "border-l-4 border-[#76f7e8] bg-white/10 text-[#76f7e8] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } ${sidebarCollapsed ? "md:px-0 md:justify-center md:border-l-0" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {sidebarCollapsed && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#76f7e8] hidden md:block" />
                  )}

                  <Users
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-[#76f7e8]" : "text-white/60 group-hover:text-white"}`}
                  />
                  <span
                    className={`text-sm font-medium transition-all duration-300 ${sidebarCollapsed ? "md:opacity-0 md:w-0 md:hidden" : "block"}`}
                  >
                    Browse Batches
                  </span>
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#76f7e8]" />
                  )}

                  {/* Hover Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                      Browse Batches
                    </div>
                  )}
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom Sidebar Panel */}
      <div
        className={`mt-auto px-6 space-y-4 ${sidebarCollapsed ? "md:px-2 md:space-y-3" : ""}`}
      >
        {/* Admin-Only Course Creator Shortcut */}
        {userRole === "admin" && (
          <div className="relative group/create">
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                navigate("/wizard");
              }}
              className={`w-full bg-[#01AC9F] hover:bg-[#008f84] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer ${
                sidebarCollapsed
                  ? "md:h-10 md:w-10 md:p-0 md:rounded-full md:mx-auto"
                  : "py-2.5 text-xs"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#76f7e8] shrink-0" />
              <span className={sidebarCollapsed ? "md:hidden" : "block"}>
                Create Course
              </span>
            </button>

            {/* Hover Tooltip when collapsed */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/create:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                Create Course
              </div>
            )}
          </div>
        )}

        {/* Upgrade Plan Banner */}
        <div
          className={`p-4 rounded-xl bg-white/5 border border-white/10 text-center transition-all duration-300 relative group/upgrade ${sidebarCollapsed ? "md:p-0 md:bg-transparent md:border-0" : ""}`}
        >
          <div className={sidebarCollapsed ? "md:hidden" : "block"}>
            <p className="text-[11px] font-semibold tracking-wider text-white/50 uppercase mb-2">
              Enterprise Plan
            </p>
            <button
              onClick={() =>
                alert(
                  "Upgrade request sent to accounts department! Standard tier active.",
                )
              }
              className="w-full py-2 bg-[#006a62] hover:bg-[#01ac9f] text-white rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 border border-white/10 hover:border-transparent shadow-sm cursor-pointer"
            >
              Upgrade Plan
            </button>
          </div>

          {/* Icon trigger when collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={() =>
                alert(
                  "Upgrade request sent to accounts department! Standard tier active.",
                )
              }
              className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto hidden md:flex active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#76f7e8]" />
            </button>
          )}

          {/* Hover Tooltip when collapsed */}
          {sidebarCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/upgrade:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
              Upgrade Plan (Enterprise)
            </div>
          )}
        </div>

        {/* Utility Actions */}
        <div
          className={`pt-4 border-t border-white/10 space-y-1 ${sidebarCollapsed ? "md:pt-3" : ""}`}
        >
          <div className="relative group/support">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("EduCorp Support: How can we assist you today?");
              }}
              className={`flex items-center gap-3 py-2 text-white/70 hover:text-white transition-colors ${
                sidebarCollapsed ? "md:justify-center" : ""
              }`}
            >
              <HelpCircle className="w-5 h-5 text-white/50 shrink-0" />
              <span
                className={`text-sm font-medium ${sidebarCollapsed ? "md:hidden" : "block"}`}
              >
                Support
              </span>
            </a>

            {/* Hover Tooltip when collapsed */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/support:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                Support
              </div>
            )}
          </div>

          <div className="relative group/logout">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 py-2 text-white/70 hover:text-white transition-colors text-left cursor-pointer ${
                sidebarCollapsed ? "md:justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5 text-white/50 shrink-0" />
              <span
                className={`text-sm font-medium ${sidebarCollapsed ? "md:hidden" : "block"}`}
              >
                Logout
              </span>
            </button>

            {/* Hover Tooltip when collapsed */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/logout:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50 font-medium hidden md:block">
                Logout
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};