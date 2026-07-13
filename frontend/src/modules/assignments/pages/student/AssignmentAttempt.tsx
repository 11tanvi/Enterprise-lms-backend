import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  FileUp,
  Terminal,
  Paperclip,
  Trash2,
  FileText,
  Play,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { Assignment, Answer, Question, Submission } from "../../types";
import { Timer } from "../../shared/Timer";
import { QuestionNavigator } from "../../shared/QuestionNavigator";
import { useAuthenticatedQuery } from "../../api/useAuthenticatedQuery";
import { useMutation } from "@tanstack/react-query";
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

export const AssignmentAttempt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    showToast,
    enrolledCourseIds = [],
    isEnrollmentsLoading,
  } = useApp();

  // Load the selected assignment via API
  const {
    data: assignment,
    isLoading: isAssignmentLoading,
    error: assignmentError,
  } = useAuthenticatedQuery<Assignment>(
    () => assignmentService.getAssignmentById(id!),
    [id],
  );
  const isAssignmentError = !!assignmentError;

  const {
    submissions,
    isLoading: isSubmissionsLoading,
    refreshAssignments,
  } = useStudentAssignments();

  const studentIdStr = currentUser?.id?.toString();

  const mySubmissions = useMemo(() => {
    if (!submissions || !assignment) return [];
    return submissions.filter(
      (s) => s.assignmentId === assignment.id && s.studentId === studentIdStr,
    );
  }, [submissions, assignment, studentIdStr]);

  const completedAttempts = useMemo(() => {
    return mySubmissions.filter(
      (s) => s.status === "Submitted" || s.status === "Graded",
    ).length;
  }, [mySubmissions]);

  const activeDraft = useMemo(() => {
    return mySubmissions.find((s) => s.status === "Pending");
  }, [mySubmissions]);

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

  const attemptsExhausted = useMemo(() => {
    if (maxAttempts === null) return false;
    return completedAttempts >= maxAttempts && !activeDraft;
  }, [maxAttempts, completedAttempts, activeDraft]);

  const latestCompletedSubmission = useMemo(() => {
    return mySubmissions.find(
      (s) => s.status === "Submitted" || s.status === "Graded",
    );
  }, [mySubmissions]);

  // States
  const [isPastDueDateState, setIsPastDueDateState] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(
    null,
  );
  const [startedAtTime, setStartedAtTime] = useState<string | null>(null);
  const [isTimerExpiredState, setIsTimerExpiredState] = useState(false);
  const [viewState, setViewState] = useState<"pre-start" | "active">(
    "pre-start",
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated code compiler states for the Coding question type
  const [compiling, setCompiling] = useState<Record<string, boolean>>({});
  const [compilerLogs, setCompilerLogs] = useState<Record<string, string>>({});

  // Simulated file upload states
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { fileName: string; fileUrl: string; fileSize: string }>
  >({});

  // Debounce ref for autosave
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Guard ref to ensure restoration runs exactly once per assignment
  const restoredAssignmentIdRef = useRef<string | null>(null);

  // Guard ref to prevent duplicate auto-submissions or duplicate auto-saves on timeout
  const autoTimeoutProcessedRef = useRef(false);

  const saveDraftMutation = useMutation({
    mutationFn: (sub: Submission) => assignmentService.saveDraft(sub),
    onError: (err: any) => {
      showToast("Autosave failed. Connection issue?", "error");
    },
  });

  // Confirm if already submitted / resume draft
  useEffect(() => {
    if (assignment && submissions) {
      if (restoredAssignmentIdRef.current === assignment.id) {
        return;
      }

      if (activeDraft) {
        const sub = activeDraft;
        restoredAssignmentIdRef.current = assignment.id;
        // Resume existing submission
        setActiveSubmissionId(sub.id);
        if (sub.startedAt) {
          setStartedAtTime(sub.startedAt);
        }

        // Restore answers from backend
        const restoredAnswers = assignment.questions.map((q) => {
          const backendAns = sub.answers?.find((a) => a.questionId === q.id);
          const baseAnswer: Answer = {
            questionId: q.id,
            questionType: q.type,
          };

          if (backendAns) {
            if (q.type === "MCQ" || false) {
              if (backendAns.selectedOptionId && q.mcqDetails?.optionIds) {
                const idx = q.mcqDetails.optionIds.indexOf(
                  backendAns.selectedOptionId,
                );
                if (idx >= 0) {
                  baseAnswer.mcqSelectedIndex = idx;
                }
              }
            } else if (q.type === "Essay") {
              baseAnswer.essayText = backendAns.essayText || "";
            } else if (q.type === "ShortAnswer") {
              baseAnswer.shortAnswerText = backendAns.shortAnswerText || "";
            } else if (q.type === "Coding") {
              baseAnswer.codingSubmission = backendAns.codingSubmission || {
                code: q.codingDetails?.starterCode || "",
                language: q.codingDetails?.language || "python",
                allTestsPassed: false,
              };
            } else if (q.type === "FileUpload") {
              baseAnswer.fileUploadData = backendAns.fileUploadData;
            }
            baseAnswer.selectedOptionId = backendAns.selectedOptionId;
          } else if (q.type === "Coding") {
            baseAnswer.codingSubmission = {
              code: q.codingDetails?.starterCode || "",
              language: q.codingDetails?.language || "python",
              allTestsPassed: false,
            };
          }
          return baseAnswer;
        });

        setAnswers(restoredAnswers);
        setViewState("active");
        showToast("Resuming existing assessment session.", "info");
      }
    }
  }, [assignment, submissions, navigate, showToast, currentUser, activeDraft]);

  const isEnrolled = assignment
    ? enrolledCourseIds.includes(assignment.courseId)
    : false;
  const isPublished = assignment ? assignment.status !== "Draft" : false;

  // Periodic check to update isPastDueDateState live
  useEffect(() => {
    if (!assignment || !assignment.dueDate) return;

    const checkPastDue = () => {
      const past = new Date(assignment.dueDate) < new Date();
      if (past !== isPastDueDateState) {
        setIsPastDueDateState(past);
      }
    };

    checkPastDue();
    const interval = setInterval(checkPastDue, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [assignment, isPastDueDateState]);

  // Live expiry listener during active attempt
  useEffect(() => {
    if (viewState === "active" && isPastDueDateState && assignment) {
      if (!assignment.allowLateSubmission) {
        showToast(
          "Due date has passed! This assignment is now closed.",
          "error",
        );

        // Clear any pending autosave timeouts
        if (autosaveTimeout.current) {
          clearTimeout(autosaveTimeout.current);
        }

        // Final save draft of the current answers
        const payload: Submission = {
          id: activeSubmissionId || "",
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          studentId: currentUser?.id.toString() || "",
          studentName: currentUser?.fullName || "",
          submittedAt: new Date().toISOString(),
          answers: answers,
          status: "Pending",
        };
        if (payload.id) {
          saveDraftMutation.mutate(payload);
        }
      } else {
        showToast(
          "Due date has passed. Your submission will be marked as Late.",
          "info",
        );
      }
    }
  }, [
    isPastDueDateState,
    viewState,
    assignment,
    activeSubmissionId,
    currentUser,
    answers,
    showToast,
    saveDraftMutation,
  ]);

  const startAttemptMutation = useMutation({
    mutationFn: () =>
      assignmentService.startAttempt(id!, currentUser?.id.toString() || ""),
    onSuccess: async (data: any) => {
      if (data && data.id) {
        setActiveSubmissionId(data.id.toString());
      }
      if (data && data.startedAt) {
        setStartedAtTime(data.startedAt);
      }
      initializeAnswers();
      setViewState("active");
      showToast("Assessment session started. Timer is now active.", "success");
      try {
        await refreshAssignments();
      } catch (e) {
        console.warn("Failed to background-refresh assignments on start", e);
      }
    },
    onError: (err: any) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast(
          "You do not have permission to start this assignment.",
          "error",
        );
      } else if (err.response?.status === 404) {
        showToast("Assignment not found.", "error");
      } else if (err.response?.status === 409) {
        showToast("You have already submitted this assignment.", "error");
        navigate(`/student/result/${id}`);
      } else {
        showToast("Failed to start assignment. Please try again.", "error");
      }
    },
  });

  const submitAttemptMutation = useMutation({
    mutationFn: (sub: Submission) => assignmentService.submitAttempt(sub),
    onSuccess: () => {
      setIsSubmitting(false);
      setShowSubmitModal(false);
      showToast(
        "Assignment submitted successfully. Routing to performance summary.",
        "success",
      );
      navigate(`/student/result/${assignment?.id}`);
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      if (err.response?.status === 409) {
        showToast("You have already submitted this assignment.", "error");
      } else {
        showToast("Submission failed. Please try again.", "error");
      }
    },
  });

  const shuffledQuestions = useMemo(() => {
    if (!assignment || !assignment.questions) return [];
    if (assignment.shuffleQuestions && activeSubmissionId) {
      const seed = getSeedFromString(activeSubmissionId);
      return seededShuffle(assignment.questions, seed);
    }
    return assignment.questions;
  }, [assignment, activeSubmissionId]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const currentMcqOptions = useMemo(() => {
    if (
      !currentQuestion ||
      currentQuestion.type !== "MCQ" ||
      !currentQuestion.mcqDetails
    )
      return [];
    const details = currentQuestion.mcqDetails;
    const paired = details.options.map((opt, idx) => ({
      text: opt,
      id: details.optionIds?.[idx] || idx.toString(),
      originalIndex: idx,
    }));
    if (assignment?.shuffleOptions && activeSubmissionId) {
      const seed = getSeedFromString(activeSubmissionId + currentQuestion.id);
      return seededShuffle(paired, seed);
    }
    return paired;
  }, [currentQuestion, assignment, activeSubmissionId]);

  const initializeAnswers = () => {
    if (!assignment || !assignment.questions) return;
    const initialAnswers = assignment.questions.map((q) => {
      const baseAnswer: Answer = {
        questionId: q.id,
        questionType: q.type,
      };
      if (q.type === "Coding") {
        baseAnswer.codingSubmission = {
          code: q.codingDetails?.starterCode || "",
          language: q.codingDetails?.language || "python",
          allTestsPassed: false,
        };
      }
      return baseAnswer;
    });
    setAnswers(initialAnswers);
  };

  const handleStartAssignment = () => {
    startAttemptMutation.mutate();
  };

  // Autosave logic
  const triggerAutosave = (currentAnswers: Answer[]) => {
    if (!assignment) return;
    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }
    autosaveTimeout.current = setTimeout(() => {
      const payload: Submission = {
        id: activeSubmissionId || "",
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentId: currentUser?.id.toString() || "",
        studentName: currentUser?.fullName || "",
        submittedAt: new Date().toISOString(),
        answers: currentAnswers,
        status: "Pending",
      };
      if (payload.id) {
        saveDraftMutation.mutate(payload);
      }
    }, 2000); // Autosave 2s after last change
  };

  // Safe handler to update answers array state
  const updateAnswer = (
    questionId: string,
    updater: (ans: Answer) => Answer,
  ) => {
    setAnswers((prev) => {
      const updated = prev.map((ans) =>
        ans.questionId === questionId ? updater(ans) : ans,
      );
      triggerAutosave(updated);
      return updated;
    });
  };

  // Get active answer object
  const getAnswerForQuestion = (questionId: string) => {
    return answers.find((ans) => ans.questionId === questionId);
  };

  // Toggling Flags in Sidebar Navigator
  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((qId) => qId !== questionId)
        : [...prev, questionId],
    );
  };

  // Handle countdown timeout trigger
  const handleTimeUp = () => {
    setIsTimerExpiredState(true);
  };

  // Compiler Simulator
  const handleRunCodeTest = (question: Question) => {
    const qId = question.id;
    const answer = getAnswerForQuestion(qId);
    if (!answer?.codingSubmission?.code) return;

    setCompiling((prev) => ({ ...prev, [qId]: true }));
    setCompilerLogs((prev) => ({
      ...prev,
      [qId]: "Connecting to sandbox microkernel...",
    }));

    setTimeout(() => {
      setCompilerLogs((prev) => ({
        ...prev,
        [qId]: `${prev[qId]}\nCompiling TypeScript/Python binary nodes...\nExecuting 2 test cases...\n\n✓ Test Case 1: Standard logs parsed. Expected: 1, Received: 1\n✓ Test Case 2: Multi-match case-insensitive scan. Expected: 2, Received: 2\n\nResult: SUCCESS. All unit test cases passed safely!`,
      }));
      setCompiling((prev) => ({ ...prev, [qId]: false }));

      // Set tests passed to true in state
      updateAnswer(qId, (ans) => ({
        ...ans,
        codingSubmission: {
          code: ans.codingSubmission?.code || "",
          language: ans.codingSubmission?.language || "python",
          allTestsPassed: true,
        },
      }));
    }, 1800);
  };

  // File Upload Simulator
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    question: Question,
  ) => {
    const qId = question.id;
    const file = e.target.files?.[0];
    if (!file) return;

    // Confirm file dimensions
    const maxMB = question.fileUploadDetails?.maxSizeMB || 5;
    if (file.size > maxMB * 1024 * 1024) {
      showToast(
        `Error: File exceeds maximum allowed size of ${maxMB}MB.`,
        "error",
      );
      return;
    }

    setUploading((prev) => ({ ...prev, [qId]: true }));

    setTimeout(() => {
      const mockFileData = {
        fileName: file.name,
        fileUrl: `https://educorp-lms-storage.local/submissions/${qId}/${file.name}`,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      };

      setUploadedFiles((prev) => ({ ...prev, [qId]: mockFileData }));
      setUploading((prev) => ({ ...prev, [qId]: false }));

      updateAnswer(qId, (ans) => ({
        ...ans,
        fileUploadData: mockFileData,
      }));

      showToast(
        "File uploaded successfully into secure sandbox repository.",
        "success",
      );
    }, 2000);
  };

  const handleRemoveFile = (questionId: string) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    updateAnswer(questionId, (ans) => {
      const updated = { ...ans };
      delete updated.fileUploadData;
      return updated;
    });
  };

  // Final Action submission sequence
  const executeSubmission = useCallback(() => {
    if (!assignment) return;
    setIsSubmitting(true);
    // Build the submission payload
    const submissionPayload: Submission = {
      id: activeSubmissionId || "",
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentId: currentUser?.id.toString() || "",
      studentName: currentUser?.fullName || "",
      submittedAt: new Date().toISOString(),
      answers: answers,
      status: "Submitted", // Will be instant-graded in ResultPage for a magical high-fidelity experience!
    };

    submitAttemptMutation.mutate(submissionPayload);
  }, [
    assignment,
    activeSubmissionId,
    currentUser,
    answers,
    submitAttemptMutation,
  ]);

  // Effect 1: Check on load or active draft update if the attempt has already timed out
  useEffect(() => {
    if (startedAtTime && assignment && assignment.durationMinutes > 0) {
      const startedTimeMs = new Date(startedAtTime).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedTimeMs) / 1000);
      const totalSecondsAllowed = assignment.durationMinutes * 60;
      if (totalSecondsAllowed - elapsedSeconds <= 0) {
        setIsTimerExpiredState(true);
      }
    }
  }, [startedAtTime, assignment]);

  // Effect 2: Respond to expiration
  useEffect(() => {
    if (
      isTimerExpiredState &&
      !autoTimeoutProcessedRef.current &&
      viewState === "active" &&
      assignment &&
      activeSubmissionId
    ) {
      autoTimeoutProcessedRef.current = true;

      // Clear any pending autosave timeouts
      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
      }

      if (assignment.autoSubmit !== false) {
        // Auto-submit is enabled (true or default)
        showToast(
          "Time limit expired! Autosubmitting current progress.",
          "error",
        );
        executeSubmission();
      } else {
        // Auto-submit is disabled (false)
        showToast("Time has expired! Saving your progress.", "error");
        const payload: Submission = {
          id: activeSubmissionId || "",
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          studentId: currentUser?.id.toString() || "",
          studentName: currentUser?.fullName || "",
          submittedAt: new Date().toISOString(),
          answers: answers,
          status: "Pending",
        };
        saveDraftMutation.mutate(payload);
      }
    }
  }, [
    isTimerExpiredState,
    viewState,
    assignment,
    activeSubmissionId,
    answers,
    currentUser,
    showToast,
    executeSubmission,
    saveDraftMutation,
  ]);

  if (isAssignmentLoading || isSubmissionsLoading || isEnrollmentsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-[#6C1D5F] animate-spin" />
        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
          Loading Workspace...
        </p>
      </div>
    );
  }

  if (isAssignmentError || !assignment || !isEnrolled || !isPublished) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 p-8 max-w-md mx-auto my-12 space-y-4 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-[#FF6200] mx-auto" />
        <h3 className="text-lg font-display font-bold text-black uppercase tracking-tight">
          Access Denied
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {isAssignmentError
            ? "There was an error loading this assignment."
            : !assignment
              ? "The assignment code matches no registered active modules."
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

  // Submission details calculations
  const totalQuestions = shuffledQuestions.length;
  const answeredCount = answers.filter((ans) => {
    switch (ans.questionType) {
      case "MCQ":
        return ans.mcqSelectedIndex !== undefined && ans.mcqSelectedIndex >= 0;
      case "Coding":
        return !!ans.codingSubmission?.code;
      case "Essay":
        return !!ans.essayText && ans.essayText.trim().length > 0;
      case "ShortAnswer":
        return !!ans.shortAnswerText && ans.shortAnswerText.trim().length > 0;
      case "FileUpload":
        return !!ans.fileUploadData?.fileUrl;
      default:
        return false;
    }
  }).length;

  const unansweredCount = totalQuestions - answeredCount;

  if (isPastDueDateState && !assignment?.allowLateSubmission) {
    return (
      <div
        className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-150 shadow-xl overflow-hidden p-8 text-center space-y-6 my-12 animate-fade-in"
        id="assignment-closed-screen"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-extrabold text-black uppercase tracking-tight">
            Assignment Closed
          </h2>
          <div className="space-y-4 py-2">
            <p className="text-sm font-semibold text-gray-700">
              The submission deadline has passed.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              Late submissions are not permitted for this assignment. Please
              contact your instructor if you believe this is an error.
            </p>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
          {latestCompletedSubmission ? (
            <button
              onClick={() => navigate(`/student/result/${assignment.id}`)}
              className="w-full px-5 py-3 bg-[#01AC9F] hover:bg-[#008f84] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              id="btn-view-performance-closed"
            >
              {assignment?.showScoreImmediately === false &&
              latestCompletedSubmission.status === "Submitted"
                ? "View Status"
                : "View Performance"}
            </button>
          ) : null}
          <button
            onClick={() => navigate("/student/dashboard")}
            className="w-full px-5 py-3 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
            id="btn-return-dashboard-closed"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="assignment-attempt-workspace" className="space-y-6">
      {/* 1. Pre-start entry screen view */}
      {viewState === "pre-start" && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          {/* Cover Header */}
          <div className="bg-[#6C1D5F] p-8 md:p-10 text-white relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <span className="px-2.5 py-1 bg-white/10 text-[#76f7e8] rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border border-white/15">
                {assignment.courseTitle}
              </span>
              <h2 className="text-3xl font-display font-extrabold tracking-tight mt-2">
                {assignment.title}
              </h2>
              <p className="text-sm text-white/80 max-w-xl font-sans mt-2">
                Authorized assessment portal. Please review the operational
                standards, grading values, and time criteria before initiating
                the telemetry session.
              </p>
            </div>
            {/* Ambient background accent */}
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-[#01AC9F]/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Guidelines Body */}
          <div className="p-8 space-y-8">
            {isPastDueDateState && assignment.allowLateSubmission && (
              <div
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 flex items-start gap-4"
                id="late-submission-pre-start-warning"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-200">
                    Late Submission
                  </span>
                  <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                    This assignment is past its due date. Your submission will
                    be marked as Late.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-gray-100/50 flex items-center gap-3.5">
                <div className="p-2.5 bg-[#6C1D5F]/10 rounded-xl">
                  <Clock className="w-5 h-5 text-[#6C1D5F]" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider">
                    Session Duration
                  </p>
                  <p className="font-mono font-bold text-gray-800">
                    {assignment.durationMinutes > 0
                      ? `${assignment.durationMinutes} Minutes`
                      : "No Time Limit"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-gray-100/50 flex items-center gap-3.5">
                <div className="p-2.5 bg-[#FF6200]/10 rounded-xl">
                  <Award className="w-5 h-5 text-[#FF6200]" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider">
                    Evaluation Weight
                  </p>
                  <p className="font-mono font-bold text-gray-800">
                    {assignment.totalMarks} Total Marks
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-gray-100/50 flex items-center gap-3.5">
                <div className="p-2.5 bg-[#01AC9F]/10 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-[#01AC9F]" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider">
                    Total Challenges
                  </p>
                  <p className="font-mono font-bold text-gray-800">
                    {shuffledQuestions.length} Questions
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F7F8FC] rounded-2xl border border-gray-100/50 flex items-center gap-3.5">
                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider">
                    Assessment Attempts
                  </p>
                  <p className="font-mono font-bold text-gray-800">
                    {maxAttempts === null
                      ? `Attempt ${completedAttempts + 1} of Unlimited`
                      : attemptsExhausted
                        ? `Attempts Exhausted (${completedAttempts}/${maxAttempts})`
                        : `Attempt ${completedAttempts + 1} of ${maxAttempts}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Rules list */}
            <div className="space-y-4">
              <h4 className="text-sm font-mono font-extrabold text-black uppercase tracking-wider border-b border-gray-100 pb-2">
                Operational Guidelines
              </h4>
              <ul className="space-y-3.5 text-xs text-[#5A5A5A] leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-black font-semibold">
                    Strict Navigation Locking:
                  </strong>{" "}
                  Navigating away from this tab or minimizing the viewport will
                  trigger telemetry alerts to administrative monitors.
                </li>
                <li>
                  <strong className="text-black font-semibold">
                    Automatic Submission Control:
                  </strong>{" "}
                  Once started, the timer cannot be paused. If the countdown
                  reaches zero, all parsed entries will be automatically
                  submitted for grading.
                </li>
                <li>
                  <strong className="text-black font-semibold">
                    Compiler Auditing:
                  </strong>{" "}
                  Coding submissions will be parsed using sandbox standard
                  verification compilers. Confirm code succeeds on starter
                  tests.
                </li>
                <li>
                  <strong className="text-black font-semibold">
                    Draft Persistence:
                  </strong>{" "}
                  Changes are saved locally on your client machine inside active
                  sessions to prevent connectivity data loss.
                </li>
              </ul>
            </div>

            {/* Launch CTA */}
            <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-50 flex-wrap">
              <button
                onClick={() => navigate("/student/dashboard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-[#5A5A5A] border border-gray-200 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Return to Dashboard
              </button>

              {attemptsExhausted ? (
                <div className="flex items-center gap-3">
                  <span className="text-red-600 font-semibold text-xs bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    You have reached the maximum number of allowed attempts.
                  </span>
                  {latestCompletedSubmission && (
                    <button
                      onClick={() =>
                        navigate(`/student/result/${assignment.id}`)
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#01AC9F] hover:bg-[#018c81] text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-md hover:shadow-lg"
                    >
                      {assignment?.showScoreImmediately === false &&
                      latestCompletedSubmission.status === "Submitted"
                        ? "View Status"
                        : "View Performance"}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleStartAssignment}
                  disabled={startAttemptMutation.isPending}
                  className={`px-6 py-3 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-md shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${startAttemptMutation.isPending ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
                >
                  {startAttemptMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {activeDraft
                    ? "Resume Assignment"
                    : completedAttempts > 0
                      ? "Retake Assignment"
                      : "Start Assignment"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Testing Viewport */}
      {viewState === "active" &&
        (isTimerExpiredState && assignment.autoSubmit === false ? (
          <div
            className="max-w-xl mx-auto bg-white rounded-3xl border border-rose-150 shadow-xl overflow-hidden p-8 text-center space-y-6 my-12 animate-fade-in"
            id="time-expired-lockscreen"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-extrabold text-black uppercase tracking-tight">
                Time Expired
              </h2>
              <div className="space-y-4 py-2">
                <p className="text-sm font-semibold text-gray-700">
                  Your time has expired.
                </p>
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 text-xs text-rose-800 leading-relaxed space-y-3 text-left">
                  <p className="font-bold text-rose-700">
                    Your responses have not been submitted automatically because
                    automatic submission is disabled.
                  </p>
                  <p className="text-gray-600 font-medium">
                    Your latest responses have been saved safely.
                  </p>
                  <p className="font-mono text-[10px] text-rose-600 uppercase tracking-wider block font-bold">
                    Please contact your instructor regarding submission.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate("/student/dashboard")}
                className="w-full px-5 py-3 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
                id="btn-return-dashboard"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Top Header Panel */}
            <div className="bg-white rounded-3xl border border-gray-100/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-[#6C1D5F]/10 text-[#6C1D5F] rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                  {assignment.courseTitle}
                </span>
                <h2 className="text-lg font-display font-extrabold text-black">
                  {assignment.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                  <span>
                    Task progress: {answeredCount} / {totalQuestions} answered
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Count Down Timer */}
                {assignment.durationMinutes > 0 && (
                  <Timer
                    durationMinutes={assignment.durationMinutes}
                    onTimeUp={handleTimeUp}
                    startedAt={startedAtTime}
                  />
                )}

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#01AC9F] hover:bg-[#008f84] text-white text-xs font-bold rounded-md shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  Submit Assignment
                </button>
              </div>
            </div>

            {isPastDueDateState && assignment.allowLateSubmission && (
              <div
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse"
                id="active-late-warning"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="space-y-0.5 flex items-center flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                      Late Submission
                    </span>
                    <span className="text-xs font-semibold text-amber-800">
                      This assignment is past its due date. Your submission will
                      be marked as Late.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3-panel testing workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Navigator & Info */}
              <div className="lg:col-span-1 space-y-6">
                <QuestionNavigator
                  questions={shuffledQuestions}
                  currentQuestionIndex={currentQuestionIndex}
                  onQuestionSelect={(idx) => setCurrentQuestionIndex(idx)}
                  answers={answers}
                  flaggedQuestionIds={flaggedQuestionIds}
                  onToggleFlag={handleToggleFlag}
                />

                {/* Integrity Warning panel */}
                <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2 text-[#FF6200]">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider">
                      Active Monitoring Engaged
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-gray-500 leading-relaxed">
                    Your active interface window, mouse coordinates, and canvas
                    uploads are logged. Avoid shifting tabs to maintain session
                    integrity.
                  </p>
                </div>
              </div>

              {/* Right/Center Area: Main Active Question Interface */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between min-h-[500px]">
                  {/* Question Info Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                      <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                        Challenge {currentQuestionIndex + 1} of{" "}
                        {shuffledQuestions.length}
                      </span>
                      <span className="px-2.5 py-1 bg-gray-100 text-[#5A5A5A] rounded-md text-[10px] font-mono font-bold">
                        {currentQuestion.points} Marks
                      </span>
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-display font-bold text-black">
                        {currentQuestion.title}
                      </h3>
                      <p className="text-sm font-sans text-[#5A5A5A] leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.prompt}
                      </p>
                    </div>
                  </div>

                  {/* Question Input Block based on QuestionType */}
                  <div className="my-6 py-6 border-t border-b border-gray-50 flex-grow">
                    {/* TYPE A: Multiple Choice Question */}
                    {currentQuestion.type === "MCQ" &&
                      currentQuestion.mcqDetails && (
                        <div className="space-y-3">
                          {currentMcqOptions.map((option, idx) => {
                            const isSelected =
                              getAnswerForQuestion(currentQuestion.id)
                                ?.selectedOptionId === option.id;
                            const charPrefix = String.fromCharCode(65 + idx); // A, B, C, D...

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  updateAnswer(currentQuestion.id, (ans) => ({
                                    ...ans,
                                    mcqSelectedIndex: option.originalIndex,
                                    selectedOptionId: option.id,
                                  }));
                                }}
                                className={`w-full text-left p-4 rounded-xl border font-sans text-xs font-medium transition-all flex items-center gap-4 cursor-pointer hover:bg-[#F7F8FC] ${
                                  isSelected
                                    ? "bg-[#6C1D5F]/5 border-[#6C1D5F] text-[#6C1D5F]"
                                    : "bg-white border-gray-150 text-[#5A5A5A]"
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center border text-xs ${
                                    isSelected
                                      ? "bg-[#6C1D5F] text-white border-[#6C1D5F]"
                                      : "bg-[#F7F8FC] text-[#5A5A5A] border-gray-200"
                                  }`}
                                >
                                  {charPrefix}
                                </span>
                                <span>{option.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                    {/* TYPE B: Coding Question */}
                    {currentQuestion.type === "Coding" &&
                      currentQuestion.codingDetails && (
                        <div className="space-y-4 font-mono">
                          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-inner overflow-hidden">
                            {/* Terminal Window Header */}
                            <div className="px-4 py-3 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-[#01AC9F]" />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                  Integrated Sandbox —{" "}
                                  {currentQuestion.codingDetails.language}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                ReadOnly Server Connected
                              </span>
                            </div>

                            {/* Textarea Code entry */}
                            <div className="relative flex">
                              {/* Simulated Line numbers */}
                              <div className="p-4 pr-2 text-right text-gray-600 border-r border-gray-800 bg-gray-950/50 select-none text-xs w-11">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <div key={i}>{i + 1}</div>
                                ))}
                              </div>

                              <textarea
                                value={
                                  getAnswerForQuestion(currentQuestion.id)
                                    ?.codingSubmission?.code || ""
                                }
                                onChange={(e) => {
                                  updateAnswer(currentQuestion.id, (ans) => ({
                                    ...ans,
                                    codingSubmission: {
                                      code: e.target.value,
                                      language:
                                        ans.codingSubmission?.language ||
                                        "python",
                                      allTestsPassed:
                                        ans.codingSubmission?.allTestsPassed ||
                                        false,
                                    },
                                  }));
                                }}
                                className="w-full p-4 bg-transparent text-gray-200 focus:outline-none resize-none font-mono text-xs leading-relaxed"
                                rows={12}
                                spellCheck={false}
                              />
                            </div>
                          </div>

                          {/* Compiler triggers */}
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <button
                              onClick={() => handleRunCodeTest(currentQuestion)}
                              disabled={compiling[currentQuestion.id]}
                              className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-200 text-xs font-bold rounded-md shadow-2xs transition-all cursor-pointer ${
                                compiling[currentQuestion.id]
                                  ? "animate-pulse"
                                  : ""
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 text-[#01AC9F]" />
                              {compiling[currentQuestion.id]
                                ? "Compiling Script..."
                                : "Run Test Suite Verification"}
                            </button>

                            {getAnswerForQuestion(currentQuestion.id)
                              ?.codingSubmission?.allTestsPassed && (
                              <div className="flex items-center gap-1.5 text-[#01AC9F] text-xs font-bold">
                                <CheckCircle className="w-4 h-4" />
                                <span>Verification Passed</span>
                              </div>
                            )}
                          </div>

                          {/* Compiler Logs */}
                          {compilerLogs[currentQuestion.id] && (
                            <div className="bg-gray-950/80 p-4 border border-gray-850 rounded-xl text-gray-400 text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                              <span className="text-[10px] text-gray-600 block uppercase font-extrabold tracking-widest mb-1">
                                Compiler Console Logs
                              </span>
                              {compilerLogs[currentQuestion.id]}
                            </div>
                          )}
                        </div>
                      )}

                    {/* TYPE C: Essay Question */}
                    {currentQuestion.type === "Essay" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                          <span>Rich Essay Box</span>
                          <span>
                            {
                              (
                                getAnswerForQuestion(currentQuestion.id)
                                  ?.essayText || ""
                              )
                                .trim()
                                .split(/\s+/)
                                .filter(Boolean).length
                            }{" "}
                            words
                          </span>
                        </div>
                        <textarea
                          value={
                            getAnswerForQuestion(currentQuestion.id)
                              ?.essayText || ""
                          }
                          onChange={(e) => {
                            updateAnswer(currentQuestion.id, (ans) => ({
                              ...ans,
                              essayText: e.target.value,
                            }));
                          }}
                          placeholder="Draft your detailed analysis response here. Frame your argument using clear paragraphs and analytical citations..."
                          className="w-full p-4 bg-white border border-gray-200 hover:border-gray-300 focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] rounded-2xl focus:outline-none font-sans text-xs leading-relaxed text-[#5A5A5A]"
                          rows={12}
                        />
                      </div>
                    )}

                    {/* TYPE D: Short Answer Question */}
                    {currentQuestion.type === "ShortAnswer" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                          Your Concise Response
                        </label>
                        <input
                          type="text"
                          value={
                            getAnswerForQuestion(currentQuestion.id)
                              ?.shortAnswerText || ""
                          }
                          onChange={(e) => {
                            updateAnswer(currentQuestion.id, (ans) => ({
                              ...ans,
                              shortAnswerText: e.target.value,
                            }));
                          }}
                          placeholder="Provide a specific, precise definition or answer..."
                          className="w-full p-3.5 bg-white border border-gray-200 focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] rounded-md focus:outline-none font-sans text-xs text-gray-800 font-medium"
                        />
                      </div>
                    )}

                    {/* TYPE E: File Upload Question */}
                    {currentQuestion.type === "FileUpload" &&
                      currentQuestion.fileUploadDetails && (
                        <div className="space-y-4">
                          {/* Drag Drop simulated area */}
                          {!uploadedFiles[currentQuestion.id] ? (
                            <div className="border-2 border-dashed border-gray-200 hover:border-[#6C1D5F] rounded-3xl p-8 text-center bg-gray-50/50 hover:bg-[#6C1D5F]/5 transition-all relative flex flex-col items-center justify-center group">
                              <input
                                type="file"
                                onChange={(e) =>
                                  handleFileUpload(e, currentQuestion)
                                }
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept={currentQuestion.fileUploadDetails.allowedExtensions.join(
                                  ",",
                                )}
                              />
                              <div className="p-3 bg-white rounded-full border border-gray-100 shadow-2xs group-hover:scale-115 transition-transform duration-300">
                                <FileUp className="w-5 h-5 text-[#6C1D5F]" />
                              </div>
                              <h4 className="text-sm font-display font-bold text-black mt-4">
                                Drag and Drop Topology Schema
                              </h4>
                              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                                Acceptable extensions:{" "}
                                {currentQuestion.fileUploadDetails.allowedExtensions.join(
                                  ", ",
                                )}{" "}
                                up to{" "}
                                {currentQuestion.fileUploadDetails.maxSizeMB}MB
                                in size.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-white border border-gray-100 shadow-2xs rounded-2xl flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#01AC9F]/10 rounded-xl">
                                  <FileText className="w-5 h-5 text-[#01AC9F]" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900 truncate max-w-xs md:max-w-md">
                                    {uploadedFiles[currentQuestion.id].fileName}
                                  </p>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {uploadedFiles[currentQuestion.id].fileSize}{" "}
                                    • Uploaded Successfully
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveFile(currentQuestion.id)
                                }
                                className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Simulating uploading progress bars */}
                          {uploading[currentQuestion.id] && (
                            <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                                <span>Uploading topology binary packet...</span>
                                <span className="animate-pulse">
                                  Active Sync...
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#01AC9F] rounded-full animate-progress-bar w-[70%]" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Footer Controls */}
                  <div className="flex items-center justify-between gap-4 border-t border-gray-50 pt-4 mt-auto">
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                      }
                      disabled={currentQuestionIndex === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white border border-gray-200 text-xs font-bold rounded-md transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>

                    <button
                      onClick={() => handleToggleFlag(currentQuestion.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                        flaggedQuestionIds.includes(currentQuestion.id)
                          ? "bg-[#FF6200] text-white"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100"
                      }`}
                    >
                      <Flag
                        className={`w-3.5 h-3.5 ${flaggedQuestionIds.includes(currentQuestion.id) ? "fill-current" : ""}`}
                      />
                      {flaggedQuestionIds.includes(currentQuestion.id)
                        ? "Flagged"
                        : "Flag"}
                    </button>

                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <button
                        onClick={() =>
                          setCurrentQuestionIndex((prev) => prev + 1)
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#01AC9F] hover:bg-[#008f84] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-sm"
                      >
                        Review & Submit
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* 3. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#01AC9F]" />
                <h3 className="text-lg font-display font-extrabold text-black">
                  Review Submission Sheet
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-gray-400 hover:text-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#5A5A5A] leading-relaxed">
                You are about to close this assessment laboratory session and
                submit your compiled logs. Review your progress indicators
                before sealing the attempt:
              </p>

              {/* Stats Review Matrix */}
              <div className="grid grid-cols-2 gap-3.5 bg-[#F7F8FC] p-4 rounded-2xl border border-gray-100">
                <div className="p-3 bg-white rounded-xl border border-gray-50 shadow-3xs flex flex-col items-center">
                  <span className="text-2xl font-mono font-black text-[#01AC9F]">
                    {answeredCount}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase mt-0.5">
                    Answered Tasks
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-50 shadow-3xs flex flex-col items-center">
                  <span
                    className={`text-2xl font-mono font-black ${unansweredCount > 0 ? "text-[#FF6200]" : "text-[#01AC9F]"}`}
                  >
                    {unansweredCount}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase mt-0.5">
                    Remaining Tasks
                  </span>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="p-3 bg-[#FF6200]/10 border border-[#FF6200]/25 rounded-xl text-[11px] text-[#FF6200] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: You have{" "}
                    <strong>{unansweredCount} unanswered</strong> questions.
                    Submitting now will leave these tasks with zero points
                    secured.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-500 border border-gray-250 text-xs font-semibold rounded-md transition-all cursor-pointer"
              >
                Cancel & Edit
              </button>
              <button
                onClick={executeSubmission}
                disabled={isSubmitting}
                className={`px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssignmentAttempt;
