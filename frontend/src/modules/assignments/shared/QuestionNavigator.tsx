import React from "react";
import { Flag, Check, HelpCircle } from "lucide-react";
import { Question, Answer } from "../types";

interface QuestionNavigatorProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  answers?: Answer[];
  flaggedQuestionIds?: string[];
  onToggleFlag?: (questionId: string) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  answers = [],
  flaggedQuestionIds = [],
  onToggleFlag,
}) => {
  // Check if a question has been answered
  const isAnswered = (questionId: string) => {
    const answer = answers.find((ans) => ans.questionId === questionId);
    if (!answer) return false;

    // Based on question type, confirm answer content exists
    switch (answer.questionType) {
      case "MCQ":
        return answer.mcqSelectedIndex !== undefined && answer.mcqSelectedIndex >= 0;
      case "Coding":
        return !!answer.codingSubmission?.code;
      case "Essay":
        return !!answer.essayText && answer.essayText.trim().length > 0;
      case "ShortAnswer":
        return !!answer.shortAnswerText && answer.shortAnswerText.trim().length > 0;
      case "FileUpload":
        return !!answer.fileUploadData?.fileUrl;
      default:
        return false;
    }
  };

  return (
    <div
      id="question-navigator-container"
      className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <div>
          <h4 className="text-sm font-display font-bold text-black uppercase tracking-wide">
            Questions Panel
          </h4>
          <p className="text-xs font-mono text-gray-400 mt-0.5">
            {answers.filter((ans) => isAnswered(ans.questionId)).length} of {questions.length} completed
          </p>
        </div>
      </div>

      {/* Progress Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {questions.map((question, index) => {
          const isActive = index === currentQuestionIndex;
          const answered = isAnswered(question.id);
          const flagged = flaggedQuestionIds.includes(question.id);

          // Build button classes dynamically conforming to rounded-lg (8px) for buttons
          let btnClass = "relative h-11 rounded-lg font-mono font-bold text-sm transition-all flex items-center justify-center cursor-pointer ";
          if (isActive) {
            btnClass += "bg-[#6C1D5F] text-white shadow-md shadow-[#6C1D5F]/15 ring-2 ring-offset-2 ring-[#6C1D5F]";
          } else if (flagged) {
            btnClass += "bg-[#FF6200] text-white shadow-sm shadow-[#FF6200]/10";
          } else if (answered) {
            btnClass += "bg-[#01AC9F]/10 text-[#01AC9F] border border-[#01AC9F]/20 hover:bg-[#01AC9F]/20";
          } else {
            btnClass += "bg-[#F7F8FC] hover:bg-gray-100 text-[#5A5A5A] border border-gray-100/80";
          }

          return (
            <button
              key={question.id}
              onClick={() => onQuestionSelect(index)}
              className={btnClass}
              title={`Question ${index + 1} (${question.type})`}
            >
              {index + 1}

              {/* Status Indicator Badges inside the cell */}
              {!isActive && answered && !flagged && (
                <span className="absolute -top-1 -right-1 bg-[#01AC9F] text-white rounded-full p-0.5">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
              {flagged && (
                <span className="absolute -top-1 -right-1 bg-[#FF6200] text-white rounded-full p-0.5">
                  <Flag className="w-2.5 h-2.5 fill-current" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Flag / Review Interaction Section */}
      {onToggleFlag && questions[currentQuestionIndex] && (
        <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
          <span className="text-xs text-[#5A5A5A] font-medium">Flag current question for review?</span>
          <button
            onClick={() => onToggleFlag(questions[currentQuestionIndex].id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              flaggedQuestionIds.includes(questions[currentQuestionIndex].id)
                ? "bg-[#FF6200] text-white"
                : "bg-[#F7F8FC] hover:bg-gray-100 text-[#5A5A5A] border border-gray-100/80"
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${flaggedQuestionIds.includes(questions[currentQuestionIndex].id) ? "fill-current" : ""}`} />
            {flaggedQuestionIds.includes(questions[currentQuestionIndex].id) ? "Flagged" : "Flag Task"}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#6C1D5F]" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#01AC9F]/10 border border-[#01AC9F]/20" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FF6200]" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#F7F8FC] border border-gray-100/80" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};
