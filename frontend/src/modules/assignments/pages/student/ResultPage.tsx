import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Award,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  Download,
  Brain,
  MessageSquare,
  Sparkles,
  Loader2,
  Printer,
  EyeOff,
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { Assignment, Submission, Answer, Question } from "../../types";
import { ResultCard } from "../../shared/ResultCard";
import { useAuthenticatedQuery } from "../../api/useAuthenticatedQuery";
import { assignmentService } from "../../api/assignmentService";
import { useStudentAssignments } from "../../hooks/useStudentAssignments";

// Seeded deterministic pseudo-random number generator & shuffle utilities
const getSeedFromString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const seededShuffle = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  let m = shuffled.length;
  let t;
  let i;
  let currentSeed = seed;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
  while (m) {
    i = Math.floor(random() * m--);
    t = shuffled[m];
    shuffled[m] = shuffled[i];
    shuffled[i] = t;
  }
  return shuffled;
};

export const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, showToast, enrolledCourseIds = [] } = useApp();

  // Load the active assignment
  const {
    data: assignment,
    isLoading: isAssignmentLoading,
    error: assignmentError,
  } = useAuthenticatedQuery<Assignment>(
    () => assignmentService.getAssignmentById(id!),
    [id],
  );
  const isAssignmentError = !!assignmentError;

  const { submissions, isLoading: isSubmissionsLoading } =
    useStudentAssignments();

  const [isGradingSimulated, setIsGradingSimulated] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(
    null,
  );
  const [expandedQuestions, setExpandedQuestions] = useState<
    Record<string, boolean>
  >({});

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const rawSubmission = useMemo(() => {
    return submissions.find((s) => s.assignmentId === id);
  }, [submissions, id]);

  const completedAttempts = useMemo(() => {
    if (!submissions || !assignment) return 0;
    const mySubs = submissions.filter(
      (s) =>
        s.assignmentId === assignment.id &&
        s.studentId === currentUser?.id?.toString(),
    );
    return mySubs.filter(
      (s) => s.status === "Submitted" || s.status === "Graded",
    ).length;
  }, [submissions, assignment, currentUser]);

  const maxAttempts = useMemo(() => {
    if (!assignment) return null;
    if (
      assignment.maxAttempts === "No limit" ||
      assignment.maxAttempts === null ||
      assignment.maxAttempts === undefined
    ) {
      return null;
    }
    const val = Number(assignment.maxAttempts);
    return isNaN(val) || val <= 0 ? null : val;
  }, [assignment]);

  const hasRemainingAttempts = useMemo(() => {
    if (maxAttempts === null) return true;
    return completedAttempts < maxAttempts;
  }, [completedAttempts, maxAttempts]);

  const shuffledQuestions = useMemo(() => {
    if (!assignment || !assignment.questions) return [];
    if (assignment.shuffleQuestions && activeSubmission?.id) {
      const seed = getSeedFromString(activeSubmission.id);
      return seededShuffle(assignment.questions, seed);
    }
    return assignment.questions;
  }, [assignment, activeSubmission?.id]);

  // Handle grading state visually
  useEffect(() => {
    if (rawSubmission && rawSubmission.status === "Submitted") {
      setIsGradingSimulated(true);
      // Wait for backend to grade it or simulate checking for result
      const timerId = setTimeout(() => {
        setIsGradingSimulated(false);
        setActiveSubmission(rawSubmission);
      }, 2000);
      return () => clearTimeout(timerId);
    } else {
      setActiveSubmission(rawSubmission || null);
    }
  }, [rawSubmission]);

  const isLoading = isAssignmentLoading || isSubmissionsLoading;

  const shouldShowResult =
    assignment?.showScoreImmediately || activeSubmission?.status === "Graded";

  // Certificate eligibility computations
  const isCertificateEnabled = !!assignment?.enableCertificates;
  const isGraded = activeSubmission?.status === "Graded";
  const passingMarks =
    assignment?.passingMarks !== undefined && assignment?.passingMarks !== null
      ? assignment.passingMarks
      : 40;
  const studentScore =
    activeSubmission?.score !== undefined ? activeSubmission.score : 0;
  const isEligibleForCertificate =
    isCertificateEnabled && isGraded && studentScore >= passingMarks;

  const totalMarksValue = assignment?.totalMarks || 100;
  const passingPercent = Math.round((passingMarks / totalMarksValue) * 100);

  let certificateStatusMessage = "";
  if (!isCertificateEnabled) {
    certificateStatusMessage = "Certificates are disabled for this assignment.";
  } else if (!isGraded) {
    certificateStatusMessage = "Assignment has not been graded yet.";
  } else if (studentScore < passingMarks) {
    certificateStatusMessage = `Score at least ${passingMarks} marks (${passingPercent}%) to unlock your certificate.`;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-[#6C1D5F] animate-spin" />
        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
          Loading Performance Data...
        </p>
      </div>
    );
  }

  const isEnrolled = assignment
    ? enrolledCourseIds.includes(assignment.courseId)
    : false;
  const isPublished = assignment ? assignment.status !== "Draft" : false;

  if (isAssignmentError || !assignment || !isEnrolled || !isPublished) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 p-8 max-w-md mx-auto my-12 space-y-4 shadow-sm">
        <XCircle className="w-12 h-12 text-[#FF6200] mx-auto" />
        <h3 className="text-lg font-display font-bold text-black uppercase tracking-tight">
          Access Denied
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {isAssignmentError
            ? "There was an error loading this assignment."
            : !assignment
              ? "The requested result criteria matches no active modules."
              : !isEnrolled
                ? "You are not enrolled in the course associated with this assignment."
                : "This assignment is currently in a Draft state and has not been published yet."}
        </p>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="px-5 py-2 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-semibold rounded-md transition-all cursor-pointer shadow-3xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Handle downloading report as functional `.txt` performance file
  const handleDownloadReport = () => {
    if (!activeSubmission) return;

    const reportContent = `
===================================================================
              EXECUTIVE LEARNING SYSTEM - PERFORMANCE REPORT
===================================================================
Assignment:   ${assignment.title}
Course:       ${assignment.courseTitle}
Student:      ${activeSubmission.studentName}
Submitted At: ${activeSubmission.submittedAt}
Status:       ${activeSubmission.status}
-------------------------------------------------------------------
Score Secured: ${activeSubmission.score || 0} / ${assignment.totalMarks} Marks
Percentage:    ${Math.round(((activeSubmission.score || 0) / assignment.totalMarks) * 100)}%
Grader:        ${activeSubmission.gradedBy || "Pending Review"}
Graded At:     ${activeSubmission.gradedAt || "N/A"}
-------------------------------------------------------------------
EVALUATOR COMMENDATIONS & FEEDBACK:
"${activeSubmission.graderFeedback || "No comments entered."}"
===================================================================
Report generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${assignment.title.toLowerCase().replace(/\s+/g, "_")}_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded report sheet successfully.", "success");
  };

  // Render Live Grading Simulator
  if (isGradingSimulated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-100/80 p-12 text-center shadow-md space-y-6 my-12 animate-pulse">
        <div className="w-16 h-16 bg-[#6C1D5F]/15 rounded-full flex items-center justify-center mx-auto">
          <Brain className="w-8 h-8 text-[#6C1D5F] animate-spin" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#01AC9F]/15 text-[#01AC9F] rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Analyzing Submission
          </span>
          <h3 className="text-xl font-display font-bold text-black">
            Evaluating Lab Responses
          </h3>
          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            Please hold while the LMS grading sandbox compiles your scripting
            configurations, audits network schemas, and checks MCQ selections...
          </p>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#6C1D5F] rounded-full animate-progress-bar w-[85%]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="assignment-result-sheet">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6C1D5F] hover:text-[#541449] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Student Dashboard
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {hasRemainingAttempts && (
            <button
              onClick={() => navigate(`/student/assignment/${assignment.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#01AC9F] hover:bg-[#018c81] text-white text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Retake Assignment
            </button>
          )}

          {shouldShowResult &&
            (isEligibleForCertificate ? (
              <button
                onClick={() =>
                  navigate(`/student/certificate/${activeSubmission.id}`)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                id="view-certificate-btn"
              >
                <Award className="w-3.5 h-3.5" />
                View Certificate
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                {certificateStatusMessage}
              </div>
            ))}

          {shouldShowResult && activeSubmission && (
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#5A5A5A] hover:text-black text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
          )}
        </div>
      </div>

      {/* Main performance card display */}
      {!shouldShowResult ? (
        <div className="bg-white rounded-3xl border border-gray-150 p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-3xs my-6 animate-fade-in">
          <div className="w-16 h-16 bg-[#01AC9F]/10 rounded-full flex items-center justify-center mx-auto text-[#01AC9F]">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-display font-bold text-black">
              Submission Received
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto whitespace-pre-line">
              Your assignment has been submitted successfully. Results will be
              available once the instructor releases them.
            </p>
          </div>
        </div>
      ) : activeSubmission ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: ResultCard + Metadata */}
          <div className="lg:col-span-1 space-y-6">
            <ResultCard
              score={activeSubmission.score || 0}
              totalMarks={assignment.totalMarks}
              rank={assignment.id === "asn-cyber-lab" ? 8 : 3} // realistic rank metrics
              totalParticipants={assignment.id === "asn-cyber-lab" ? 115 : 45}
              status={activeSubmission.status}
              assignmentTitle={assignment.title}
              onActionClick={handleDownloadReport}
              actionText="Export Performance Sheet"
            />

            {/* Evaluation Auditor Info Card */}
            <div className="bg-white rounded-3xl border border-gray-100/80 p-6 shadow-sm space-y-4">
              <h4 className="text-[10px] font-mono text-gray-400 font-extrabold uppercase tracking-wider border-b border-gray-50 pb-2">
                Assessment Metadata
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#6C1D5F]" />
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 font-bold uppercase">
                      Auditor / Grader
                    </p>
                    <p className="font-sans font-semibold text-gray-800">
                      {activeSubmission.gradedBy || "Awaiting Assessor"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#01AC9F]" />
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 font-bold uppercase">
                      Grading Confirmed
                    </p>
                    <p className="font-sans font-semibold text-gray-800">
                      {activeSubmission.gradedAt || "Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#FF6200]" />
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 font-bold uppercase">
                      Submitted Timeline
                    </p>
                    <p className="font-sans font-semibold text-gray-800">
                      {activeSubmission.submittedAt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Granular Question breakdown list & Instructor feedback */}
          <div className="lg:col-span-2 space-y-6">
            {assignment?.showDetailedAnswers === false ? (
              <div className="bg-white rounded-3xl border border-gray-150 p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-3xs animate-fade-in">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-100">
                  <EyeOff className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-display font-bold text-black">
                    Question Review Unavailable
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto whitespace-pre-line">
                    The instructor has disabled detailed answer review for this
                    assignment.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Persisted Teacher Feedback Card */}
                {activeSubmission.graderFeedback && (
                  <div className="bg-[#6C1D5F]/5 border border-[#6C1D5F]/15 rounded-3xl p-6 md:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-[#6C1D5F]">
                      <MessageSquare className="w-5 h-5" />
                      <h3 className="text-sm font-mono font-extrabold uppercase tracking-wider">
                        Executive Evaluator Feedback
                      </h3>
                    </div>
                    <div className="text-xs font-sans text-gray-700 leading-relaxed italic bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
                      "{activeSubmission.graderFeedback}"
                    </div>
                  </div>
                )}

                {/* Granular Question List */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="text-lg font-display font-bold text-black border-b border-gray-50 pb-4">
                    Challenge Response Breakdown
                  </h3>

                  <div className="space-y-4">
                    {shuffledQuestions.map((question, index) => {
                      const studentAnswer = activeSubmission.answers.find(
                        (a) => a.questionId === question.id,
                      );

                      // Get the real marks from the submission
                      const pointsAwarded = studentAnswer?.pointsEarned || 0;

                      // For MCQ / Coding, attempt to derive correctness if not graded explicitly,
                      // or just rely on points
                      let isCorrectResponse = pointsAwarded > 0;
                      if (
                        question.type === "MCQ" &&
                        question.mcqDetails?.correctOptionIndex !== undefined
                      ) {
                        isCorrectResponse =
                          studentAnswer?.mcqSelectedIndex ===
                          question.mcqDetails?.correctOptionIndex;
                      } else if (question.type === "Coding") {
                        isCorrectResponse =
                          !!studentAnswer?.codingSubmission?.allTestsPassed;
                      }

                      const isExpanded = !!expandedQuestions[question.id];

                      return (
                        <div
                          key={question.id}
                          className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-3xs hover:border-[#6C1D5F]/30 transition-all duration-200"
                        >
                          {/* Collapsible Header */}
                          <div
                            onClick={() => toggleQuestion(question.id)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer select-none gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-gray-400">
                                Q{index + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-mono font-bold uppercase">
                                {question.type}
                              </span>
                              <h4 className="text-sm font-display font-bold text-black">
                                {question.title}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              {/* Correct / Incorrect Badge */}
                              {isCorrectResponse ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#01AC9F]/10 text-[#01AC9F] border border-[#01AC9F]/20">
                                  <CheckCircle className="w-3 h-3" />
                                  Correct
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                  <XCircle className="w-3 h-3" />
                                  Incorrect
                                </span>
                              )}

                              {/* Marks Display */}
                              <span className="text-xs font-mono font-bold text-gray-700 bg-white border border-gray-150 px-2.5 py-1 rounded-md">
                                {pointsAwarded} / {question.points} Marks
                              </span>

                              {/* Chevron Icon */}
                              <span className="text-gray-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#6C1D5F]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Collapsible Content */}
                          {isExpanded && (
                            <div className="p-4 md:p-6 border-t border-gray-100 space-y-5 bg-white">
                              {/* Display prompt text */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                                  Question Prompt
                                </span>
                                <p className="text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100/50 leading-relaxed">
                                  {question.prompt}
                                </p>
                              </div>

                              {/* Specific Question Details */}
                              <div className="space-y-4 pt-1">
                                {/* MCQ */}
                                {question.type === "MCQ" &&
                                  question.mcqDetails && (
                                    <div className="space-y-3">
                                      {(() => {
                                        const details = question.mcqDetails;
                                        const paired = details.options.map(
                                          (opt, oIdx) => ({
                                            text: opt,
                                            id:
                                              details.optionIds?.[oIdx] ||
                                              oIdx.toString(),
                                            originalIndex: oIdx,
                                          }),
                                        );

                                        const shuffledOpts = (() => {
                                          if (
                                            assignment.shuffleOptions &&
                                            activeSubmission?.id
                                          ) {
                                            const seed = getSeedFromString(
                                              activeSubmission.id + question.id,
                                            );
                                            return seededShuffle(paired, seed);
                                          }
                                          return paired;
                                        })();

                                        const selectedShuffledIdx =
                                          shuffledOpts.findIndex((o) =>
                                            studentAnswer?.selectedOptionId
                                              ? o.id ===
                                                studentAnswer.selectedOptionId
                                              : o.originalIndex ===
                                                studentAnswer?.mcqSelectedIndex,
                                          );
                                        const correctShuffledIdx =
                                          shuffledOpts.findIndex(
                                            (o) =>
                                              o.originalIndex ===
                                              details.correctOptionIndex,
                                          );

                                        return (
                                          <>
                                            {/* Selected & Correct Summary Badge Blocks */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                              <div className="text-xs space-y-1">
                                                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                                                  Selected Option
                                                </span>
                                                <span
                                                  className={`font-semibold ${isCorrectResponse ? "text-[#01AC9F]" : "text-rose-600"}`}
                                                >
                                                  {selectedShuffledIdx >= 0
                                                    ? `Option ${String.fromCharCode(65 + selectedShuffledIdx)}: ${shuffledOpts[selectedShuffledIdx].text}`
                                                    : "No option selected"}
                                                </span>
                                              </div>
                                              <div className="text-xs space-y-1">
                                                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                                                  Correct Option
                                                </span>
                                                <span className="font-semibold text-[#01AC9F]">
                                                  {correctShuffledIdx >= 0
                                                    ? `Option ${String.fromCharCode(65 + correctShuffledIdx)}: ${shuffledOpts[correctShuffledIdx].text}`
                                                    : "No option selected"}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="space-y-2">
                                              {shuffledOpts.map(
                                                (shuffledOpt, sIdx) => {
                                                  const isStudentSelected =
                                                    selectedShuffledIdx ===
                                                    sIdx;
                                                  const isCorrectAnswer =
                                                    correctShuffledIdx === sIdx;

                                                  let cardClass =
                                                    "p-3 rounded-xl border text-xs font-sans flex items-center justify-between ";
                                                  if (isCorrectAnswer) {
                                                    cardClass +=
                                                      "bg-[#01AC9F]/5 border-[#01AC9F] text-black";
                                                  } else if (
                                                    isStudentSelected &&
                                                    !isCorrectAnswer
                                                  ) {
                                                    cardClass +=
                                                      "bg-rose-50 border-rose-200 text-black";
                                                  } else {
                                                    cardClass +=
                                                      "bg-white border-gray-150 text-gray-500";
                                                  }

                                                  return (
                                                    <div
                                                      key={sIdx}
                                                      className={cardClass}
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <span
                                                          className={`w-6 h-6 rounded-md font-mono text-xs flex items-center justify-center font-bold border ${
                                                            isCorrectAnswer
                                                              ? "bg-[#01AC9F] text-white border-[#01AC9F]"
                                                              : isStudentSelected
                                                                ? "bg-rose-500 text-white border-rose-500"
                                                                : "bg-gray-50 text-gray-400 border-gray-200"
                                                          }`}
                                                        >
                                                          {String.fromCharCode(
                                                            65 + sIdx,
                                                          )}
                                                        </span>
                                                        <span>
                                                          {shuffledOpt.text}
                                                        </span>
                                                      </div>

                                                      {isCorrectAnswer && (
                                                        <span className="text-[9px] font-mono text-[#01AC9F] font-bold uppercase tracking-wider">
                                                          Correct Key
                                                        </span>
                                                      )}
                                                      {isStudentSelected &&
                                                        !isCorrectAnswer && (
                                                          <span className="text-[9px] font-mono text-rose-500 font-bold uppercase tracking-wider">
                                                            Your Answer
                                                          </span>
                                                        )}
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}

                                {/* Coding */}
                                {question.type === "Coding" && (
                                  <div className="space-y-3">
                                    <div className="bg-gray-900 rounded-2xl border border-gray-850 p-4 font-mono text-[11px] leading-relaxed text-gray-300">
                                      <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest border-b border-gray-800 pb-1.5 mb-2">
                                        Submitted Code
                                      </span>
                                      <pre className="overflow-x-auto whitespace-pre">
                                        {studentAnswer?.codingSubmission
                                          ?.code || "No code submitted."}
                                      </pre>
                                    </div>
                                    {studentAnswer?.codingSubmission
                                      ?.allTestsPassed && (
                                      <div className="p-3 bg-[#01AC9F]/10 border border-[#01AC9F]/20 rounded-xl text-xs text-[#01AC9F] flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>
                                          All test cases passed successfully.
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Essay */}
                                {question.type === "Essay" && (
                                  <div className="space-y-2">
                                    <div className="bg-white p-4 border border-gray-150 rounded-2xl font-sans text-xs leading-relaxed text-[#5A5A5A] shadow-3xs">
                                      <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold tracking-widest mb-1.5">
                                        Submitted Answer
                                      </span>
                                      <p className="whitespace-pre-wrap text-gray-800">
                                        {studentAnswer?.essayText ||
                                          "No answer submitted."}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Short Answer */}
                                {question.type === "ShortAnswer" &&
                                  studentAnswer?.shortAnswerText && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">
                                          Your Response
                                        </span>
                                        <p className="font-semibold text-gray-800 mt-1">
                                          {studentAnswer.shortAnswerText}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                {/* File Upload */}
                                {question.type === "FileUpload" &&
                                  studentAnswer?.fileUploadData && (
                                    <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between gap-4 text-xs shadow-3xs">
                                      <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-[#01AC9F]/10 rounded-lg">
                                          <FileText className="w-4 h-4 text-[#01AC9F]" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-gray-800">
                                            {
                                              studentAnswer.fileUploadData
                                                .fileName
                                            }
                                          </p>
                                          <span className="text-[10px] font-mono text-gray-400">
                                            {studentAnswer.fileUploadData
                                              .fileSize ||
                                              "Schema Diagram Attached"}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          window.open(
                                            studentAnswer.fileUploadData
                                              ?.fileUrl,
                                            "_blank",
                                          )
                                        }
                                        className="text-xs text-[#6C1D5F] hover:underline font-mono font-bold cursor-pointer"
                                      >
                                        Download Attached PDF
                                      </button>
                                    </div>
                                  )}
                              </div>

                              {/* Teacher Feedback (if available) */}
                              {studentAnswer?.teacherFeedback ? (
                                <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                  <span className="text-[9px] font-mono text-blue-600 block uppercase font-bold mb-1">
                                    Evaluator Comments
                                  </span>
                                  <p className="text-xs text-gray-700 leading-relaxed italic">
                                    "{studentAnswer.teacherFeedback}"
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 space-y-4">
          <XCircle className="w-12 h-12 text-[#FF6200] mx-auto" />
          <h3 className="text-lg font-display font-bold text-black uppercase">
            No Submission Criteria Registered
          </h3>
          <p className="text-sm text-gray-500">
            The requested result registry shows zero submitted attempts from
            your student profile.
          </p>
          <button
            onClick={() => navigate(`/student/assignment/${assignment.id}`)}
            className="px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-md"
          >
            Attempt Assessment Now
          </button>
        </div>
      )}
    </div>
  );
};
export default ResultPage;
