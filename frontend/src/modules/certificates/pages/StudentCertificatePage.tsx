import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Award,
  ChevronLeft,
  Download,
  Printer,
  Loader2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useApp } from "../../../context/AppContext";
import { useStudentAssignments } from "../../assignments/hooks/useStudentAssignments";
import { assignmentService } from "../../assignments/api/assignmentService";
import { CertificateTemplate } from "../components/CertificateTemplate";
import { Assignment, Submission } from "../../assignments/types";

export const StudentCertificatePage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const {
    submissions,
    assignments,
    isLoading: isHooksLoading,
  } = useStudentAssignments();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [individualAssignment, setIndividualAssignment] =
    useState<Assignment | null>(null);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);

  // Find the target submission matching the ID from the route params
  const activeSubmission = useMemo(() => {
    if (!submissions || !submissionId) return null;
    return submissions.find((s) => s.id === submissionId);
  }, [submissions, submissionId]);

  // Retrieve matching assignment from cached assignments hook or fetch directly if needed
  const cachedAssignment = useMemo(() => {
    if (!activeSubmission || !assignments) return null;
    return assignments.find((a) => a.id === activeSubmission.assignmentId);
  }, [activeSubmission, assignments]);

  // Ensure high-fidelity assignment metadata is loaded (includes teacher name, passing marks etc.)
  useEffect(() => {
    if (
      activeSubmission &&
      !cachedAssignment &&
      !individualAssignment &&
      !isAssignmentLoading
    ) {
      setIsAssignmentLoading(true);
      assignmentService
        .getAssignmentById(activeSubmission.assignmentId)
        .then((data) => {
          setIndividualAssignment(data);
        })
        .catch((err) => {
          console.error("Failed to load assignment info directly:", err);
        })
        .finally(() => {
          setIsAssignmentLoading(false);
        });
    }
  }, [
    activeSubmission,
    cachedAssignment,
    individualAssignment,
    isAssignmentLoading,
  ]);

  const assignment = cachedAssignment || individualAssignment;
  const isLoading = isHooksLoading || isAssignmentLoading;

  // Determine certificate eligibility
  const eligibility = useMemo(() => {
    if (!activeSubmission || !assignment)
      return { eligible: false, message: "" };

    const isCertificateEnabled = !!assignment.enableCertificates;
    const isGraded = activeSubmission.status === "Graded";
    const passingMarks =
      assignment.passingMarks !== undefined && assignment.passingMarks !== null
        ? assignment.passingMarks
        : 40;
    const studentScore =
      activeSubmission.score !== undefined ? activeSubmission.score : 0;
    const isEligible =
      isCertificateEnabled && isGraded && studentScore >= passingMarks;

    let message = "";
    if (!isCertificateEnabled) {
      message =
        "Certificates have not been enabled for this assignment curriculum.";
    } else if (!isGraded) {
      message = "The evaluation of your submission is currently in progress.";
    } else if (studentScore < passingMarks) {
      const totalMarksValue = assignment.totalMarks || 100;
      const passingPercent = Math.round((passingMarks / totalMarksValue) * 100);
      message = `A minimum score of ${passingMarks} marks (${passingPercent}%) is required to earn this certificate. You secured ${studentScore} marks.`;
    }

    return { eligible: isEligible, message };
  }, [activeSubmission, assignment]);

  // Handle high-fidelity PDF export via direct DOM canvas capture
  const handleDownloadPDF = async () => {
    const element = document.getElementById("certificate-container");
    if (!element) {
      showToast("Certificate canvas not detected.", "error");
      return;
    }

    setIsGeneratingPdf(true);
    showToast("Compiling high-resolution vector PDF...", "info");

    const originalTransform = element.style.transform;
    const originalPosition = element.style.position;

    element.style.transform = "scale(1)";
    element.style.position = "static";

    try {
      // Create a crisp landscape PNG representation using direct style extraction
      const imgData = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2.0,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: 1123,
        height: 794,
      });

      element.style.transform = originalTransform;
      element.style.position = originalPosition;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST",
      );

      const fileName = `Certificate_${(activeSubmission?.studentName || "Student").replace(/\s+/g, "_")}_${(assignment?.title || "Course").replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
      showToast(
        "Certificate PDF generated and downloaded successfully.",
        "success",
      );
    } catch (error) {
      element.style.transform = originalTransform;
      element.style.position = originalPosition;
      console.error("PDF compiling failed:", error);
      showToast(
        "Failed to compile certificate PDF. Please try again or use Print.",
        "error",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Authenticating Credential...
        </p>
      </div>
    );
  }

  // Handle failure state (Submission not found)
  if (!activeSubmission) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight">
              Credential Not Found
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We were unable to locate any student submission records associated
              with this certificate reference ID.
            </p>
          </div>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle non-eligibility states safely
  if (!eligibility.eligible) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight">
              Certificate Ineligible
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {eligibility.message ||
                "You do not meet the criteria required to earn a certificate of achievement for this assignment."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate(`/student/result/${activeSubmission.assignmentId}`)
              }
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-md transition-all cursor-pointer"
            >
              Review Results
            </button>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Golden / silver / bronze computed details for credential matching
  const percentageScore =
    activeSubmission.percentage ||
    (activeSubmission.score && assignment
      ? (activeSubmission.score / assignment.totalMarks) * 100
      : 0);

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col"
      id="student-certificate-viewer"
    >
      {/* Custom print CSS for A4 Landscape viewport override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          #student-certificate-viewer {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #certificate-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white !important;
            z-index: 9999999 !important;
            display: block !important;
          }
          #certificate-print-area > div {
            width: 297mm !important;
            height: 210mm !important;
            display: block !important;
          }
          #certificate-container {
            width: 297mm !important;
            height: 210mm !important;
            min-width: 297mm !important;
            max-width: 297mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            transform: none !important;
            position: static !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* Persistent Fixed Header Actions Menu */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-6 flex items-center justify-between z-40 shadow-md h-16 sticky top-0">
        <button
          onClick={() =>
            navigate(`/student/result/${activeSubmission.assignmentId}`)
          }
          className="inline-flex items-center gap-2 hover:text-teal-400 font-medium transition-colors text-xs text-slate-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Results
        </button>

        <div className="text-center hidden sm:block">
          <h2 className="text-xs font-semibold tracking-wide text-white">
            {assignment?.courseTitle || "Course Certificate"}
          </h2>
          <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
            {assignment?.title || "Professional Credential"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md shadow-3xs cursor-pointer transition-all ${
              isGeneratingPdf
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-500 text-white"
            }`}
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isGeneratingPdf ? "Compiling PDF..." : "Download PDF"}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:text-white text-xs text-slate-300 font-semibold rounded-md shadow-3xs cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </header>

      {/* Main Certificate Display Canvas Area */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 bg-slate-950 overflow-hidden">
        <div className="w-full max-w-5xl flex justify-center bg-transparent relative">
          <CertificateTemplate
            studentName={activeSubmission.studentName}
            assignmentTitle={
              activeSubmission.assignmentTitle ||
              assignment?.title ||
              "Professional Lab"
            }
            courseTitle={assignment?.courseTitle || "Enterprise Curriculum"}
            teacherName={assignment?.teacherName || "Course Instructor"}
            obtainedMarks={activeSubmission.score || 0}
            totalMarks={
              activeSubmission.totalMarks || assignment?.totalMarks || 100
            }
            percentage={percentageScore}
            completionDate={activeSubmission.submittedAt}
            certificateId={activeSubmission.id}
            badgeImage={
              percentageScore >= 90
                ? "gold"
                : percentageScore >= 75
                  ? "silver"
                  : "bronze"
            }
            verificationUrl={`https://verify.xebia.com/${activeSubmission.id}`}
          />
        </div>
      </main>
    </div>
  );
};
