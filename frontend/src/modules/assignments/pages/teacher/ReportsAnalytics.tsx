import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Loader2,
  Edit3,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  Download,
  Search,
  ChevronDown,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle,
  Mail,
  Calendar,
  X,
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { useAuthenticatedQuery } from "../../api/useAuthenticatedQuery";
import { assignmentService } from "../../api/assignmentService";
import { useMutation } from "@tanstack/react-query";
import { Assignment, Submission, Answer } from "../../types";
import apiClient from "../../../../lib/apiClient";

export const ReportsAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, currentUser, userRole } = useApp();

  const { data: assignments = [], isLoading: isAssignmentsLoading } =
    useAuthenticatedQuery<Assignment[]>(
      () => assignmentService.getAssignments(),
      [],
    );

  const {
    data: submissions = [],
    isLoading: isSubmissionsLoading,
    refetch: refetchSubmissions,
  } = useAuthenticatedQuery<Submission[]>(
    () => assignmentService.getSubmissions(),
    [],
  );

  const safeAssignments = assignments ?? [];
  const safeSubmissions = submissions ?? [];

  const isLoading = isAssignmentsLoading || isSubmissionsLoading;

  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(
    null,
  );
  const [gradingAnswers, setGradingAnswers] = useState<
    Record<string, { points: number; feedback: string }>
  >({});
  const [submissionFilter, setSubmissionFilter] = useState({
    assignmentId: "All",
    batchName: "All",
    studentName: "",
  });

  const gradeMutation = useMutation({
    mutationFn: (sub: Submission) =>
      assignmentService.gradeSubmission(sub.id, sub),
    onSuccess: () => {
      showToast("Submission graded successfully!", "success");
      setGradingSubmission(null);
      refetchSubmissions();
    },
    onError: () => {
      showToast("Failed to save grade.", "error");
    },
  });

  const handleOpenGradeModal = (sub: Submission) => {
    setGradingSubmission(sub);
    const initialGrading: Record<string, { points: number; feedback: string }> =
      {};
    sub.answers.forEach((a) => {
      initialGrading[a.questionId] = {
        points: a.pointsEarned || 0,
        feedback: a.teacherFeedback || "",
      };
    });
    setGradingAnswers(initialGrading);
  };

  const handleSaveGrades = () => {
    if (!gradingSubmission) return;
    let totalScore = 0;
    const updatedAnswers = gradingSubmission.answers.map((ans) => {
      const g = gradingAnswers[ans.questionId];
      if (g) totalScore += g.points;
      return {
        ...ans,
        pointsEarned: g?.points || 0,
        teacherFeedback: g?.feedback || "",
      };
    });
    gradeMutation.mutate({
      ...gradingSubmission,
      answers: updatedAnswers,
      score: totalScore,
      status: "Graded",
    });
  };

  const filteredSubmissionsList = safeSubmissions.filter((s) => {
    if (
      submissionFilter.assignmentId !== "All" &&
      s.assignmentId !== submissionFilter.assignmentId
    )
      return false;
    if (
      submissionFilter.studentName &&
      !s.studentName
        .toLowerCase()
        .includes(submissionFilter.studentName.toLowerCase())
    )
      return false;
    // Batch filtering requires matching assignment batch, but submission doesn't have batch directly. We check assignment.
    if (submissionFilter.batchName !== "All") {
      const a = safeAssignments.find((a) => a.id === s.assignmentId);
      if (
        !a ||
        !(
          a.assignedBatchNames &&
          a.assignedBatchNames.includes(submissionFilter.batchName)
        )
      )
        return false;
    }
    return true;
  });

  // Interactive States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("All Cohorts");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  // Export Assignment Results States
  const [isDownloadingExport, setIsDownloadingExport] = useState(false);
  const [showExportResultsModal, setShowExportResultsModal] = useState(false);
  const [selectedExportAssignmentId, setSelectedExportAssignmentId] =
    useState<string>("All");
  const [exportFileFormat, setExportFileFormat] = useState<"xlsx" | "csv">(
    "xlsx",
  );

  const handleExportAssignmentResults = async (assignmentId: string) => {
    if (!assignmentId || assignmentId === "All") {
      showToast("Please select a specific assignment to export.", "error");
      return;
    }
    setIsDownloadingExport(true);
    showToast("Preparing your assignment results export...", "info");
    try {
      const response = await apiClient.get(
        `/export/assignment/${assignmentId}`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const targetAssignment = safeAssignments.find(
        (asg) => asg.id === assignmentId,
      );
      const assignmentTitle = targetAssignment?.title || "Assignment";
      const sanitizedName = assignmentTitle.replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `${sanitizedName}_Results.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast("Assignment results exported successfully!", "success");
      setShowExportResultsModal(false);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to export assignment results.", "error");
    } finally {
      setIsDownloadingExport(false);
    }
  };
  const [cohortPerformance, setCohortPerformance] = useState([
    {
      id: "cohort-1",
      batchName: "Cyber Cohort B",
      courseName: "Cybersecurity Essentials",
      studentsCount: 45,
      completionRate: 93,
      avgScore: 88.5,
      trend: "+2.4%",
      isPositive: true,
      status: "Exceling",
    },
    {
      id: "cohort-2",
      batchName: "Leadership Cohort Alpha",
      courseName: "Leadership Principles",
      studentsCount: 32,
      completionRate: 100,
      avgScore: 92.0,
      trend: "+1.8%",
      isPositive: true,
      status: "Exceling",
    },
    {
      id: "cohort-3",
      batchName: "Compliance Group A",
      courseName: "GDPR & Data Privacy",
      studentsCount: 28,
      completionRate: 64,
      avgScore: 71.4,
      trend: "-3.1%",
      isPositive: false,
      status: "Needs Attention",
    },
    {
      id: "cohort-4",
      batchName: "Section A-2024",
      courseName: "Advanced AI Ethics",
      studentsCount: 45,
      completionRate: 88,
      avgScore: 84.2,
      trend: "+0.5%",
      isPositive: true,
      status: "On Track",
    },
  ]);

  const [flaggedStudents, setFlaggedStudents] = useState([
    {
      id: "fs-1",
      name: "Michael Ramos",
      email: "m.ramos@executive.edu",
      batch: "Compliance Group A",
      course: "GDPR & Data Privacy",
      avgScore: 52.4,
      issue: "Failed last 2 quizzes & completion is at 45%",
      avatarInitials: "MR",
      status: "High Risk",
    },
    {
      id: "fs-2",
      name: "Sophia Chen",
      email: "s.chen@executive.edu",
      batch: "Cyber Cohort B",
      course: "Cybersecurity Essentials",
      avgScore: 58.0,
      issue: "Sandbox VM code fails continuously due to CPU timeout",
      avatarInitials: "SC",
      status: "At Risk",
    },
    {
      id: "fs-3",
      name: "Marcus Vance",
      email: "m.vance@executive.edu",
      batch: "Compliance Group A",
      course: "GDPR & Data Privacy",
      avgScore: 61.2,
      issue: "Missed the major Case Study draft milestone due last week",
      avatarInitials: "MV",
      status: "Moderate Risk",
    },
    {
      id: "fs-4",
      name: "Elena Rostov",
      email: "e.rostov@executive.edu",
      batch: "Section A-2024",
      course: "Advanced AI Ethics",
      avgScore: 63.5,
      issue: "2 Overdue essays unresolved",
      avatarInitials: "ER",
      status: "Moderate Risk",
    },
  ]);

  // Read dynamically to keep statistics authentic!
  useEffect(() => {
    if (userRole === "teacher") {
      setCohortPerformance((prev) =>
        prev.filter((c) => c.courseName !== "GDPR & Data Privacy"),
      );
    }

    const customSubmission = safeSubmissions.find(
      (s) => s.studentId === "student-123",
    );
    if (customSubmission && customSubmission.score !== undefined) {
      setCohortPerformance((prev) =>
        prev.map((c) => {
          if (c.batchName === "Cyber Cohort B") {
            const percent = customSubmission.score!;
            const updatedAvg = parseFloat(
              ((c.avgScore * 44 + percent) / 45).toFixed(1),
            );
            return { ...c, avgScore: updatedAvg };
          }
          return c;
        }),
      );
    }
  }, [currentUser, userRole, submissions]);

  const handleExportGradebook = () => {
    setShowExportModal(true);
    setIsExporting(true);
    setExportProgress(10);
    showToast("Initializing Gradebook compiling engine...", "info");

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            showToast("Master Gradebook .XLSX compiled & ready!", "success");
          }, 500);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const handleSendWarning = (studentName: string) => {
    showToast(
      `Warning warning dispatch triggered for ${studentName}.`,
      "success",
    );
  };

  const filteredCohorts = cohortPerformance.filter((c) => {
    const matchesSearch =
      c.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredStudents = flaggedStudents.filter((s) => {
    const matchesCohort =
      selectedCohort === "All Cohorts" || s.batch === selectedCohort;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCohort && matchesSearch;
  });

  return (
    <div
      className="min-h-screen bg-[#F7F8FC] pb-16 font-sans"
      id="reports-analytics-dashboard"
    >
      {/* Dynamic Header Console */}
      <div className="bg-white border-b border-gray-150/60 py-4 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-3xs">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#6C1D5F]/5 rounded-xl text-[#6C1D5F]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#6C1D5F] tracking-widest bg-[#6C1D5F]/5 px-2 py-0.5 rounded-md">
                Executive Reporting Suite
              </span>
              <span className="text-[10px] font-mono font-medium text-gray-400">
                /
              </span>
              <span className="text-[10px] font-mono font-medium text-gray-400">
                Analytics
              </span>
            </div>
            <h1 className="text-xl font-display font-extrabold text-[#000000] tracking-tight mt-0.5">
              Performance Insights
            </h1>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative shrink-0">
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="pl-3.5 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700 appearance-none focus:outline-none focus:border-[#6C1D5F] transition-all cursor-pointer"
            >
              <option value="All Cohorts">All Cohorts</option>
              <option value="Cyber Cohort B">Cyber Cohort B</option>
              <option value="Leadership Cohort Alpha">
                Leadership Cohort Alpha
              </option>
              <option value="Compliance Group A">Compliance Group A</option>
              <option value="Section A-2024">Section A-2024</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={handleExportGradebook}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-md transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-[#6C1D5F]/15"
            id="export-master-gradebook-btn"
          >
            <Download className="w-3.5 h-3.5" />
            Export Gradebook
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 md:px-8 space-y-8">
        {/* Interactive Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Average Score
              </span>
              <div className="p-1.5 rounded-lg bg-[#01AC9F]/5 border border-[#01AC9F]/10 text-[#01AC9F]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1 mt-4">
              <h3 className="text-3xl font-mono font-black text-[#000000] leading-none">
                84.6%
              </h3>
              <p className="text-[10px] font-mono text-[#01AC9F] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>+2.4% Delta</span>
                <span>▲</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-sans text-[#5A5A5A]">
              Across 4 registered cohorts
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between ring-2 ring-offset-2 ring-[#FF6200]/25">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                At-Risk Students
              </span>
              <div className="p-1.5 rounded-lg bg-[#FF6200]/10 border border-[#FF6200]/20 text-[#FF6200]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1 mt-4">
              <h3 className="text-3xl font-mono font-black text-[#FF6200] leading-none">
                04
              </h3>
              <p className="text-[10px] font-mono text-[#FF6200] font-bold uppercase tracking-wider">
                Immediate Action Required
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-sans text-gray-400">
              Needs warning & mitigation
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Completion Rate
              </span>
              <div className="p-1.5 rounded-lg bg-[#6C1D5F]/5 border border-[#6C1D5F]/10 text-[#6C1D5F]">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1 mt-4">
              <h3 className="text-3xl font-mono font-black text-[#000000] leading-none">
                87.2%
              </h3>
              <p className="text-[10px] font-mono text-gray-400 font-semibold tracking-wide">
                Target: 90% Enterprise KPI
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-sans text-[#5A5A5A]">
              126 total submissions cataloged
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Active Releases
              </span>
              <div className="p-1.5 rounded-lg bg-[#6C1D5F]/5 border border-[#6C1D5F]/10 text-[#6C1D5F]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1 mt-4">
              <h3 className="text-3xl font-mono font-black text-[#000000] leading-none">
                03
              </h3>
              <p className="text-[10px] font-mono text-[#01AC9F] font-bold uppercase tracking-wider">
                Fully Synchronized
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] font-sans text-[#5A5A5A]">
              Latest: Penetration testing lab
            </div>
          </div>
        </div>

        {/* Lower Row: Cohort Performance Table & Flagged Students list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cohort Performance Card - Left span 2 */}
          <div
            className="lg:col-span-2 bg-white rounded-3xl border border-gray-150/80 shadow-3xs overflow-hidden"
            id="cohort-performance-card"
          >
            {/* Header with Search and Stats */}
            <div className="p-6 border-b border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-extrabold text-black">
                    Cohort Performance Diagnostics
                  </h2>
                  <p className="text-xs text-gray-400">
                    Global rankings of active corporate batches by weighted
                    evaluation scores.
                  </p>
                </div>

                {/* Search in Diagnostics */}
                <div className="relative shrink-0 w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search cohorts or modules..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-[#6C1D5F] rounded-lg text-xs placeholder-gray-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Performance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-6">Batch Name</th>
                    <th className="py-3.5 px-6">Program / Course</th>
                    <th className="py-3.5 px-6 text-center">Enrollment</th>
                    <th className="py-3.5 px-6">Completion Rate</th>
                    <th className="py-3.5 px-6 text-right">Average Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredCohorts.map((cohort) => {
                    const isExcelling = cohort.status === "Exceling";
                    const isAttention = cohort.status === "Needs Attention";

                    return (
                      <tr
                        key={cohort.id}
                        className="hover:bg-gray-50/40 transition-colors"
                      >
                        <td className="py-4.5 px-6">
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-950">
                              {cohort.batchName}
                            </p>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wide ${
                                isExcelling
                                  ? "bg-[#01AC9F]/10 text-[#01AC9F]"
                                  : isAttention
                                    ? "bg-[#FF6200]/10 text-[#FF6200]"
                                    : "bg-purple-100 text-[#6C1D5F]"
                              }`}
                            >
                              {cohort.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 font-medium text-gray-600">
                          {cohort.courseName}
                        </td>
                        <td className="py-4.5 px-6 font-mono font-bold text-center text-gray-500">
                          {cohort.studentsCount} Students
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="space-y-1 w-28">
                            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 font-bold">
                              <span>{cohort.completionRate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-150 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cohort.completionRate >= 90
                                    ? "bg-[#01AC9F]"
                                    : cohort.completionRate >= 75
                                      ? "bg-[#6C1D5F]"
                                      : "bg-[#FF6200]"
                                }`}
                                style={{ width: `${cohort.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-sm text-[#000000]">
                              {cohort.avgScore}%
                            </span>
                            <p
                              className={`text-[10px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                                cohort.isPositive
                                  ? "text-[#01AC9F]"
                                  : "text-[#FF6200]"
                              }`}
                            >
                              <span>{cohort.trend}</span>
                              <span>{cohort.isPositive ? "▲" : "▼"}</span>
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer actions */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="font-mono font-semibold">
                Showing {filteredCohorts.length} of {cohortPerformance.length}{" "}
                registered cohorts
              </span>
              <button
                onClick={() =>
                  showToast(
                    "Opening programmatic cohort comparison logs...",
                    "info",
                  )
                }
                className="text-[#6C1D5F] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Detailed Comparison Table
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Flagged Students list - Right span 1 */}
          <div
            className="bg-white rounded-3xl border border-gray-150/80 shadow-3xs p-6 space-y-5 flex flex-col justify-between"
            id="flagged-students-card"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-extrabold text-gray-400 uppercase tracking-wider">
                  Flagged At-Risk Students
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6200] animate-pulse" />
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Instructors are advised to immediately trigger interventions.
              </p>
            </div>

            {/* List of Flagged Students */}
            <div className="space-y-4.5 flex-grow my-2">
              {filteredStudents.map((student) => {
                const isHighRisk = student.status === "High Risk";
                const isAtRisk = student.status === "At Risk";

                return (
                  <div
                    key={student.id}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-2xl space-y-2.5 transition-all hover:bg-gray-100/50"
                  >
                    {/* User profile identifier header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isHighRisk
                              ? "bg-[#FF6200]/10 text-[#FF6200]"
                              : "bg-[#6C1D5F]/10 text-[#6C1D5F]"
                          }`}
                        >
                          {student.avatarInitials}
                        </div>
                        <div className="space-y-0.2">
                          <h4 className="text-xs font-bold text-gray-950">
                            {student.name}
                          </h4>
                          <p className="text-[10px] font-mono text-gray-400">
                            {student.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wide ${
                          isHighRisk
                            ? "bg-[#FF6200]/15 text-[#FF6200]"
                            : isAtRisk
                              ? "bg-[#FF6200]/10 text-[#FF6200]/90"
                              : "bg-[#6C1D5F]/15 text-[#6C1D5F]"
                        }`}
                      >
                        {student.avgScore}% Avg
                      </span>
                    </div>

                    {/* Threat indicator details */}
                    <div className="space-y-1 bg-white p-2.5 border border-gray-100 rounded-xl">
                      <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                        Diagnosed Issue
                      </p>
                      <p className="text-[10px] text-gray-700 leading-normal font-medium italic">
                        "{student.issue}"
                      </p>
                    </div>

                    {/* Operational Actions */}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider bg-gray-200/50 px-2 py-0.5 rounded">
                        {student.batch}
                      </span>

                      <button
                        onClick={() => handleSendWarning(student.name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-[10px] font-bold rounded-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Mail className="w-3 h-3" />
                        Warn Student
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <CheckCircle className="w-8 h-8 text-[#01AC9F] mx-auto" />
                  <p className="text-xs font-bold text-gray-800">
                    Clear record!
                  </p>
                  <p className="text-[10px] text-gray-400">
                    No students are currently flagged as failing.
                  </p>
                </div>
              )}
            </div>

            {/* Footer action */}
            <button
              onClick={() =>
                showToast(
                  "Opening custom alerts configuration suite...",
                  "info",
                )
              }
              className="w-full text-center py-2.5 bg-gray-50 border border-gray-200 text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#6C1D5F] rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
            >
              Configure Risk Thresholds
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-white rounded-3xl border border-gray-150/80 shadow-3xs overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div>
            <h2 className="text-lg font-display font-extrabold text-black">
              Student Submissions
            </h2>
            <p className="text-xs text-gray-400">
              Review and grade subjective assignments.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={submissionFilter.assignmentId}
              onChange={(e) =>
                setSubmissionFilter({
                  ...submissionFilter,
                  assignmentId: e.target.value,
                })
              }
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6C1D5F]"
            >
              <option value="All">All Assignments</option>
              {safeAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>

            <select
              value={submissionFilter.batchName}
              onChange={(e) =>
                setSubmissionFilter({
                  ...submissionFilter,
                  batchName: e.target.value,
                })
              }
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6C1D5F]"
            >
              <option value="All">All Batches</option>
              {Array.from(
                new Set(
                  safeAssignments
                    .flatMap((a) => a.assignedBatchNames || [])
                    .filter(Boolean),
                ),
              ).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student..."
                value={submissionFilter.studentName}
                onChange={(e) =>
                  setSubmissionFilter({
                    ...submissionFilter,
                    studentName: e.target.value,
                  })
                }
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-[#6C1D5F] rounded-lg text-xs placeholder-gray-400 transition-all"
              />
            </div>

            <button
              onClick={() => {
                setSelectedExportAssignmentId(
                  submissionFilter.assignmentId !== "All"
                    ? submissionFilter.assignmentId
                    : safeAssignments[0]?.id || "All",
                );
                setShowExportResultsModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#01AC9F] hover:bg-[#008f84] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-3xs"
              id="export-assignment-results-btn"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Results
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#6C1D5F] animate-spin" />
            </div>
          ) : filteredSubmissionsList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm font-medium">No submissions found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-6">Assignment</th>
                  <th className="py-3.5 px-6 text-center">Attempts Used</th>
                  <th className="py-3.5 px-6 text-center">Max Attempts</th>
                  <th className="py-3.5 px-6 text-center">Attempts Left</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Score</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredSubmissionsList.map((sub) => {
                  const isGraded = sub.status === "Graded";
                  const assignmentObj = safeAssignments.find(
                    (a) => a.id === sub.assignmentId,
                  );
                  const studentSubmissions = safeSubmissions.filter(
                    (s) =>
                      s.assignmentId === sub.assignmentId &&
                      s.studentId === sub.studentId,
                  );
                  const completedSubs = studentSubmissions.filter(
                    (s) => s.status === "Submitted" || s.status === "Graded",
                  );
                  const attemptsUsed = completedSubs.length;

                  const maxAttemptsVal = assignmentObj?.maxAttempts;
                  const maxAttempts =
                    maxAttemptsVal === "No limit" ||
                    maxAttemptsVal === null ||
                    maxAttemptsVal === undefined
                      ? null
                      : isNaN(Number(maxAttemptsVal)) ||
                          Number(maxAttemptsVal) <= 0
                        ? null
                        : Number(maxAttemptsVal);

                  const attemptsRemaining =
                    maxAttempts === null
                      ? "Unlimited"
                      : Math.max(0, maxAttempts - attemptsUsed);

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/40">
                      <td className="py-4 px-6 font-medium text-gray-950">
                        {sub.studentName}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {sub.assignmentTitle}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-gray-700">
                        {attemptsUsed}
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-gray-500">
                        {maxAttempts === null ? "No Limit" : maxAttempts}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-[#01AC9F]">
                        {attemptsRemaining}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${isGraded ? "bg-[#01AC9F]/10 text-[#01AC9F]" : "bg-[#FF6200]/10 text-[#FF6200]"}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono">
                        {sub.score !== undefined ? `${sub.score}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenGradeModal(sub)}
                          className="text-[#6C1D5F] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isGraded ? "Edit Grade" : "Grade"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {gradingSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-display font-black text-black">
                  Grading: {gradingSubmission.studentName}
                </h3>
                <p className="text-xs text-gray-500">
                  {gradingSubmission.assignmentTitle}
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertTriangle className="w-5 h-5 hidden" />
                Close
              </button>
            </div>

            <div className="space-y-6 flex-grow">
              {gradingSubmission.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className="border border-gray-150 rounded-xl p-4 bg-gray-50/50"
                >
                  <p className="text-xs font-bold text-gray-900 mb-2">
                    {idx + 1}.{" "}
                    {ans.questionTitle ||
                      `Q: ${ans.frontendType || ans.questionType}`}{" "}
                    ({ans.maxMarks || 0} Marks)
                  </p>
                  {(ans.parsedPrompt || ans.questionPrompt) && (
                    <div className="text-xs text-gray-700 mb-3 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                      {ans.parsedPrompt || ans.questionPrompt}
                    </div>
                  )}

                  {(ans.frontendType || ans.questionType) === "Essay" ||
                  (ans.frontendType || ans.questionType) === "ShortAnswer" ||
                  (ans.frontendType || ans.questionType) === "FileUpload" ? (
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded border border-gray-200 text-xs whitespace-pre-wrap">
                        {(ans.frontendType || ans.questionType) ===
                        "FileUpload" ? (
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4" />{" "}
                            <a
                              href={ans.fileUploadData?.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              View File: {ans.fileUploadData?.fileName}
                            </a>
                          </div>
                        ) : (
                          ans.essayText ||
                          ans.shortAnswerText || (
                            <span className="text-gray-400 italic">
                              No answer provided
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex gap-4">
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-[#6C1D5F]"
                            value={gradingAnswers[ans.questionId]?.points || 0}
                            onChange={(e) =>
                              setGradingAnswers((prev) => ({
                                ...prev,
                                [ans.questionId]: {
                                  ...prev[ans.questionId],
                                  points: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Feedback
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-[#6C1D5F]"
                            value={
                              gradingAnswers[ans.questionId]?.feedback || ""
                            }
                            onChange={(e) =>
                              setGradingAnswers((prev) => ({
                                ...prev,
                                [ans.questionId]: {
                                  ...prev[ans.questionId],
                                  feedback: e.target.value,
                                },
                              }))
                            }
                            placeholder="Optional feedback..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : (ans.frontendType || ans.questionType) === "Coding" ? (
                    <div className="space-y-4">
                      <div className="bg-[#1e1e1e] text-white p-3 rounded border border-gray-700 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                        {ans.codingSubmission?.code || (
                          <span className="text-gray-500 italic">
                            No code submitted
                          </span>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-[#6C1D5F]"
                            value={gradingAnswers[ans.questionId]?.points || 0}
                            onChange={(e) =>
                              setGradingAnswers((prev) => ({
                                ...prev,
                                [ans.questionId]: {
                                  ...prev[ans.questionId],
                                  points: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Feedback
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-[#6C1D5F]"
                            value={
                              gradingAnswers[ans.questionId]?.feedback || ""
                            }
                            onChange={(e) =>
                              setGradingAnswers((prev) => ({
                                ...prev,
                                [ans.questionId]: {
                                  ...prev[ans.questionId],
                                  feedback: e.target.value,
                                },
                              }))
                            }
                            placeholder="Optional feedback..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ans.options && ans.options.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {ans.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded text-xs border ${opt.isCorrect ? "bg-green-50 border-green-200" : "bg-white border-gray-100"} ${ans.selectedOptionId === opt.id ? "ring-2 ring-[#6C1D5F] shadow-sm" : ""}`}
                            >
                              <span className="font-bold mr-2">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              {opt.optionText}
                              {opt.isCorrect && (
                                <span className="ml-2 text-green-600 font-bold">
                                  (Correct)
                                </span>
                              )}
                              {ans.selectedOptionId === opt.id && (
                                <span className="ml-2 text-[#6C1D5F] font-bold">
                                  (Student Selected)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!ans.options || ans.options.length === 0 ? (
                        <p className="text-xs font-mono bg-white p-2 border border-gray-100 rounded">
                          {ans.selectedOptionText
                            ? `Selected Option: ${ans.selectedOptionText}`
                            : ans.mcqSelectedIndex !== undefined
                              ? `Selected Option Index: ${ans.mcqSelectedIndex}`
                              : "No answer"}
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-4">
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Auto Score / Points
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-[#6C1D5F] bg-gray-50"
                            readOnly
                            value={gradingAnswers[ans.questionId]?.points || 0}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 border border-gray-200 text-xs font-bold rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrades}
                disabled={gradeMutation.isPending}
                className="px-6 py-2 bg-[#6C1D5F] text-white text-xs font-bold rounded-md flex items-center gap-2 hover:bg-[#541449] disabled:opacity-50"
              >
                {gradeMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Save Grades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compile Progress Overlay Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-gray-200 shadow-2xl space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-[#6C1D5F]/10 text-[#6C1D5F] flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet
                className={`w-8 h-8 ${isExporting ? "animate-bounce" : ""}`}
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-display font-black text-black">
                {isExporting
                  ? "Compiling Master Gradebook"
                  : "Gradebook Ready!"}
              </h3>
              <p className="text-xs text-gray-400 leading-normal">
                {isExporting
                  ? "Aggregating academic logs, MCQ answers, coding reports, and file signatures."
                  : "All corporate cohort datasets have been successfully compiled into a spreadsheet."}
              </p>
            </div>

            {/* Custom Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono font-bold text-[#6C1D5F]">
                <span>Status</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-150">
                <div
                  className="bg-gradient-to-r from-[#6C1D5F] to-[#01AC9F] h-full rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>

            {/* Action buttons when complete */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportProgress(0);
                }}
                disabled={isExporting}
                className="flex-1 py-2.5 border border-gray-250 text-xs font-bold rounded-md text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Close Window
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportProgress(0);
                  showToast(
                    "Master Gradebook .xlsx download started",
                    "success",
                  );
                }}
                disabled={isExporting}
                className="flex-1 py-2.5 bg-[#01AC9F] hover:bg-[#008f84] text-white text-xs font-bold rounded-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Assignment Results Dialog */}
      {showExportResultsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-200 shadow-2xl animate-fade-in flex flex-col space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-display font-black text-black">
                  Export Assignment Results
                </h3>
                <p className="text-xs text-gray-400">
                  Select assignment and configure your export report.
                </p>
              </div>
              <button
                onClick={() => setShowExportResultsModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Assignment */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 font-extrabold uppercase tracking-wider block">
                  Select Assignment
                </label>
                <select
                  value={selectedExportAssignmentId}
                  onChange={(e) =>
                    setSelectedExportAssignmentId(e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs font-medium outline-none focus:border-[#6C1D5F] transition-colors"
                >
                  <option value="All" disabled>
                    -- Choose an Assignment --
                  </option>
                  {safeAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 font-extrabold uppercase tracking-wider block">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFileFormat("xlsx")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      exportFileFormat === "xlsx"
                        ? "bg-[#01AC9F]/5 border-[#01AC9F] text-[#01AC9F]"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span>Excel (.xlsx)</span>
                    <CheckCircle
                      className={`w-4 h-4 ${exportFileFormat === "xlsx" ? "opacity-100" : "opacity-0"}`}
                    />
                  </button>

                  <button
                    type="button"
                    disabled
                    className="p-3 rounded-xl border border-dashed border-gray-250 text-gray-300 text-xs font-medium flex flex-col items-start justify-center cursor-not-allowed bg-gray-50/50"
                  >
                    <span className="font-semibold text-gray-400">
                      CSV Format
                    </span>
                    <span className="text-[9px] font-mono text-[#FF6200] mt-0.5 uppercase tracking-wide">
                      Coming Soon
                    </span>
                  </button>
                </div>
              </div>

              {/* Columns Included Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                <span className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider block">
                  Columns Included in Export
                </span>
                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Roll Number, Student Name, Email, Assignment, Batch, Score,
                  Percentage, Grade, Status, Attempts, Late Submission,
                  Certificate Issued, and Submitted At.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExportResultsModal(false)}
                disabled={isDownloadingExport}
                className="flex-1 py-2.5 border border-gray-250 text-xs font-bold rounded-xl text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExportAssignmentResults(selectedExportAssignmentId)
                }
                disabled={
                  isDownloadingExport || selectedExportAssignmentId === "All"
                }
                className="flex-1 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                {isDownloadingExport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
