import React from "react";
import {
  Clock,
  Calendar,
  Award,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Assignment } from "../types";

interface AssignmentCardProps {
  assignment: Assignment;
  onAction?: (assignment: Assignment) => void;
  actionText?: string;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onAction,
  actionText = "View Assignment",
}) => {
  const { title, courseTitle, dueDate, durationMinutes, totalMarks, status } =
    assignment;

  // Determine status styles for badges using brand colors
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-[#01AC9F]/10 text-[#01AC9F] border-[#01AC9F]/20";
      case "Submitted":
        return "bg-[#6C1D5F]/10 text-[#6C1D5F] border-[#6C1D5F]/20";
      case "Graded":
        return "bg-[#01AC9F]/15 text-[#01AC9F] border-[#01AC9F]/30";
      case "Closed":
        return "bg-gray-100 text-gray-500 border-gray-200";
      case "Late":
      case "Overdue":
        return "bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20";
      case "Draft":
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const formattedDuration =
    durationMinutes > 0 ? `${durationMinutes} mins` : "No limit";

  return (
    <div
      id={`assignment-card-${assignment.id}`}
      className="bg-white rounded-3xl border border-gray-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
    >
      <div className="p-6 space-y-4">
        {/* Course Name & Status Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="px-2.5 py-1 bg-[#F7F8FC] text-[#5A5A5A] rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
            {courseTitle}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${getStatusStyles(
              status,
            )}`}
          >
            {status === "Submitted" && <CheckCircle className="w-3.5 h-3.5" />}
            {status}
          </span>
        </div>

        {/* Title using font-display */}
        <h3 className="text-lg font-display font-bold text-black group-hover:text-[#6C1D5F] transition-colors leading-snug">
          {title}
        </h3>

        {/* Grid Meta Info using font-mono for labels/values */}
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          {/* Due Date */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="p-2 bg-[#F7F8FC] rounded-lg">
              <Calendar className="w-4 h-4 text-[#5A5A5A]" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                Due Date
              </p>
              <p className="font-mono font-semibold text-[#5A5A5A]">
                {dueDate}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="p-2 bg-[#F7F8FC] rounded-lg">
              <Clock className="w-4 h-4 text-[#5A5A5A]" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                Duration
              </p>
              <p className="font-mono font-semibold text-[#5A5A5A]">
                {formattedDuration}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar with marks & call to action */}
      <div className="px-6 py-4.5 bg-[#F7F8FC]/50 border-t border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Award className="w-4 h-4 text-[#FF6200]" />
          <span className="font-bold text-[#5A5A5A]">
            {totalMarks}{" "}
            <span className="text-gray-400 font-medium">Marks</span>
          </span>
        </div>

        {onAction && (
          <button
            onClick={() => {
              if (actionText !== "Closed") {
                onAction(assignment);
              }
            }}
            disabled={actionText === "Closed"}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all shadow-sm ${
              actionText === "Closed"
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-[#6C1D5F] hover:bg-[#541449] text-white active:scale-95 cursor-pointer"
            }`}
          >
            {actionText}
            {actionText !== "Closed" && (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
