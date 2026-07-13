import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Users,
  BookOpen,
  ChevronLeft,
  Search,
  Trash2,
  User,
  Plus,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  FileText,
  BarChart3,
  Mail,
  UserPlus,
  Loader2,
  X,
  Award,
  Download,
} from "lucide-react";
import { batchService } from "../api/batchService";
import { assignmentService } from "../../assignments/api/assignmentService";
import { useApp } from "../../../context/AppContext";
import { BatchStatusBadge } from "../components/BatchStatusBadge";

export const BatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "assignments" | "analytics"
  >("overview");

  // Search & Filtering
  const [studentSearch, setStudentSearch] = useState("");

  // Selected Student for details side panel
  const [selectedStudentId, setSelectedStudentId] = useState<
    number | string | null
  >(null);

  // Add Student modal state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState<string>("");

  // Export Batch Students State & Handler
  const [isExporting, setIsExporting] = useState(false);

  const handleExportStudents = async () => {
    if (!id) return;
    setIsExporting(true);
    showToast("Preparing your batch student export...", "info");
    try {
      const data = await batchService.exportStudents(id);
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const batchName = batch?.name || "Batch";
      const sanitizedName = batchName.replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `Batch_${sanitizedName}_Students.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast("Batch students exported successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to export batch students.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // 1. Fetch Batch Details
  const {
    data: batch,
    isLoading: isLoadingBatch,
    isError: isBatchError,
    refetch: refetchBatch,
  } = useQuery({
    queryKey: ["batch", id],
    queryFn: () => batchService.getById(id || ""),
    enabled: !!id,
    retry: 1,
  });

  // 2. Fetch Assignments list to filter for this batch
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => assignmentService.getAssignments(),
    retry: 1,
  });

  // 3. Fetch all active student users to choose from for enrolling
  const { data: availableStudents = [] } = useQuery({
    queryKey: ["students", "all"],
    queryFn: () => batchService.getStudentsByRole("STUDENT"),
    retry: 1,
  });

  // 4. Fetch students enrolled in this batch
  const {
    data: enrolledStudents = [],
    isLoading: isLoadingStudents,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["batchStudents", id],
    queryFn: () => batchService.getStudents(id || ""),
    enabled: !!id,
    retry: 1,
  });

  // Resolve Batch Students Objects
  const mappedEnrolledStudents = useMemo(() => {
    return enrolledStudents.map((s: any) => ({
      id: s.studentId,
      fullName: s.fullName,
      email: s.email,
      joinDate: s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : "N/A",
      status: s.enrollmentStatus || "Active",
      // Mock metrics for display in side panel:
      attendance: "95%",
      grade: "A",
      submissions: 10,
    }));
  }, [enrolledStudents]);

  // Add Student Mutation
  const addStudentMutation = useMutation({
    mutationFn: (studentId: string | number) =>
      batchService.addStudent(id || "", studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batchStudents", id] });
      queryClient.invalidateQueries({ queryKey: ["batch", id] });
      showToast("Student successfully enrolled in cohort!", "success");
      setIsAddStudentOpen(false);
      setNewStudentId("");
    },
    onError: (err: any) => {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to enroll student",
        "error",
      );
    },
  });

  // Remove Student Mutation
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string | number) =>
      batchService.removeStudent(id || "", studentId),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: ["batchStudents", id] });
      queryClient.invalidateQueries({ queryKey: ["batch", id] });
      if (
        selectedStudentId &&
        String(selectedStudentId) === String(studentId)
      ) {
        setSelectedStudentId(null);
      }
      showToast("Student successfully removed from roster.", "success");
    },
    onError: (err: any) => {
      showToast(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove student",
        "error",
      );
    },
  });

  // Filter students roster by search
  const filteredStudents = useMemo(() => {
    return mappedEnrolledStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase()),
    );
  }, [mappedEnrolledStudents, studentSearch]);

  // Filter assignments allocated to this batch or associated course
  const batchAssignments = useMemo(() => {
    if (!batch) return [];
    return assignments.filter(
      (asm) =>
        String(asm.id) === String(id) ||
        String(asm.courseId) === String(batch.courseId),
    );
  }, [assignments, batch, id]);

  // Resolve currently selected student details object
  const selectedStudentDetails = useMemo(() => {
    if (!selectedStudentId) return null;
    return (
      mappedEnrolledStudents.find(
        (s) => String(s.id) === String(selectedStudentId),
      ) || null
    );
  }, [mappedEnrolledStudents, selectedStudentId]);

  // Compute Timeline visual progress
  const timelineProgress = useMemo(() => {
    if (!batch?.startDate || !batch?.endDate) return 0;
    try {
      const start = new Date(batch.startDate).getTime();
      const end = new Date(batch.endDate).getTime();
      const now = new Date().getTime();
      if (now < start) return 0;
      if (now > end) return 100;
      return Math.round(((now - start) / (end - start)) * 100);
    } catch {
      return 45; // Default fallback
    }
  }, [batch]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!batch?.endDate) return "N/A";
    try {
      const end = new Date(batch.endDate).getTime();
      const now = new Date().getTime();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `${diffDays} days` : "Ended";
    } catch {
      return "N/A";
    }
  }, [batch]);

  if (isLoadingBatch) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] py-12"
        id="batch-details-loading"
      >
        <Loader2 className="h-10 w-10 animate-spin text-[#6C1D5F] mb-4" />
        <p className="text-sm font-medium text-[#6B7280]">
          Retrieving cohort metadata...
        </p>
      </div>
    );
  }

  if (isBatchError || !batch) {
    return (
      <div
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center"
        id="batch-details-error"
      >
        <AlertCircle className="mx-auto h-16 w-16 text-[#9CA3AF] mb-4" />
        <h3 className="text-xl font-semibold text-[#111827]">
          Failed to connect to backend service
        </h3>
        <p className="mt-2 text-sm text-[#6B7280] max-w-md mx-auto">
          We encountered an error retrieving details for Batch ID: "{id}".
          Please ensure the backend API server is fully running and active.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => navigate("/teacher/batches")}
            className="inline-flex w-full justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] sm:mt-0 sm:w-auto transition-all"
          >
            Go Back
          </button>
          <button
            onClick={() => refetchBatch()}
            className="inline-flex w-full justify-center rounded-xl bg-[#6C1D5F] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4A1E47] sm:ml-3 sm:w-auto disabled:opacity-50 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      id="batch-details-view"
    >
      {/* Back Navigation Header */}
      <div
        className="mb-6 flex items-center justify-between"
        id="back-navigation-container"
      >
        <button
          onClick={() => navigate("/teacher/batches")}
          className="inline-flex items-center text-sm font-medium text-[#6B7280] hover:text-[#374151] cursor-pointer"
          id="batch-details-back-btn"
        >
          <ChevronLeft className="mr-1 h-5 w-5" aria-hidden="true" />
          Back to Batches
        </button>
        <div className="text-xs font-semibold text-[#9CA3AF] font-mono">
          REF: BATCH-{batch.id}
        </div>
      </div>

      {/* Main Cohort Header Profile */}
      <div
        className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 mb-8"
        id="batch-profile-header-card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-[#E5E7EB]">
          <div className="space-y-2">
            <div className="flex items-center gap-x-3">
              <span className="inline-flex items-center rounded-full bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-medium text-[#6C1D5F] ring-1 ring-inset ring-[#6C1D5F]/10">
                {batch.batchCode || "CODE-PENDING"}
              </span>
              <BatchStatusBadge
                status={batch.isActive !== false ? "ACTIVE" : "INACTIVE"}
              />
            </div>
            <h1 className="text-4xl font-bold text-[#111827]">{batch.name}</h1>
            <p className="text-sm text-[#6B7280]">
              Primary Teacher:{" "}
              <strong className="text-[#374151]">
                {batch.teacherName || "Unassigned Teacher"}
              </strong>
            </p>
          </div>

          {/* Quick Stats Block */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                Roster Size
              </p>
              <p className="text-2xl font-bold text-[#111827] mt-1">
                {mappedEnrolledStudents.length}{" "}
                <span className="text-sm font-normal text-[#9CA3AF]">
                  / {batch.capacity || 30}
                </span>
              </p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                Time Progress
              </p>
              <p className="text-2xl font-bold text-[#6C1D5F] mt-1">
                {timelineProgress}%
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Progress Bar */}
        <div className="mt-6" id="cohort-timeline-progress-bar">
          <div className="flex justify-between items-center text-xs font-medium text-[#9CA3AF] mb-1.5">
            <span>
              Start:{" "}
              {batch.startDate
                ? new Date(batch.startDate).toLocaleDateString()
                : "N/A"}
            </span>
            <span className="font-semibold text-[#6C1D5F]">
              Timeline Elapsed
            </span>
            <span>
              End:{" "}
              {batch.endDate
                ? new Date(batch.endDate).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-[#6C1D5F] h-2 rounded-full transition-all duration-500"
              style={{ width: `${timelineProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Switcher Section */}
      <div className="border-b border-[#E5E7EB] mb-8" id="batch-details-tabs">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: "overview", label: "Overview", icon: BookOpen },
            { id: "students", label: "Students", icon: Users },
            { id: "assignments", label: "Assignments", icon: FileText },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm gap-2 cursor-pointer transition-all
                  ${
                    isSelected
                      ? "border-[#6C1D5F] text-[#6C1D5F]"
                      : "border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#E5E7EB]"
                  }
                `}
                id={`tab-btn-${tab.id}`}
              >
                <Icon
                  className={`h-5 w-5 ${isSelected ? "text-[#6C1D5F]" : "text-[#9CA3AF] group-hover:text-[#6B7280]"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels Contents */}
      <div className="space-y-8" id="batch-tab-panel-container">
        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn"
            id="overview-tab-panel"
          >
            {/* Stats Cards Section */}
            <div className="lg:col-span-2 space-y-8">
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                id="overview-stats-grid"
              >
                {/* Stat 1: Course Assigned */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                      Curriculum Program
                    </span>
                    <BookOpen className="h-5 w-5 text-[#6C1D5F]" />
                  </div>
                  <h4 className="text-base font-bold text-[#111827] line-clamp-2">
                    {batch.courseTitle || "Curriculum Not Assigned"}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    Active syllabus for current cohort
                  </p>
                </div>

                {/* Stat 2: Assignments Count */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                      Assignments Published
                    </span>
                    <FileText className="h-5 w-5 text-[#6C1D5F]" />
                  </div>
                  <h4 className="text-2xl font-bold text-[#111827]">
                    {batchAssignments.length}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    Evaluations dispatched to students
                  </p>
                </div>

                {/* Stat 3: Days Remaining */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                      Timeline Remaining
                    </span>
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-[#111827]">
                    {daysRemaining}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    Days left until cohort graduation
                  </p>
                </div>

                {/* Stat 4: Cohort Capacity Fill */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                      Roster Fill Rate
                    </span>
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-[#111827]">
                    {Math.round(
                      (mappedEnrolledStudents.length / (batch.capacity || 30)) *
                        100,
                    )}
                    %
                  </h4>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    Capacity threshold level allocation
                  </p>
                </div>
              </div>

              {/* Roster & Course Milestones Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <h3 className="text-base font-semibold leading-6 text-[#111827] mb-6">
                  Recent Cohort Activities
                </h3>

                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {[
                      {
                        id: 1,
                        type: "create",
                        title: "Batch Workspace Created",
                        desc: `Learning Workspace for batch "${batch.name}" was successfully bootstrapped.`,
                        date: "Today at 9:30 AM",
                        icon: CheckCircle,
                        color: "text-green-500 bg-green-50",
                      },
                      {
                        id: 2,
                        type: "syllabus",
                        title: "Curriculum Program Linked",
                        desc: `Assigned course "${batch.courseTitle || "Main syllabus"}" attached to workspace timeline.`,
                        date: "Yesterday at 4:15 PM",
                        icon: BookOpen,
                        color: "text-[#6C1D5F] bg-[#F6F8FC]",
                      },
                      {
                        id: 3,
                        type: "roster",
                        title: " Roster Initialized",
                        desc: `Pre-approved list of ${mappedEnrolledStudents.length} students synchronized with the batch.`,
                        date: "2 days ago",
                        icon: Users,
                        color: "text-[#6C1D5F] bg-[#F6F8FC]",
                      },
                    ].map((act, actIdx) => (
                      <li key={act.id}>
                        <div className="relative pb-8">
                          {actIdx !== 2 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${act.color}`}
                              >
                                <act.icon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-semibold text-[#111827]">
                                  {act.title}
                                </p>
                                <p className="text-xs text-[#6B7280] mt-1">
                                  {act.desc}
                                </p>
                              </div>
                              <div className="text-right text-xs whitespace-nowrap text-[#9CA3AF] font-medium">
                                <time>{act.date}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines Sidebar */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <h3 className="text-base font-semibold leading-6 text-[#111827] mb-4">
                  Upcoming Assessments
                </h3>

                {batchAssignments.length === 0 ? (
                  <div className="text-center py-8 text-[#9CA3AF]">
                    <FileText className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-xs font-medium">
                      No assigned evaluations found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batchAssignments.slice(0, 3).map((asm) => (
                      <div
                        key={asm.id}
                        className="p-4 rounded-xl bg-[#F6F8FC] border border-[#E5E7EB]"
                      >
                        <h4 className="text-sm font-semibold text-[#111827] truncate">
                          {asm.title}
                        </h4>
                        <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#9CA3AF]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            Due:{" "}
                            {asm.dueDate
                              ? new Date(asm.dueDate).toLocaleDateString()
                              : "No Due Date"}
                          </span>
                          <span className="text-[#6C1D5F]">
                            {asm.totalMarks} Marks
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STUDENTS TAB ==================== */}
        {activeTab === "students" && (
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn"
            id="students-tab-panel"
          >
            {/* Left Columns: Students Table */}
            <div
              className={`${selectedStudentId ? "lg:col-span-2" : "lg:col-span-3"} space-y-6`}
            >
              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
                <div className="relative flex-1 max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search
                      className="h-5 w-5 text-[#9CA3AF]"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search active roster by name or email..."
                    className="block w-full h-[44px] rounded-xl border border-transparent py-2 pl-10 text-[#111827] bg-[#F6F8FC] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200 sm:text-sm"
                    id="student-search-input"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportStudents}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center rounded-xl h-[44px] px-5 bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#D1D5DB] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    id="export-batch-students-btn"
                  >
                    {isExporting ? (
                      <Loader2 className="-ml-0.5 mr-1.5 h-4 w-4 animate-spin text-[#6C1D5F]" />
                    ) : (
                      <Download className="-ml-0.5 mr-1.5 h-4 w-4 text-[#6C1D5F]" />
                    )}
                    Export Students
                  </button>

                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl h-[44px] px-6 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white font-medium cursor-pointer"
                    id="add-roster-student-btn"
                  >
                    <UserPlus className="-ml-0.5 mr-1.5 h-4 w-4" />
                    Enroll Student
                  </button>
                </div>
              </div>

              {/* Roster List Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <table className="min-w-full divide-y divide-[#E5E7EB]">
                  <thead className="bg-[#F6F8FC]">
                    <tr>
                      <th
                        scope="col"
                        className="py-3 px-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                      >
                        Student
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                      >
                        Primary Curriculum
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                      >
                        Attendance
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                      >
                        Avg Grade
                      </th>
                      <th
                        scope="col"
                        className="relative py-3 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] bg-white">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-sm text-[#9CA3AF]"
                        >
                          <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                          No students found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const isSelected =
                          String(student.id) === String(selectedStudentId);
                        return (
                          <tr
                            key={student.id}
                            onClick={() =>
                              setSelectedStudentId(
                                isSelected ? null : student.id,
                              )
                            }
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-[#F6F8FC]/40" : "hover:bg-[#F6F8FC]/50"}`}
                          >
                            <td className="whitespace-nowrap py-4 px-4 text-sm">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-[#6C1D5F]/10 flex items-center justify-center text-[#6C1D5F] font-semibold text-sm">
                                  {student.fullName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-[#111827]">
                                    {student.fullName}
                                  </div>
                                  <div className="text-xs text-[#9CA3AF] font-medium">
                                    {student.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-[#6B7280] truncate max-w-[200px]">
                              {batch?.courseTitle || "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-[#6B7280]">
                              <span className="inline-flex items-center gap-1 font-medium">
                                <Activity className="h-3.5 w-3.5 text-green-500" />
                                {student.attendance}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20">
                                {student.grade}
                              </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      `Are you sure you want to dismiss ${student.fullName} from this cohort?`,
                                    )
                                  ) {
                                    removeStudentMutation.mutate(student.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Dismiss Student"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Student Details Drawer/Panel */}
            {selectedStudentId && selectedStudentDetails && (
              <div
                className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 space-y-6 self-start animate-slideLeft"
                id="student-details-drawer"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <h3 className="text-base font-bold text-[#111827]">
                    Roster Member Details
                  </h3>
                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="text-[#9CA3AF] hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 bg-[#6C1D5F]/10 rounded-full flex items-center justify-center text-[#6C1D5F] text-xl font-bold mx-auto">
                    {selectedStudentDetails.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#111827]">
                      {selectedStudentDetails.fullName}
                    </h4>
                    <p className="text-xs text-[#9CA3AF] font-medium">
                      {selectedStudentDetails.email}
                    </p>
                  </div>
                </div>

                {/* Extended Details metrics */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#F6F8FC] border border-[#E5E7EB]">
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase">
                      Enrollment Status
                    </p>
                    <p className="text-sm font-semibold text-green-600 mt-0.5">
                      Active Member
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase">
                      Joined Cohort
                    </p>
                    <p className="text-sm font-semibold text-[#111827] mt-0.5">
                      {selectedStudentDetails.joinDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase">
                      Class Attendance
                    </p>
                    <p className="text-sm font-semibold text-[#111827] mt-0.5">
                      {selectedStudentDetails.attendance}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase">
                      Current Grade
                    </p>
                    <p className="text-sm font-semibold text-[#111827] mt-0.5">
                      {selectedStudentDetails.grade}
                    </p>
                  </div>
                </div>

                {/* Submissions Activity logs */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Completed Assignments
                  </h5>
                  <div className="space-y-2">
                    {[
                      {
                        title: "Core Concepts Quiz",
                        score: "95/100",
                        date: "Yesterday",
                      },
                      {
                        title: "Practical Lab 1",
                        score: "18/20",
                        date: "4 days ago",
                      },
                    ].map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center text-xs p-2 bg-white rounded border border-[#E5E7EB]"
                      >
                        <div>
                          <p className="font-semibold text-[#111827] truncate max-w-[140px]">
                            {sub.title}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF]">
                            {sub.date}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-green-600">
                          {sub.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Communication triggers */}
                <div className="flex gap-3">
                  <a
                    href={`mailto:${selectedStudentDetails.email}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F6F8FC] px-4 py-2 text-xs font-semibold text-[#6C1D5F] ring-1 ring-inset border-[#E5E7EB] hover:bg-[#6C1D5F]/10"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Send Email
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ASSIGNMENTS TAB ==================== */}
        {activeTab === "assignments" && (
          <div className="space-y-6 animate-fadeIn" id="assignments-tab-panel">
            {/* Tab Header action bar */}
            <div className="flex justify-between items-center bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
              <div className="text-sm text-[#6B7280] font-medium">
                Allocated Evaluations:{" "}
                <strong className="text-[#6C1D5F]">
                  {batchAssignments.length} Assigned
                </strong>
              </div>
              <button
                onClick={() => navigate("/teacher/create-assignment")}
                className="inline-flex items-center rounded-xl h-[44px] px-6 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white font-medium transition-colors duration-200 cursor-pointer"
              >
                <Plus className="-ml-0.5 mr-1.5 h-4 w-4 text-white" />
                Dispatch Assignment
              </button>
            </div>

            {batchAssignments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
                <FileText className="mx-auto h-14 w-14 text-gray-300 mb-3" />
                <h4 className="text-base font-semibold text-[#111827]">
                  No active assignments allocated
                </h4>
                <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto mt-1">
                  Assignments mapped to this cohort or associated syllabus
                  curriculum will display here.
                </p>
                <button
                  onClick={() => navigate("/teacher/create-assignment")}
                  className="mt-4 inline-flex items-center rounded-xl bg-[#F6F8FC] px-4 py-2 text-xs font-semibold text-[#6C1D5F] ring-1 ring-inset border-[#E5E7EB] hover:bg-[#6C1D5F]/10 cursor-pointer"
                >
                  <Plus className="-ml-0.5 mr-1 h-3.5 w-3.5" />
                  Dispatch First Assignment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batchAssignments.map((asm) => (
                  <div
                    key={asm.id}
                    className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-[#F6F8FC] px-2 py-0.5 text-[10px] font-semibold text-[#6C1D5F] ring-1 ring-inset ring-[#6C1D5F]/10">
                          {asm.status || "Published"}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[#9CA3AF]">
                          ID: {asm.id}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#111827] line-clamp-1">
                        {asm.title}
                      </h4>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">
                        {asm.description || "No extended description provided."}
                      </p>
                    </div>

                    <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium text-[#9CA3AF]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due:{" "}
                          {asm.dueDate
                            ? new Date(asm.dueDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span className="flex items-center gap-1 text-[#374151]">
                          <Award className="h-3.5 w-3.5 text-[#6C1D5F]" />
                          Marks: {asm.totalMarks}
                        </span>
                      </div>

                      {asm.durationMinutes > 0 && (
                        <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase">
                          Limit Duration: {asm.durationMinutes} Minutes
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== ANALYTICS TAB ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-fadeIn" id="analytics-tab-panel">
            {/* Visual Charts placeholding panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plot 1: Grades distribution */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-[#111827]">
                      Class Grade Profile
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Average cohort score compared to baseline targets
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-[#6C1D5F]" />
                </div>

                {/* SVG Visual Bar Chart */}
                <div
                  className="h-60 flex items-end justify-between px-4 pb-4 border-b border-l border-[#E5E7EB] relative"
                  id="grades-profile-chart"
                >
                  {/* Grid Lines */}
                  <div className="absolute left-0 right-0 top-1/4 h-px border-t border-dashed border-[#E5E7EB] pointer-events-none" />
                  <div className="absolute left-0 right-0 top-2/4 h-px border-t border-dashed border-[#E5E7EB] pointer-events-none" />
                  <div className="absolute left-0 right-0 top-3/4 h-px border-t border-dashed border-[#E5E7EB] pointer-events-none" />

                  {[
                    { label: "Week 1", val: 55, height: "h-[55%]" },
                    { label: "Week 2", val: 68, height: "h-[68%]" },
                    { label: "Week 3", val: 74, height: "h-[74%]" },
                    { label: "Week 4", val: 88, height: "h-[88%]" },
                    { label: "Week 5", val: 82, height: "h-[82%]" },
                  ].map((bar, bIdx) => (
                    <div
                      key={bIdx}
                      className="flex flex-col items-center gap-2 w-12 z-10"
                    >
                      <span className="text-[10px] font-bold text-[#6C1D5F]">
                        {bar.val}%
                      </span>
                      <div
                        className={`w-8 rounded-t bg-[#6C1D5F] hover:bg-[#4A1E47] ${bar.height} transition-all duration-500`}
                      />
                      <span className="text-[10px] text-[#9CA3AF] font-semibold">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plot 2: Submissions Tracker */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-[#111827]">
                      Submission Engagement Rate
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Average turn-in rates for dispatched assessments
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-[#6C1D5F]" />
                </div>

                {/* SVG Visual Line Chart */}
                <div
                  className="h-60 flex flex-col justify-between"
                  id="submission-rate-chart"
                >
                  <div className="flex-1 relative flex items-end">
                    <svg
                      className="w-full h-full absolute inset-0 overflow-visible"
                      preserveAspectRatio="none"
                    >
                      {/* Grid Lines */}
                      <line
                        x1="0"
                        y1="25%"
                        x2="100%"
                        y2="25%"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className="dark:stroke-gray-800"
                      />
                      <line
                        x1="0"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className="dark:stroke-gray-800"
                      />
                      <line
                        x1="0"
                        y1="75%"
                        x2="100%"
                        y2="75%"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className="dark:stroke-gray-800"
                      />

                      {/* Area and Line */}
                      <path
                        d="M0 120 C 40 100, 80 40, 120 60 S 200 10, 240 20 S 320 50, 400 10"
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        className="w-full"
                      />
                    </svg>

                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[10px] text-[#9CA3AF] font-semibold">
                      <span>Quiz 1</span>
                      <span>Quiz 2</span>
                      <span>Lab 1</span>
                      <span>Midterm</span>
                      <span>Quiz 3</span>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div className="flex justify-around items-center pt-4 border-t border-[#E5E7EB] text-xs mt-2">
                    <div className="text-center">
                      <p className="text-[#9CA3AF] font-medium">
                        On-Time Submissions
                      </p>
                      <p className="text-lg font-bold text-[#111827] mt-0.5">
                        94.2%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#9CA3AF] font-medium">
                        Resubmissions
                      </p>
                      <p className="text-lg font-bold text-[#111827] mt-0.5">
                        5.8%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== ENROLL STUDENT MODAL ==================== */}
      {isAddStudentOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          id="enroll-student-modal"
        >
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsAddStudentOpen(false)}
            ></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
              <div className="bg-white px-6 pb-6 pt-6 sm:p-8">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E5E7EB]">
                  <h3 className="text-xl font-semibold text-[#111827]">
                    Enroll Member
                  </h3>
                  <button
                    onClick={() => setIsAddStudentOpen(false)}
                    className="text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-[#6B7280]">
                    Select a registered student from the enterprise directory to
                    enroll in this learning cohort.
                  </p>

                  <div>
                    <label
                      htmlFor="student-selector-dropdown"
                      className="block text-xs font-semibold text-[#9CA3AF] uppercase"
                    >
                      Available Students
                    </label>
                    <select
                      id="student-selector-dropdown"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      className="mt-2 block w-full h-[44px] rounded-xl border border-transparent py-2 px-3 text-[#111827] bg-[#F6F8FC] focus:ring-2 focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200 sm:text-sm"
                    >
                      <option value="">Select a student...</option>
                      {availableStudents
                        .filter(
                          (student) =>
                            !mappedEnrolledStudents.some(
                              (es: any) => String(es.id) === String(student.id),
                            ),
                        )
                        .map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} ({student.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#F6F8FC] px-6 py-4 sm:flex sm:flex-row-reverse border-t border-[#E5E7EB]">
                <button
                  type="button"
                  disabled={!newStudentId || addStudentMutation.isPending}
                  onClick={() => addStudentMutation.mutate(newStudentId)}
                  className="inline-flex w-full justify-center rounded-xl h-[44px] px-6 bg-[#6C1D5F] hover:bg-[#4A1E47] sm:ml-3 sm:w-auto disabled:opacity-50 cursor-pointer"
                >
                  {addStudentMutation.isPending
                    ? "Enrolling..."
                    : "Confirm Enrollment"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] sm:mt-0 sm:w-auto transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetails;
