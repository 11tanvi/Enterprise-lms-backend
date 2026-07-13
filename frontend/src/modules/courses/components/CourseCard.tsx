import React from "react";
import { Course } from "../../../types";
import { Clock, Edit, Trash2, MoreVertical } from "lucide-react";
import { useApp } from "../../../context/AppContext";

// 1. Extend the base Course type to include our dynamically injected UI fields
export interface CourseWithUI extends Course {
  categoryColor?: string;
  categoryIcon?: string;
  categoryName?: string;
}

interface CourseCardProps {
  course: CourseWithUI; // 2. Update the prop to use the extended type
  isHovered: boolean;
  isMenuOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}
export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isHovered,
  isMenuOpen,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onMenuToggle,
  onEdit,
  onDelete,
}) => {
  const { userRole, enrolledCourseIds } = useApp();
  const isEnrolled = course.id ? enrolledCourseIds.includes(course.id) : false;

  // Extract the exact level string
  const levelStr =
    (course.difficulty as string) || (course.level as string) || "Beginner";

  // Map each specific level to a distinct color from the Brand Palette
  let levelBadgeColor = "bg-[#01AC9F]"; // Default Emerald
  if (levelStr === "Beginner") {
    levelBadgeColor = "bg-[#01AC9F]"; // Emerald
  } else if (levelStr === "Intermediate") {
    levelBadgeColor = "bg-[#6C1D5F]"; // Tranquil Velvet
  } else if (levelStr === "Advanced") {
    levelBadgeColor = "bg-[#FF6200]"; // CTA Orange
  } else if (levelStr === "Expert") {
    levelBadgeColor = "bg-[#4A1E47]"; // Tranquil Velvet Dark
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        boxShadow: isHovered
          ? `0 20px 40px -12px ${course.categoryColor}80, 0 0 15px -3px ${course.categoryColor}50`
          : "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)",
      }}
      className="bg-white border border-[#DEDEDE] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-[460px] cursor-pointer relative"
    >
      {/* Card Image Header */}
      <div className="h-44 relative overflow-hidden bg-gray-100 shrink-0">
        <img
          src={
            course.thumbnailUrl ||
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60"
          }
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60";
          }}
        />

        {/* Top-Right More Button (Admin Actions Trigger) */}
        {userRole === "admin" && (
          <div className="absolute top-4 right-4 z-35">
            <button
              type="button"
              onClick={onMenuToggle}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-sm focus:outline-none ${
                isMenuOpen
                  ? "bg-[#6C1D5F] text-white border-[#6C1D5F] rotate-90"
                  : "bg-white/95 hover:bg-white text-[#000000] border-[#DEDEDE]/60"
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Enterprise Admin Command Console Overlay on Hover or Menu Trigger */}
      {userRole === "admin" && (
        <div
          className={`absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col justify-between p-6 transition-all duration-300 border border-[#6C1D5F]/35 rounded-2xl cursor-pointer ${
            isHovered || isMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onClick(); // clicking anywhere on overlay goes to details/curriculum page!
          }}
        >
          {/* Header */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#6C1D5F]/30 border border-[#6C1D5F]/50 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-pink-300">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
                Admin Console
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                ID: #{course.id}
              </span>
            </div>
            <h4 className="text-base font-black text-white line-clamp-2 leading-snug">
              {course.title}
            </h4>
            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
              {course.shortDescription ||
                course.description ||
                "No course curriculum syllabus described."}
            </p>
          </div>

          {/* Core Analytics / Info row */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50 my-1">
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Duration
              </p>
              <p className="text-xs font-black text-slate-100 mt-0.5">
                {course.duration || "Self-Paced"}
              </p>
            </div>
            <div className="text-center border-l border-slate-800/60">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Difficulty
              </p>
              <p className="text-xs font-black text-[#01AC9F] mt-0.5">
                {levelStr}
              </p>
            </div>
          </div>

          {/* High-Impact Enterprise Controls */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              className="w-full py-2.5 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(); // view details page
                }}
                className="py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <span>View Curriculum</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
                className="py-2 bg-red-950/20 hover:bg-red-950 border border-red-950 hover:border-red-800 text-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
        <div className="space-y-3">
          {/* Category Pill */}
          <div className="flex">
            <span
              style={{
                backgroundColor: `${course.categoryColor}26`,
                color: course.categoryColor,
                border: `1px solid ${course.categoryColor}40`,
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
            >
              <span className="text-xs leading-none">
                {course.categoryIcon}
              </span>
              <span>{course.categoryName}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-[#000000] line-clamp-2 hover:text-[#6C1D5F] transition-colors leading-snug">
            {course.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#5A5A5A] line-clamp-3 leading-relaxed">
            {course.shortDescription ||
              course.description ||
              "No course curriculum syllabus described."}
          </p>

          {/* Level Badge */}
          <div className="flex pt-1">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-md text-white shadow-sm ${levelBadgeColor}`}
            >
              {course.difficulty || course.level || "Beginner"}
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-4 mt-4 border-t border-[#DEDEDE] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#5A5A5A] font-semibold">
            <Clock className="w-4 h-4 text-[#01AC9F]" />
            <span>{course.duration || "Self-Paced"}</span>
          </div>

          {userRole === "student" ? (
            isEnrolled ? (
              <div className="flex items-center gap-1 text-xs text-emerald-700 font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Enrolled</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-amber-700 font-extrabold uppercase tracking-wider bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Unenrolled</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1 text-xs text-[#5A5A5A] font-bold bg-[#F7F8FC] border border-[#DEDEDE]/60 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#01AC9F]"></span>
              <span>0% Enrolled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
