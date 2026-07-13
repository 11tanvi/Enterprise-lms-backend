import React, { useState, useEffect } from "react";
import { X, CheckCircle, Users, Calendar, Award, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { assignmentService } from "../../assignments/api/assignmentService";
import { Course } from "../../../types";
import { useQueryClient } from "@tanstack/react-query";

interface BatchEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onEnrollmentSuccess?: () => void;
}

interface BatchInfo {
  id: string;
  name: string;
  schedule: string;
  trainer: string;
  capacity: string;
}

export const BatchEnrollmentModal: React.FC<BatchEnrollmentModalProps> = ({
  isOpen,
  onClose,
  course,
  onEnrollmentSuccess,
}) => {
  const { enrolledCourseIds, showToast } = useApp();
  const queryClient = useQueryClient();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<string[]>([]);

  // Load enrolled batches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("enrolled_batch_ids");
    if (saved) {
      try {
        setEnrolledBatchIds(JSON.parse(saved));
      } catch (e) {
        setEnrolledBatchIds([]);
      }
    }
  }, [isOpen]);

  if (!isOpen || !course) return null;

  // Determine available batch for this course
  const getBatchForCourse = (courseId: number | undefined): BatchInfo => {
    const idNum = courseId || 1;
    switch (idNum) {
      case 1:
        return {
          id: "batch-cyber-2024",
          name: "Cyber Cohort B",
          schedule: "Mon & Wed • 6:00 PM - 8:30 PM",
          trainer: "Dr. Catherine Vance",
          capacity: "42 / 50 Enrolled",
        };
      case 2:
        return {
          id: "batch-ldr-2024",
          name: "Leadership Cohort Alpha",
          schedule: "Tue & Thu • 4:00 PM - 6:00 PM",
          trainer: "Marcus Sterling (Executive Coach)",
          capacity: "18 / 25 Enrolled",
        };
      case 3:
        return {
          id: "batch-compliance-2024",
          name: "Compliance Group A",
          schedule: "Fridays • 9:00 AM - 12:00 PM",
          trainer: "Sarah Jenkins (JD)",
          capacity: "29 / 30 Enrolled",
        };
      default:
        return {
          id: `batch-custom-${idNum}-2024`,
          name: `${course.title.split(" ")[0] || "Custom"} Cohort A-24`,
          schedule: "Saturdays • 10:00 AM - 1:00 PM",
          trainer: "EduCorp Senior Faculty",
          capacity: "12 / 30 Enrolled",
        };
    }
  };

  const batch = getBatchForCourse(course.id);
  
  // Security Logic check: Ensure student is not already enrolled in this batch
  const isEnrolled = 
    (course.id !== undefined && enrolledCourseIds.includes(course.id)) ||
    enrolledBatchIds.includes(batch.id);

  const handleJoinBatch = async () => {
    if (isEnrolled) return;
    try {
      setIsEnrolling(true);
      
      // Trigger live POST /api/v1/students/batches/{batchId}/enroll
      await assignmentService.enrollInBatch(batch.id);
      
      // Update local storage explicitly
      const currentBatches = [...enrolledBatchIds, batch.id];
      setEnrolledBatchIds(currentBatches);
      localStorage.setItem("enrolled_batch_ids", JSON.stringify(currentBatches));

      // Invalidate react query cache so global enrollments state is updated
      await queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });

      showToast(`Successfully enrolled in ${batch.name}!`, "success");

      if (onEnrollmentSuccess) {
        onEnrollmentSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error("[BatchEnrollmentModal] Enrollment error:", error);
      showToast(error?.message || "Failed to join batch. Please try again.", "error");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      id="batch-enrollment-modal-overlay"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl overflow-hidden animate-scale-in"
        id="batch-enrollment-modal"
      >
        {/* Decorative Header Canvas */}
        <div className="bg-[#6C1D5F]/5 p-6 border-b border-gray-100 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-100 text-[#6C1D5F] text-[10px] font-mono font-bold uppercase rounded-full">
                <Sparkles className="w-3 h-3" />
                Enrollment Invitation
              </span>
              <h2 className="text-xl font-display font-extrabold text-black tracking-tight mt-1.5">
                {course.title}
              </h2>
              <p className="text-xs text-gray-400">
                LMS Enterprise Session • {course.duration || "Self-Paced"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Subtle Ambient Accent */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-[#01AC9F]/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Batch Information Card */}
          <div className="bg-slate-50 rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Available Batch Cohort
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-mono font-bold rounded-md border border-emerald-100">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-[#6C1D5F]/10 rounded-lg text-[#6C1D5F] mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">{batch.name}</h4>
                  <p className="text-xs text-gray-400">Batch Identifier: {batch.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-[#FF6200]/10 rounded-lg text-[#FF6200] mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black">Schedule</h4>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">{batch.schedule}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-[#01AC9F]/10 rounded-lg text-[#01AC9F] mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black">Faculty Trainer</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{batch.trainer}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200/50 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>Cohort Capacity</span>
              <span className="font-bold text-black">{batch.capacity}</span>
            </div>
          </div>

          {/* Enrollment Safeguard Notice / Status check */}
          {isEnrolled ? (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-800">Enrolled and Verified</h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed font-sans">
                  You are already enrolled in this batch! The curriculum, assignments, and testing consoles are active. Select this course from your student workspace to begin.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/40 border border-amber-100/80 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800">LMS Honor Code Policy</h4>
                <p className="text-xs text-amber-700/80 leading-relaxed font-sans">
                  Joining a batch logs an academic binding footprint. Inactive attendance or failure to submit labs within deadline matrices will flag administrative reports.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
            id="batch-enrollment-close-btn"
          >
            Cancel
          </button>
          
          {/* Security Logic: Only render Join button if not already enrolled */}
          {!isEnrolled ? (
            <button
              onClick={handleJoinBatch}
              disabled={isEnrolling}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              id="batch-enrollment-join-btn"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  Join Batch Cohort
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="px-5 py-2.5 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed"
              id="batch-enrollment-enrolled-btn"
            >
              Already Enrolled
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchEnrollmentModal;
