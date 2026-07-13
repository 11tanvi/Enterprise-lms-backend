import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Layers,
  ClipboardList,
  Users,
  Clock,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Bell,
  Grid,
  ChevronDown,
  ChevronRight,
  Download,
  Zap,
  Calendar,
  Eye,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  BarChart3, Edit3
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { useAuthenticatedQuery } from "../../api/useAuthenticatedQuery";
import { assignmentService } from "../../api/assignmentService";
import { useMemo } from "react";

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, currentUser, userRole } = useApp();
  
  // States for interactivity
  const [selectedCourse, setSelectedCourse] = useState("Advanced AI Ethics — Section B");
  const [statusFilter, setStatusFilter] = useState<"All" | "Graded" | "Pending" | "Overdue">("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  // Fetch assignments and submissions via authenticated query hooks
  const {
    data: allAssignments,
    isLoading: isAssignmentsLoading,
    error: assignmentsError,
  } = useAuthenticatedQuery<any[]>(
    () => assignmentService.getAssignments(),
    []
  );

  const {
    data: allSubmissions,
    isLoading: isSubmissionsLoading,
    error: submissionsError,
  } = useAuthenticatedQuery<any[]>(
    () => assignmentService.getSubmissions(),
    []
  );

  const isLoading = isAssignmentsLoading || isSubmissionsLoading;
  const isError = !!assignmentsError || !!submissionsError;

  // Recent Assignments Dynamic Stateful Data
  const recentAssignments = useMemo(() => {
    if (!allAssignments || !allSubmissions) return [];

    // Filter assignments by ownership if the logged-in user is a teacher
    const filteredAssignments = allAssignments.filter((a) => {
      if (userRole === "teacher") {
        return a.teacherId === currentUser?.id;
      }
      return true; // admin can see everything
    });

    return filteredAssignments.map((a) => {
      // Find submissions for this assignment
      const subs = allSubmissions.filter((s) => s.assignmentId === a.id);
      
      // Determine if there are pending (Submitted but not Graded) submissions
      const hasPending = subs.some((s) => s.status === "Submitted");

      const finalSubmitted = subs.length;

      // Status
      let status: "Graded" | "Pending" | "Overdue" = "Graded";
      if (hasPending) {
        status = "Pending";
      } else if (a.dueDate && new Date(a.dueDate) < new Date() && finalSubmitted === 0) {
        status = "Overdue";
      }

      return {
        id: a.id,
        name: a.title,
        type: a.questions?.[0] ? `${a.questions[0].type} Assessment` : "LMS Assessment Capsule",
        batch: a.assignedBatchNames?.join(", ") || "Cohort Alpha",
        submitted: finalSubmitted,
        total: 45, // Assuming 45 students per batch for UI sake since we don't have batch enrollment numbers easily accessible
        deadline: a.dueDate,
        status,
        color: status === "Graded" ? "emerald" : status === "Pending" ? "orange" : "red"
      };
    });
  }, [allAssignments, allSubmissions, currentUser, userRole]);

  // Dynamic Metrics
  const metrics = useMemo(() => {
    const totalAssignments = recentAssignments.length;
    const pendingReviews = recentAssignments.filter(a => a.status === "Pending").length;
    const gradedAssignments = recentAssignments.filter(a => a.status === "Graded").length;
    
    // Average score calculation
    let totalScore = 0;
    let totalMaxScore = 0;
    if (allSubmissions && allAssignments) {
        allSubmissions.forEach(sub => {
            const assignment = allAssignments.find(a => a.id === sub.assignmentId);
            if (assignment && sub.score !== undefined) {
               totalScore += sub.score;
               totalMaxScore += (assignment.totalMarks || 100);
            }
        });
    }
    const avgScoreStr = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) + "%" : "0%";

    return [
      {
        id: "metric-courses",
        label: "Active Courses",
        value: "12",
        icon: BookOpen,
        subtext: "+2 this month",
        trend: "up",
        color: "text-[#6C1D5F]",
        bgColor: "bg-[#6C1D5F]/5",
        borderColor: "border-[#6C1D5F]/10",
      },
      {
        id: "metric-batches",
        label: "Total Batches",
        value: "24",
        icon: Layers,
        subtext: "4 ending soon",
        trend: "neutral",
        color: "text-amber-600",
        bgColor: "bg-amber-500/5",
        borderColor: "border-amber-500/10",
      },
      {
        id: "metric-assignments",
        label: "Assignments",
        value: totalAssignments.toString(),
        icon: ClipboardList,
        subtext: "Total assigned",
        trend: "up",
        color: "text-[#6C1D5F]",
        bgColor: "bg-[#6C1D5F]/5",
        borderColor: "border-[#6C1D5F]/10",
      },
      {
        id: "metric-students",
        label: "Total Students",
        value: "1,204",
        icon: Users,
        subtext: "+48 new",
        trend: "up",
        color: "text-[#01AC9F]",
        bgColor: "bg-[#01AC9F]/5",
        borderColor: "border-[#01AC9F]/10",
      },
      {
        id: "metric-evaluation",
        label: "Pending Reviews",
        value: pendingReviews.toString(),
        icon: Clock,
        subtext: pendingReviews > 0 ? "Action required!" : "All caught up",
        trend: pendingReviews > 0 ? "alert" : "neutral",
        color: pendingReviews > 0 ? "text-[#FF6200]" : "text-emerald-600",
        bgColor: pendingReviews > 0 ? "bg-[#FF6200]/10" : "bg-emerald-500/10",
        borderColor: pendingReviews > 0 ? "border-[#FF6200]/20" : "border-emerald-500/20",
      },
      {
        id: "metric-average",
        label: "Average Score",
        value: avgScoreStr,
        icon: TrendingUp,
        subtext: "Overall average",
        trend: "up",
        color: "text-[#01AC9F]",
        bgColor: "bg-[#01AC9F]/5",
        borderColor: "border-[#01AC9F]/10",
      },
    ];
  }, [recentAssignments, allSubmissions, allAssignments]);

  // Activities feed
  const activityLogs = [
    { id: "act-1", type: "grade", text: "Sarah graded Quiz 4", time: "2 hours ago" },
    { id: "act-2", type: "enroll", text: "Michael R. enrolled in Section B", time: "5 hours ago" },
    { id: "act-3", type: "forum", text: "New message in Ethics Forum", time: "Yesterday" }
  ];

  const handleExportData = () => {
    setIsExporting(true);
    showToast("Compiling cohort evaluation logs...", "info");
    setTimeout(() => {
      setIsExporting(false);
      setShowExportToast(true);
      showToast("Report compiled successfully!", "success");
    }, 2000);
  };

  // Filter Table Row results based on filter buttons
  const filteredRows = recentAssignments.filter((asn) => {
    if (statusFilter === "All") return true;
    return asn.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-16 font-sans" id="teacher-portal-dashboard">
      
      {/* Header Bar Search & Selection Console */}
      <div className="bg-white border-b border-gray-150/60 py-3 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-3xs">
        
        {/* Search Input bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student profiles, assignments, batches..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-[#6C1D5F] focus:ring-4 focus:ring-[#6C1D5F]/5 rounded-xl text-xs text-gray-800 placeholder-gray-400 transition-all"
          />
        </div>

        {/* Dynamic selectors & actions */}
        <div className="flex items-center justify-end gap-4 w-full md:w-auto">
          {/* Course select dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                showToast(`Switched active context to ${e.target.value}`, "info");
              }}
              className="pl-3.5 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 appearance-none focus:outline-none focus:border-[#6C1D5F] transition-all cursor-pointer"
            >
              <option value="Advanced AI Ethics — Section B">Advanced AI Ethics — Section B</option>
              <option value="Modern Databases & PostgreSQL">Modern Databases & PostgreSQL</option>
              <option value="Enterprise Cloud Architecture">Enterprise Cloud Architecture</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          {/* Bell Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  showToast("Opening instructor notification queue", "info");
                }
              }}
              className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl relative text-gray-500 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6200]" />
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-gray-500">
                    Instructor Notifications
                  </h4>
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50 text-xs">
                  <div className="py-2.5 space-y-1">
                    <p className="font-bold text-gray-800">New batch submission alert</p>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      30/45 students from Section B completed "Ethical AI Principles Quiz".
                    </p>
                    <span className="text-[9px] font-mono text-gray-300">10 mins ago</span>
                  </div>
                  <div className="py-2.5 space-y-1">
                    <p className="font-bold text-gray-800">Sandboxed VM timeout flagged</p>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Michael R.'s runtime submission triggered a CPU throttling hazard.
                    </p>
                    <span className="text-[9px] font-mono text-gray-300">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Apps Layout Grid Button */}
          <button
            onClick={() => showToast("Opening workspace quick launcher", "info")}
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-500 transition-all cursor-pointer"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container Content */}
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 md:px-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150/40 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-display font-extrabold text-[#1b1c1c] tracking-tight leading-none">
              Instructor Overview
            </h1>
            <p className="text-xs text-[#5A5A5A] font-sans">
              Welcome back, Sarah. Here's what's happening across your courses today.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold rounded-lg text-gray-600 cursor-pointer shadow-3xs transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-gray-400" />
              {isExporting ? "Compiling..." : "Export Data"}
            </button>
            <button
              onClick={() => navigate("/teacher/create-assignment")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-md shadow-[#6C1D5F]/15"
            >
              <Plus className="w-4 h-4" />
              Quick Actions
            </button>
          </div>
        </div>

        {/* Bento Grid Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isAlert = metric.trend === "alert";

            return (
              <div
                key={metric.id}
                id={metric.id}
                className={`bg-white p-5 rounded-3xl border border-gray-150/80 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between ${
                  isAlert ? "ring-2 ring-offset-2 ring-[#FF6200]/25" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      {metric.label}
                    </span>
                    <div className={`p-1.5 rounded-lg ${metric.bgColor} ${metric.borderColor} border`}>
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-mono font-black text-[#1b1c1c] leading-none">
                    {metric.value}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                    isAlert ? "text-[#FF6200]" : "text-gray-400"
                  }`}>
                    {metric.subtext}
                  </span>
                  {metric.trend === "up" && (
                    <TrendingUp className="w-3.5 h-3.5 text-[#01AC9F]" />
                  )}
                  {isAlert && (
                    <AlertCircle className="w-3.5 h-3.5 text-[#FF6200]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Charts Section Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-grid">
          
          {/* Card 1: Assignment Completion Trends */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Performance
                </h4>
                <h3 className="text-base font-display font-extrabold text-[#1b1c1c] mt-0.5">
                  Assignment Completion Trends
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono font-bold text-gray-500">
                Last 30 Days
              </span>
            </div>

            {/* Premium Handcrafted Animated Bars Graph */}
            <div className="h-44 flex items-end justify-between gap-4 pt-4 border-b border-gray-100 pb-2 relative">
              <div className="absolute inset-x-0 top-6 bottom-4 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-dashed border-gray-400 w-full" />
                <div className="border-t border-dashed border-gray-400 w-full" />
              </div>

              {[
                { label: "WK 1", percentage: 45, submitted: 32 },
                { label: "WK 2", percentage: 65, submitted: 48 },
                { label: "WK 3", percentage: 55, submitted: 41 },
                { label: "WK 4", percentage: 78, submitted: 56 },
                { label: "WK 5", percentage: 92, submitted: 68 },
              ].map((bar, idx) => (
                <div key={idx} className="flex-grow flex flex-col items-center gap-2 h-full justify-end group relative">
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[9px] font-mono font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-30">
                    {bar.submitted} Submissions ({bar.percentage}%)
                  </div>

                  <div
                    className="w-10 bg-[#6C1D5F]/10 group-hover:bg-[#6C1D5F]/20 rounded-t-lg transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${bar.percentage}%` }}
                  >
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#6C1D5F] to-[#9e2e93] h-full transition-all" />
                  </div>
                  
                  <span className="text-[10px] font-mono font-bold text-gray-400 group-hover:text-gray-800 transition-colors">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6C1D5F]" /> Active Term</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#01AC9F]" /> Completed Releases</span>
            </div>
          </div>

          {/* Card 2: Student Performance Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Grading Scale
                </h4>
                <h3 className="text-base font-display font-extrabold text-[#1b1c1c] mt-0.5">
                  Student Performance
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#01AC9F]/10 text-[#01AC9F] rounded-lg text-[10px] font-mono font-bold">
                124 Cohorts Registered
              </span>
            </div>

            {/* Dynamic distribution checklist / bars */}
            <div className="space-y-4 pt-2">
              {[
                { grade: "Outstanding (90-100)", val: 42, colorBg: "bg-[#6C1D5F]" },
                { grade: "Good (75-89)", val: 38, colorBg: "bg-[#6C1D5F]/70" },
                { grade: "Average (60-74)", val: 15, colorBg: "bg-purple-300" },
                { grade: "Below Average (<60)", val: 5, colorBg: "bg-[#FF6200]" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span className="font-semibold">{item.grade}</span>
                    <span className="font-mono font-bold">{item.val}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${item.colorBg} h-full rounded-full transition-all duration-1000`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lower Row: Table & Sidebars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Assignments Table list */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150/80 shadow-3xs overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-display font-extrabold text-[#1b1c1c]">
                  Recent Assignments
                </h2>
                <p className="text-xs text-gray-400">Monitor status of release and active cohort response timelines.</p>
              </div>

              {/* Status Filters */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/50">
                {(["All", "Graded", "Pending", "Overdue"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      statusFilter === filter
                        ? "bg-white text-gray-800 shadow-3xs"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-6">Assignment Name</th>
                    <th className="py-3 px-6">Batch</th>
                    <th className="py-3 px-6">Submissions</th>
                    <th className="py-3 px-6">Deadline</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                        Loading live assignments and metrics...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#FF6200] font-mono text-xs">
                        Failed to load data. Please try again.
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                        No assignments found matching active criteria.
                      </td>
                    </tr>
                  ) : filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-950">{row.name}</p>
                          <p className="text-[10px] text-gray-400">{row.type}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-gray-500">
                        {row.batch}
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1.5 w-28">
                          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                            <span>{row.submitted}/{row.total}</span>
                            <span>{Math.round((row.submitted / row.total) * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.status === "Graded" 
                                  ? "bg-[#01AC9F]" 
                                  : row.status === "Pending" 
                                  ? "bg-[#6C1D5F]" 
                                  : "bg-[#FF6200]"
                              }`}
                              style={{ width: `${(row.submitted / row.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-400 font-medium">
                        {row.deadline}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          row.status === "Graded"
                            ? "bg-[#01AC9F]/10 text-[#01AC9F]"
                            : row.status === "Pending"
                            ? "bg-[#FF6200]/10 text-[#FF6200]"
                            : "bg-[#FF6200]/10 text-[#FF6200]"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex justify-end gap-3 items-center">
                        <button
                          onClick={() => navigate(`/teacher/edit-assignment/${row.id}`)}
                          className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => navigate('/teacher/reports')}
                          className={`text-xs font-bold ${
                            row.status === "Pending" 
                              ? "text-[#6C1D5F] hover:underline cursor-pointer" 
                              : "text-gray-400 hover:text-gray-700 cursor-pointer"
                          }`}
                        >
                          {row.status === "Pending" ? "Grade Now" : "View Grades"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column details list */}
          <div className="space-y-6">
            
            {/* Upcoming Deadlines */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Upcoming Deadlines
                </h3>
              </div>

              {/* No upcoming deadlines empty placeholder */}
              <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-3xs text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-800">All caught up!</h4>
                  <p className="text-[10px] text-gray-400 max-w-[180px] leading-tight">
                    No major deadlines for the next 48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150/80 shadow-3xs space-y-4">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Activity Feed
              </h3>

              <div className="space-y-4">
                {activityLogs.map((log, idx) => (
                  <div key={log.id} className="flex gap-3 relative">
                    {/* Vertical connector line */}
                    {idx < activityLogs.length - 1 && (
                      <div className="absolute top-5 left-2 w-[1px] bottom-[-20px] bg-gray-100" />
                    )}
                    
                    <div className="w-4 h-4 rounded-full bg-[#6C1D5F]/15 text-[#6C1D5F] flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6C1D5F]" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-700 font-medium leading-none">{log.text}</p>
                      <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Toast notification alert for Exports */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-white border border-gray-200 rounded-2xl p-4 shadow-xl z-50 flex gap-3.5 items-start animate-fade-in">
          <div className="p-2 bg-[#01AC9F]/10 rounded-xl text-[#01AC9F] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#1b1c1c]">Report Generated Successfully</h4>
            <p className="text-[10px] text-gray-400 leading-normal">
              The student performance PDF is ready to download.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button 
                onClick={() => {
                  setShowExportToast(false);
                  showToast("Starting PDF download stream", "success");
                }}
                className="text-[10px] font-bold text-[#6C1D5F] underline"
              >
                Download Now
              </button>
              <button 
                onClick={() => setShowExportToast(false)}
                className="text-[10px] font-medium text-gray-400 hover:text-gray-600"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button onClick={() => setShowExportToast(false)} className="text-gray-300 hover:text-gray-500 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
