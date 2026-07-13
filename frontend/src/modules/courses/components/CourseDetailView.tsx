import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import curriculumService from "../../../services/curriculumService";
import contentService from "../../../services/contentService"; // <-- ADDED: For fetching content blocks
import enrollmentService from "../../../services/enrollmentService";
import courseService from "../../../services/courseService";
import categoryService from "../../../services/categoryService";
import {
  ArrowLeft,
  Clock,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Play,
  FileText,
  Sparkles,
  Users,
  Globe2,
  CheckCircle2,
  Lock,
  Loader2,
  Code as CodeIcon,
  Video as VideoIcon,
  Image as ImageIcon,
  Paperclip,
  Download,
  AlertCircle,
  Heading,
  Lightbulb,
} from "lucide-react";
import { Module, ContentBlock, Course } from "../../../types";

export const CourseDetailView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedCourseId = id ? parseInt(id, 10) : null;

  const { showToast, userRole, enrolledCourseIds } = useApp();

  const { data: courses = [] } = useQuery<Course[], Error>({
    queryKey: ["courses", userRole],
    queryFn: () => courseService.getAll(userRole),
  });

  const { data: categories = [] } = useQuery<any[], Error>({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });

  const { data: realModules = [], isLoading: isLoadingModules } = useQuery<
    Module[],
    Error
  >({
    // Include userRole in the key so switching roles doesn't reuse a
    // response fetched from the other endpoint.
    queryKey: ["curriculum", selectedCourseId, userRole],
    // Admins use the ROLE_ADMIN-guarded admin endpoint (full authoring data).
    // Students/anonymous use the public learner-facing endpoint - calling the
    // admin endpoint as a student returns 403 and an empty module list.
    queryFn: () =>
      userRole === "admin"
        ? curriculumService.getCourseCurriculum(selectedCourseId!)
        : curriculumService.getPublicCourseCurriculum(selectedCourseId!),
    enabled: !!selectedCourseId,
  });

  const queryClient = useQueryClient();
  const enrollMutation = useMutation<any, any, number>({
    mutationFn: (courseId: number) => enrollmentService.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      queryClient.invalidateQueries({
        queryKey: ["curriculum", selectedCourseId],
      });
      setIsEnrolled(true);
      setShowConfetti(true);
      showToast(
        `Successfully enrolled in ${course?.title || "the course"}!`,
        "success",
      );
      setTimeout(() => setShowConfetti(false), 4000);
    },
    onError: (error: any) => {
      console.error("Enrollment error:", error);
      let message = error.message || "An unexpected error occurred.";
      if (error.status === 401) {
        message = "Unauthorized. Please log in to enroll.";
      } else if (error.status === 403) {
        message =
          "Forbidden. You do not have permission to enroll in this course.";
      } else if (error.status === 404) {
        message = "Course not found.";
      } else if (error.status === 409) {
        message = "Conflict. You are already enrolled in this course.";
      } else if (error.status === 500) {
        message = "Internal Server Error. Please try again later.";
      }
      showToast(message, "error");
    },
  });

  const course = useMemo(() => {
    const baseCourse =
      courses.find((c) => c.id === selectedCourseId) || courses[0];
    if (!baseCourse) return null;

    const parentCategory = categories?.find(
      (cat) =>
        cat.id === baseCourse.categoryId ||
        (baseCourse.category &&
          cat.name.toLowerCase() === baseCourse.category?.toLowerCase()),
    );

    return {
      ...baseCourse,
      categoryColor: parentCategory?.color || "#6C1D5F",
      categoryIcon: parentCategory?.icon || "📚",
      categoryName:
        parentCategory?.name || baseCourse.category || "Uncategorized",
    };
  }, [courses, categories, selectedCourseId]);

  const [expandedModules, setExpandedModules] = useState<
    Record<number, boolean>
  >({});
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<
    Record<number, boolean>
  >({});
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (userRole === "admin") {
      setIsEnrolled(true);
    } else if (selectedCourseId) {
      setIsEnrolled(enrolledCourseIds.includes(selectedCourseId));
    }
  }, [userRole, enrolledCourseIds, selectedCourseId]);

  useEffect(() => {
    if (realModules.length > 0 && Object.keys(expandedModules).length === 0) {
      const initial: Record<number, boolean> = {};
      realModules.forEach((mod, index) => {
        if (mod.id !== undefined) initial[mod.id] = index === 0;
      });
      setExpandedModules(initial);
    }
  }, [realModules]);

  if (!course) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-gray-100 max-w-md mx-auto my-12 shadow-sm">
        <BookOpen className="w-12 h-12 text-[#510047] opacity-20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800">No course selected</h3>
        <button
          onClick={() => navigate("/courses")}
          className="mt-4 px-4 py-2 bg-[#01AC9F] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleEnroll = () => {
    if (selectedCourseId) {
      enrollMutation.mutate(selectedCourseId);
    }
  };

  const handleContinueLearning = () => {
    const element = document.getElementById("syllabus-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleLessonComplete = (lessonId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowComplete = !completedLessons[lessonId];
    setCompletedLessons((prev) => ({ ...prev, [lessonId]: isNowComplete }));
    if (isNowComplete) showToast("Lesson marked as completed!", "info");
  };

  const totalLessonsCount = realModules.reduce(
    (acc, mod) => acc + (mod.submodules?.length || 0),
    0,
  );
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const levelStr =
    (course.difficulty as string) || (course.level as string) || "Beginner";

  let levelBadgeColor = "bg-[#01AC9F]";
  if (levelStr === "Intermediate") levelBadgeColor = "bg-[#6C1D5F]";
  else if (levelStr === "Advanced") levelBadgeColor = "bg-[#FF6200]";
  else if (levelStr === "Expert") levelBadgeColor = "bg-[#4A1E47]";

  return (
    <div className="pb-24 animate-fade-in space-y-8 max-w-6xl mx-auto">
      {/* Confetti Banner */}
      {showConfetti && (
        <div className="bg-[#01AC9F] text-white px-6 py-4 rounded-3xl shadow-md flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-extrabold text-sm tracking-tight">
                Congratulations! You are officially enrolled.
              </p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-[#76f7e8] animate-pulse shrink-0" />
        </div>
      )}

      {/* Hero Header Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate("/courses")}
          className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 text-xs font-bold text-[#510047] hover:bg-gray-50 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />{" "}
          Back to Course Catalog
        </button>
        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest self-start sm:self-auto pl-1 sm:pl-0">
          Course ID: {course.id}
        </span>
      </div>

      {/* Hero Cover Section */}
      <div
        className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-0 relative"
        style={{ borderTop: `4px solid ${course.categoryColor}` }}
      >
        <div className="p-5 sm:p-8 lg:p-12 lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md text-white shadow-sm ${levelBadgeColor}`}
              >
                {levelStr}
              </span>
              <span
                style={{
                  backgroundColor: `${course.categoryColor}26`,
                  color: course.categoryColor,
                  border: `1px solid ${course.categoryColor}40`,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
              >
                <span className="text-xs leading-none">
                  {course.categoryIcon}
                </span>
                <span>{course.categoryName}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-[#000000] tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl">
              {course.description ||
                course.shortDescription ||
                "No overview provided."}
            </p>
          </div>

          <div className="pt-6 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Duration
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-[#510047] font-bold text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-[#01AC9F]" />
                  <span>{course.duration || "Self-Paced"}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Curriculum
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-[#510047] font-bold text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 text-[#01AC9F]" />
                  <span>{realModules.length} Modules</span>
                </div>
              </div>
            </div>

            {isEnrolled ? (
              <button
                onClick={handleContinueLearning}
                style={{ backgroundColor: course.categoryColor }}
                className="px-6 sm:px-8 py-3 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:opacity-90 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
              >
                Continue Learning
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                style={{
                  backgroundColor: course.categoryColor,
                  opacity: enrollMutation.isPending ? 0.7 : 1,
                }}
                className="px-6 sm:px-8 py-3 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:opacity-90 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
              >
                {enrollMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enrolling...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin-slow" /> Enroll &
                    Start Learning
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="h-48 sm:h-64 lg:h-auto lg:col-span-5 relative overflow-hidden bg-gray-900">
          <img
            src={
              course.thumbnailUrl ||
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=70"
            }
            alt={course.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Syllabus Accordion */}
          <div className="space-y-4">
            <h3
              id="syllabus-section"
              className="text-lg font-bold text-[#510047] flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5 text-[#01AC9F]" /> Interactive
              Curriculum Syllabus
            </h3>

            {isLoadingModules ? (
              <div className="py-12 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 text-[#01AC9F] animate-spin mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Syncing Course Curriculum...
                </p>
              </div>
            ) : realModules.length === 0 ? (
              <div className="py-12 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-center px-6">
                <FileText className="w-10 h-10 text-gray-300 mb-3" />
                <h4 className="text-sm font-bold text-gray-700">
                  No Curriculum Uploaded Yet
                </h4>
                <p className="text-xs mt-1">
                  The instructor has not added any modules or lessons to this
                  course.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {realModules.map((mod, modIdx) => {
                  const isOpen =
                    mod.id !== undefined ? !!expandedModules[mod.id] : false;
                  const moduleNumber = modIdx + 1;

                  return (
                    <div
                      key={mod.id ?? `mod-${modIdx}`}
                      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? "border-[#ffd7f0] shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          mod.id !== undefined && toggleModule(mod.id)
                        }
                        className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-4 select-none focus:outline-none"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${isOpen ? "bg-[#510047] text-white" : "bg-gray-50 text-gray-500"}`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                              Mod
                            </span>
                            <span className="text-base mt-0.5 leading-none">
                              {moduleNumber}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#510047] group-hover:text-[#01AC9F] transition-colors">
                              {mod.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              {mod.submodules?.length || 0} nested submodules
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${isOpen ? "bg-[#ffd7f0]/40 text-[#510047]" : "bg-gray-50 text-gray-400"}`}
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-50 bg-[#faf8f6]/40 divide-y divide-gray-50">
                          {mod.submodules && mod.submodules.length > 0 ? (
                            mod.submodules.map((sub, subIdx) => {
                              const subNumberStr = `${moduleNumber}.${subIdx + 1}`;
                              const isLessonDone =
                                sub.id !== undefined
                                  ? !!completedLessons[sub.id]
                                  : false;

                              return (
                                <div
                                  key={sub.id ?? `sub-${subIdx}`}
                                  className="p-4 sm:p-6 hover:bg-white transition-colors duration-150 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                                >
                                  <div className="flex items-start gap-3 w-full">
                                    <span className="text-xs font-mono font-black text-[#01AC9F] bg-[#01AC9F]/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                                      {subNumberStr}
                                    </span>
                                    <div className="w-full min-w-0">
                                      <h5 className="font-semibold text-xs text-gray-800 flex items-center gap-2">
                                        {sub.title}
                                      </h5>
                                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                        {sub.description ||
                                          "Explore syllabus details for this section."}
                                      </p>

                                      {/* 🚨 THE FIX: Enterprise Lazy-Loading Content Renderer */}
                                      {isEnrolled && sub.id !== undefined && (
                                        <LessonContentRenderer
                                          submoduleId={sub.id}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex flex-col items-start sm:items-end gap-2.5 w-full sm:w-auto pl-8 sm:pl-0">
                                    {isEnrolled ? (
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          sub.id !== undefined &&
                                          toggleLessonComplete(sub.id, e)
                                        }
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all w-full sm:w-auto justify-center cursor-pointer ${isLessonDone ? "bg-emerald-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-[#01AC9F] hover:text-[#01AC9F]"}`}
                                      >
                                        {isLessonDone ? (
                                          <>
                                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Completed</span>
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-3 h-3 text-[#01AC9F] shrink-0" />
                                            <span>Complete Lesson</span>
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg select-none w-full sm:w-auto">
                                        <Lock className="w-3 h-3 shrink-0" />{" "}
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 text-center text-xs text-gray-400">
                              No detailed submodules configured for this module.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-[#510047] uppercase tracking-wider">
              Information Matrix
            </h4>
            <div className="space-y-3.5 divide-y divide-gray-50 text-xs">
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Format</span>
                <span className="font-bold text-gray-700">
                  Self-paced Online
                </span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-400">Total Lessons</span>
                <span className="font-bold text-gray-700">
                  {totalLessonsCount} Submodules
                </span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-400">Skill Level</span>
                <span className="font-bold text-gray-700">{levelStr}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 🚨 NEW LAZY-LOADING COMPONENT FOR CONTENT BLOCKS
// ============================================================================
const LessonContentRenderer: React.FC<{ submoduleId: number }> = ({
  submoduleId,
}) => {
  const { userRole } = useApp();
  const {
    data: blocks = [],
    isLoading,
    isError,
    error,
  } = useQuery<ContentBlock[], Error>({
    // Include userRole in the key so switching roles doesn't reuse a
    // response fetched from the other endpoint.
    queryKey: ["submoduleContents", submoduleId, userRole],
    // Admins use the ROLE_ADMIN-guarded admin endpoint; students use the
    // public learner-facing endpoint (the admin one 403s for students, which
    // was the root cause of "Continue Learning" showing 0 content).
    queryFn: () =>
      userRole === "admin"
        ? contentService.getContentBySubmodule(submoduleId)
        : contentService.getPublicContentBySubmodule(submoduleId),
  });

  if (isLoading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#01AC9F]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching lesson
        blocks...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-500">
        <AlertCircle className="w-3.5 h-3.5" />
        {error?.message || "Failed to load lesson content."}
      </div>
    );
  }

  if (blocks.length === 0) return null;

  const sortedBlocks = [...blocks].sort(
    (a, b) => (a.contentOrder ?? 0) - (b.contentOrder ?? 0),
  );

  return (
    <div className="mt-5 space-y-4 pr-4 animate-fade-in">
      {sortedBlocks.map((block, bIdx) => (
        <div
          key={block.id ?? bIdx}
          className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm"
        >
          {/* Content Block Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            {block.type === "text" && (
              <FileText className="w-3.5 h-3.5 text-gray-400" />
            )}
            {block.type === "code" && (
              <CodeIcon className="w-3.5 h-3.5 text-indigo-400" />
            )}
            {block.type === "video" && (
              <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
            )}
            {block.type === "image" && (
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            )}
            {block.type === "file" && (
              <Paperclip className="w-3.5 h-3.5 text-sky-400" />
            )}
            {block.type === "heading" && (
              <Heading className="w-3.5 h-3.5 text-purple-400" />
            )}
            {block.type === "callout" && (
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              {block.type} Block
            </span>
          </div>

          {/* Text Block */}
          {block.type === "text" && (
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
              {block.text || block.value}
            </p>
          )}

          {/* Heading Block */}
          {block.type === "heading" && (
            <div className="text-gray-900 font-bold tracking-tight">
              {block.headingLevel === 1 ? (
                <h1 className="text-base font-extrabold text-[#510047]">
                  {block.value || block.text || block.title}
                </h1>
              ) : block.headingLevel === 2 ? (
                <h2 className="text-sm font-bold text-gray-900">
                  {block.value || block.text || block.title}
                </h2>
              ) : (
                <h3 className="text-xs font-semibold text-gray-800">
                  {block.value || block.text || block.title}
                </h3>
              )}
            </div>
          )}

          {/* Callout Block */}
          {block.type === "callout" && (
            <div
              className={`p-3.5 rounded-lg border flex items-start gap-2.5 ${
                block.metadata?.calloutType === "warning"
                  ? "bg-amber-50/70 border-amber-200/60 text-amber-900"
                  : block.metadata?.calloutType === "danger"
                    ? "bg-rose-50/70 border-rose-200/60 text-rose-900"
                    : "bg-teal-50/60 border-teal-200/60 text-teal-950"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {block.metadata?.calloutType === "warning" ? (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-[#01AC9F]" />
                )}
              </div>
              <div className="text-xs leading-relaxed">
                {block.value || block.text}
              </div>
            </div>
          )}

          {/* Code Block - Styled beautifully */}
          {block.type === "code" && (
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-800 shadow-inner">
              <pre className="text-gray-200 font-mono text-[11px] leading-relaxed">
                {block.code || block.value}
              </pre>
            </div>
          )}

          {/* Video Block */}
          {block.type === "video" && (
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[#01AC9F]" />
              <a
                href={block.videoUrl || block.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#01AC9F] hover:underline"
              >
                {block.caption || "Watch Instructional Video Clip"}
              </a>
            </div>
          )}

          {/* Image Block */}
          {block.type === "image" && (
            <figure>
              <img
                src={block.imageUrl || block.metadata?.imageUrl || block.value}
                alt={
                  block.alt ||
                  block.metadata?.altText ||
                  block.caption ||
                  "Lesson image"
                }
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-white"
                referrerPolicy="no-referrer"
              />
              {(block.caption || block.metadata?.caption) && (
                <figcaption className="text-[11px] text-gray-500 mt-2 text-center italic">
                  {block.caption || block.metadata?.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* File Block */}
          {block.type === "file" && (
            <a
              href={block.fileUrl || block.metadata?.fileUrl || block.value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white border border-sky-100 rounded-xl p-3 hover:border-sky-300 hover:bg-sky-50/40 transition-colors group"
            >
              <div className="w-10 h-10 bg-sky-100 rounded flex items-center justify-center text-sky-600 shrink-0">
                <Paperclip className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {block.fileName ||
                    block.metadata?.fileName ||
                    block.caption ||
                    block.metadata?.caption ||
                    "Download Attachment"}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  Click to open or download
                </p>
              </div>
              <Download className="w-4 h-4 text-sky-500 group-hover:translate-y-0.5 transition-transform shrink-0" />
            </a>
          )}

          {/* Fallback for any other/unknown block type */}
          {![
            "text",
            "code",
            "video",
            "image",
            "file",
            "heading",
            "callout",
          ].includes(block.type) && (
            <p className="text-xs text-gray-400 italic">
              Unsupported block type: {block.type}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
