import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Calendar,
  CheckCircle,
  Award,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { Assignment } from "../../types";
import { AssignmentCard } from "../../shared/AssignmentCard";
import { useStudentAssignments } from "../../hooks/useStudentAssignments";
import { motion } from "motion/react";

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, enrolledCourseIds } = useApp();
  const studentId = Number(currentUser?.id);
  const [activeTab, setActiveTab] = useState<
    "Upcoming" | "Ongoing" | "Completed" | "Overdue"
  >("Ongoing");

  const { assignments, submissions, isLoading, isError, refreshAssignments } =
    useStudentAssignments();

  // Automatically refresh assignments and submissions when enrollment list updates
  useEffect(() => {
    refreshAssignments();
  }, [enrolledCourseIds]);

  const submissionMap = useMemo(() => {
    const map = new Map<string, string>();
    const studentId = Number(currentUser?.id);
    for (const sub of submissions) {
      if (Number(sub.studentId) === studentId) {
        map.set(`${sub.assignmentId}_${studentId}`, sub.status);
      }
    }
    return map;
  }, [submissions, currentUser]);

  const myAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const status = (a.status || "").toUpperCase();
      return (
        status === "PUBLISHED" || status === "CLOSED" || status === "AVAILABLE"
      );
    });
  }, [assignments]);

  const groupedAssignments = useMemo(() => {
    const upcoming: any[] = [];
    const ongoing: any[] = [];
    const completed: any[] = [];
    const overdue: any[] = [];

    const studentId = Number(currentUser?.id);

    for (const assignment of myAssignments) {
      let studentStatus = "Available";
      const subStatus = submissionMap.get(`${assignment.id}_${studentId}`);
      const isOverdue = assignment.dueDate
        ? new Date(assignment.dueDate) < new Date()
        : false;

      if (subStatus && subStatus !== "Pending") {
        studentStatus = subStatus; // "Submitted" or "Graded"
      } else if (isOverdue) {
        studentStatus = "Late";
      } else if (subStatus === "Pending") {
        studentStatus = "Pending";
      } else if (assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        if (dueDate.getTime() - now.getTime() > 7 * 24 * 60 * 60 * 1000) {
          studentStatus = "Upcoming";
        }
      }

      let cardStatus = assignment.status;
      if (studentStatus === "Submitted" || studentStatus === "Graded") {
        cardStatus = studentStatus;
      } else if (studentStatus === "Late") {
        cardStatus = assignment.allowLateSubmission ? "Late" : "Closed";
      } else if (studentStatus === "Pending") {
        cardStatus = "In Progress";
      }

      const assignedObj = {
        ...assignment,
        status: cardStatus,
        _studentStatus: studentStatus,
      };

      if (studentStatus === "Upcoming") {
        upcoming.push(assignedObj);
      } else if (studentStatus === "Submitted" || studentStatus === "Graded") {
        completed.push(assignedObj);
      } else if (studentStatus === "Late") {
        overdue.push(assignedObj);
      } else {
        ongoing.push(assignedObj);
      }
    }

    return {
      upcoming,
      ongoing,
      completed,
      overdue,
      total: myAssignments.length,
    };
  }, [myAssignments, submissionMap, currentUser]);

  const upcomingList = groupedAssignments.upcoming;
  const ongoingList = groupedAssignments.ongoing;
  const completedList = groupedAssignments.completed;
  const overdueList = groupedAssignments.overdue;
  const assignmentsWithStatusLength = groupedAssignments.total;

  const activeTabList = useMemo(() => {
    switch (activeTab) {
      case "Upcoming":
        return upcomingList;
      case "Ongoing":
        return ongoingList;
      case "Completed":
        return completedList;
      case "Overdue":
        return overdueList;
      default:
        return ongoingList;
    }
  }, [activeTab, upcomingList, ongoingList, completedList, overdueList]);

  const handleAssignmentAction = (assignment: any) => {
    if (
      assignment._studentStatus === "Submitted" ||
      assignment._studentStatus === "Graded"
    ) {
      navigate(`/student/result/${assignment.id}`);
    } else {
      navigate(`/student/assignment/${assignment.id}`);
    }
  };

  // Metrics configurations using precise ELS brand colors and icons
  const stats = [
    {
      label: "My Courses",
      value: String(enrolledCourseIds.length),
      icon: BookOpen,
      color: "text-[#6C1D5F]",
      bgColor: "bg-[#6C1D5F]/10",
    },
    {
      label: "Total Tasks",
      value: String(assignmentsWithStatusLength),
      icon: ClipboardList,
      color: "text-amber-600",
      bgColor: "bg-amber-600/10",
    },
    {
      label: "Upcoming",
      value: String(upcomingList.length),
      icon: Calendar,
      color: "text-[#FF6200]",
      bgColor: "bg-[#FF6200]/10",
    },
    {
      label: "Completed",
      value: String(completedList.length),
      icon: CheckCircle,
      color: "text-[#01AC9F]",
      bgColor: "bg-[#01AC9F]/10",
    },
    {
      label: "Certificates",
      value: "1",
      icon: Award,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const tabConfigs = [
    { id: "Upcoming", label: "Upcoming", count: upcomingList.length },
    { id: "Ongoing", label: "Ongoing", count: ongoingList.length },
    { id: "Completed", label: "Completed/Graded", count: completedList.length },
    { id: "Overdue", label: "Overdue", count: overdueList.length },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in" id="student-dashboard-page">
      {/* Welcome Hero Banner with ELS brand styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-[#6C1D5F]/5 p-8 rounded-3xl border border-[#6C1D5F]/10 shadow-xs relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-mono font-bold text-[#6C1D5F] uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-2xs border border-[#6C1D5F]/10">
            Student Portal Dashboard
          </span>
          <h1 className="text-3xl font-display font-extrabold text-black tracking-tight mt-1">
            Welcome back,{" "}
            <span className="text-[#6C1D5F]">
              {currentUser?.fullName || "Executive Learner"}
            </span>
            !
          </h1>
          <p className="text-sm font-sans text-[#5A5A5A] max-w-2xl">
            You have active courses with assignment criteria. Select an ongoing
            laboratory to start your assessment session, view real-time
            countdown alerts, or review graded performance sheets.
          </p>
        </div>
        <div className="shrink-0 relative z-10">
          <button
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#6C1D5F] hover:bg-[#541449] text-white text-sm font-semibold rounded-md shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Explore Course Catalog
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {/* Decorative ambient subtle circle */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#01AC9F]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* Statistics Bento Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-gray-100/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-300"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-extrabold text-gray-400 uppercase tracking-widest">
                  {stat.label}
                </span>
                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-mono font-black text-black leading-none">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignments Section Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100/80 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-50 pb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-black">
                  My Assignment Workspaces
                </h2>
                <p className="text-xs font-sans text-gray-400 mt-0.5">
                  Filter by timeline status and access active, completed, or
                  evaluation feedback panels.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#F7F8FC] border border-gray-100 rounded-lg text-xs font-mono font-bold text-[#5A5A5A]">
                {assignmentsWithStatusLength} Total Assignments
              </span>
            </div>

            {/* Premium Sliding Motion Tabs */}
            <div className="flex items-center gap-1 bg-[#F7F8FC] p-1 rounded-xl border border-gray-100 overflow-x-auto scrollbar-none">
              {tabConfigs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-2 px-3 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id
                      ? "text-white bg-[#6C1D5F] shadow-xs"
                      : "text-gray-400 hover:text-black"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Assignments List Grid */}
            <div className="space-y-4 pt-2">
              {isLoading ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl space-y-3 bg-[#F7F8FC]/50 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#6C1D5F] animate-spin mb-2" />
                  <div>
                    <h4 className="text-sm font-display font-bold text-black uppercase">
                      Loading Workspaces
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      Please wait while we fetch your active assignment
                      capsules.
                    </p>
                  </div>
                </div>
              ) : isError ? (
                <div className="text-center py-16 border border-dashed border-[#FF6200]/50 rounded-3xl space-y-3 bg-[#FF6200]/5 flex flex-col items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-[#FF6200] mb-2" />
                  <div>
                    <h4 className="text-sm font-display font-bold text-[#FF6200] uppercase">
                      Data Load Failed
                    </h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      There was a problem retrieving your assignments. Please
                      refresh or try again later.
                    </p>
                  </div>
                </div>
              ) : activeTabList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeTabList.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onAction={handleAssignmentAction}
                      actionText={
                        assignment._studentStatus === "Submitted" ||
                        assignment._studentStatus === "Graded"
                          ? assignment.showScoreImmediately === false &&
                            assignment._studentStatus === "Submitted"
                            ? "View Status"
                            : "View Performance"
                          : assignment._studentStatus === "Late" &&
                              !assignment.allowLateSubmission
                            ? "Closed"
                            : submissionMap.get(
                                  `${assignment.id}_${studentId}`,
                                ) === "Pending"
                              ? "Resume Attempt"
                              : "Start Assignment"
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl space-y-3 bg-[#F7F8FC]/50">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-bold text-black uppercase">
                      No Assignments Found
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      There are no assignments currently logged in the "
                      {activeTab}" status panel. Check other categories above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info & Achievements Column */}
        <div className="space-y-6">
          {/* Active Performance Widget */}
          <div className="bg-[#6C1D5F] text-white p-8 rounded-3xl shadow-md flex flex-col justify-between h-full min-h-[250px] relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-xs font-mono font-bold text-[#76f7e8] border border-white/10">
                <TrendingUp className="w-3.5 h-3.5" />
                Active Score Track
              </span>
              <h3 className="text-2xl font-display font-extrabold tracking-tight">
                92% Average Grade
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-sans">
                Excellent progression. Your last submitted assignment "Conflict
                Resolution Case Study" secured 46 out of 50 marks, placing you
                in the top 5% of Leadership Cohort Alpha. Keep up the high
                standard!
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 text-[10px] font-mono text-white/50 relative z-10">
              Assigned Batch: Leadership Cohort Alpha
            </div>
            {/* Ambient glows */}
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#01AC9F]/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          </div>

          {/* Guidelines / ELS Honor Code */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF6200]" />
              <h3 className="text-xs font-mono font-extrabold text-black uppercase tracking-wider">
                LMS Honor Code
              </h3>
            </div>
            <p className="text-xs font-sans text-[#5A5A5A] leading-relaxed">
              All active sessions are strictly regulated. Exiting the active
              test viewport, refreshing your laboratory client container, or
              copying scripting code will immediately flag telemetry logs for
              administrative evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
