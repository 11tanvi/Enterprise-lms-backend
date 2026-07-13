import React from "react";
import { Award, TrendingUp, ShieldAlert, CheckCircle, ChevronRight, Share2 } from "lucide-react";

interface ResultCardProps {
  score: number;
  totalMarks: number;
  rank?: number;
  totalParticipants?: number;
  status?: string;
  passingPercentage?: number; // default: 50%
  onActionClick?: () => void;
  actionText?: string;
  assignmentTitle?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  score,
  totalMarks,
  rank,
  totalParticipants,
  status,
  passingPercentage = 50,
  onActionClick,
  actionText = "Review Answer Sheet",
  assignmentTitle,
}) => {
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const isPassed = percentage >= passingPercentage;

  // Determine dynamic accent colors using brand palette
  const statusConfig = isPassed
    ? {
        color: "text-[#01AC9F]",
        bgColor: "bg-[#01AC9F]/10",
        borderColor: "border-[#01AC9F]/20",
        icon: CheckCircle,
        badgeText: status || "Passed",
      }
    : {
        color: "text-[#FF6200]",
        bgColor: "bg-[#FF6200]/10",
        borderColor: "border-[#FF6200]/20",
        icon: ShieldAlert,
        badgeText: status || "Failed",
      };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      id="result-card-container"
      className="bg-white rounded-3xl border border-gray-100/80 p-8 shadow-sm max-w-lg mx-auto space-y-6 text-center animate-fade-in"
    >
      {/* Visual Status Indicator Ring */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Radial Track */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="#F3F4F6"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke={isPassed ? "#01AC9F" : "#FF6200"}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={Math.PI * 2 * 48}
              strokeDashoffset={Math.PI * 2 * 48 * (1 - percentage / 100)}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Inside Score Info */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-black text-black">{percentage}%</span>
            <span className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider">
              Percentage
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}
        >
          <StatusIcon className="w-4 h-4" />
          {statusConfig.badgeText}
        </div>
      </div>

      {/* Assignment Meta Text */}
      <div className="space-y-1">
        {assignmentTitle && (
          <p className="text-[10px] font-mono text-gray-400 font-extrabold uppercase tracking-widest">
            Assignment Complete
          </p>
        )}
        <h3 className="text-xl font-display font-bold text-black px-4 leading-tight">
          {assignmentTitle || "Performance Summary"}
        </h3>
      </div>

      {/* Stats Bento Grid using rounded-2xl & custom background */}
      <div className="grid grid-cols-2 gap-4 bg-[#F7F8FC] p-4 rounded-2xl border border-gray-100/50">
        {/* Marks Obtained */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
          <div className="p-1.5 bg-[#FF6200]/10 rounded-lg mb-1.5">
            <Award className="w-4 h-4 text-[#FF6200]" />
          </div>
          <span className="text-lg font-mono font-black text-black">
            {score} <span className="text-xs font-sans text-gray-400 font-medium">/ {totalMarks}</span>
          </span>
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase mt-0.5">
            Marks Secured
          </span>
        </div>

        {/* Batch Rank (if available) */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
          <div className="p-1.5 bg-[#6C1D5F]/10 rounded-lg mb-1.5">
            <TrendingUp className="w-4 h-4 text-[#6C1D5F]" />
          </div>
          <span className="text-lg font-mono font-black text-[#6C1D5F]">
            {rank ? (
              <>
                #{rank}{" "}
                {totalParticipants && (
                  <span className="text-xs font-sans text-gray-400 font-medium">of {totalParticipants}</span>
                )}
              </>
            ) : (
              "N/A"
            )}
          </span>
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase mt-0.5">
            Leaderboard Rank
          </span>
        </div>
      </div>

      {/* Actions conforming to rounded-md (8px) for buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-sm font-semibold rounded-md transition-all shadow-md cursor-pointer active:scale-95"
          >
            {actionText}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => alert("Share result link copied to clipboard!")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-[#5A5A5A] border border-gray-200 text-sm font-semibold rounded-md transition-all cursor-pointer shadow-2xs"
        >
          <Share2 className="w-4 h-4 text-[#5A5A5A]" />
          Share Results
        </button>
      </div>
    </div>
  );
};
