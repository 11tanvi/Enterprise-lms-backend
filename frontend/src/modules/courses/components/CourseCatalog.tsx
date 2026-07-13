import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import {
  BookOpen,
  Search,
  Plus,
  SlidersHorizontal,
  GraduationCap,
  BookOpenCheck,
  Briefcase,
  Layers,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { courseService } from "../../../services/courseService";
import { CourseCard } from "./CourseCard";
import { categoryService } from "../../../services/categoryService";
import { Course, Category } from "../../../types";
import { useAuthenticatedQuery } from "../../assignments/api/useAuthenticatedQuery";
import { assignmentService } from "../../assignments/api/assignmentService";
import { BatchEnrollmentModal } from "./BatchEnrollmentModal";

interface CourseCatalogProps {
  mode: "standard" | "batch";
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { userRole, enrolledCourseIds, showToast } = useApp();

  // Local state for courses and categories fetched directly from services (standard mode)
  const [localCourses, setLocalCourses] = useState<Course[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Search and Category filter states
  const [searchQuery, setSearchQuery] = useState("");
  
  // selectedCategory can be category ID (number) for standard mode, or category name (string) for batch mode
  const [selectedCategoryStandard, setSelectedCategoryStandard] = useState<number | null>(null);
  const [selectedCategoryBatch, setSelectedCategoryBatch] = useState<string | null>(null);

  // Active hover and menu actions states (standard mode)
  const [hoveredCardId, setHoveredCardId] = useState<number | string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  // Custom Delete Modal state (standard mode)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    courseId: number | null;
    courseTitle: string;
  }>({
    isOpen: false,
    courseId: null,
    courseTitle: "",
  });

  // Modal State (batch mode)
  const [selectedCourseForBatch, setSelectedCourseForBatch] = useState<Course | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Load all enrolled batches from localStorage to check status (batch mode)
  const [enrolledBatchIds, setEnrolledBatchIds] = useState<string[]>([]);
  useEffect(() => {
    if (mode === "batch") {
      const saved = localStorage.getItem("enrolled_batch_ids");
      if (saved) {
        try {
          setEnrolledBatchIds(JSON.parse(saved));
        } catch (e) {
          setEnrolledBatchIds([]);
        }
      }
    }
  }, [mode, isEnrollModalOpen]);

  // Standard Mode Queries
  const {
    data: standardCoursesData,
    isLoading: isStandardCoursesLoading,
    refetch: refetchStandardCourses,
  } = useAuthenticatedQuery<Course[]>(
    () => (mode === "standard" ? courseService.getAll(userRole) : Promise.resolve([])),
    [mode, userRole]
  );

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useAuthenticatedQuery<Category[]>(
    () => (mode === "standard" ? categoryService.getAll() : Promise.resolve([])),
    [mode]
  );

  // Batch Mode Queries
  const {
    data: batchCoursesData,
    isLoading: isBatchCoursesLoading,
    refetch: refetchBatchCourses,
  } = useAuthenticatedQuery<Course[]>(
    () => (mode === "batch" ? courseService.getAll(userRole) : Promise.resolve([])),
    [mode, userRole]
  );

  const isLoading = mode === "standard"
    ? (isStandardCoursesLoading || isCategoriesLoading)
    : isBatchCoursesLoading;

  // Sync loaded data to local states
  useEffect(() => {
    if (mode === "standard" && standardCoursesData) {
      setLocalCourses(standardCoursesData);
    } else if (mode === "batch" && batchCoursesData) {
      setLocalCourses(batchCoursesData);
    }
  }, [mode, standardCoursesData, batchCoursesData]);

  useEffect(() => {
    if (mode === "standard" && categoriesData) {
      setLocalCategories(categoriesData);
    }
  }, [mode, categoriesData]);

  // Fetch data directly from backend (for manual refetches/deletes)
  const fetchCatalogData = async () => {
    if (mode === "standard") {
      await Promise.all([refetchStandardCourses(), refetchCategories()]);
    } else {
      await refetchBatchCourses();
    }
  };

  // Map the courses so that each course has access to its parent category's color and icon (standard mode)
  const mappedCourses = useMemo(() => {
    return localCourses.map((course) => {
      const parentCategory = localCategories.find(
        (cat) =>
          cat.id === course.categoryId ||
          (course.category &&
            cat.name.toLowerCase() === course.category?.toLowerCase()),
      );
      return {
        ...course,
        categoryColor: parentCategory?.color || "#6C1D5F", // Fallback to Velvet Brand Primary
        categoryIcon: parentCategory?.icon || "📚",
        categoryName:
          parentCategory?.name ||
          course.categoryName ||
          course.category ||
          "Uncategorized",
      };
    });
  }, [localCourses, localCategories]);

  // Extract batch categories dynamically from courses (batch mode)
  const batchCategories = useMemo(() => {
    if (mode !== "batch") return [];
    const unique = new Set<string>();
    localCourses.forEach((c) => {
      if (c.category) unique.add(c.category);
    });
    return Array.from(unique);
  }, [mode, localCourses]);

  // Filter the grid dynamically based on searchQuery and selectedCategory
  const filteredCourses = useMemo(() => {
    if (mode === "standard") {
      return mappedCourses.filter((course) => {
        const matchesCategory =
          selectedCategoryStandard === null || course.categoryId === selectedCategoryStandard;

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          course.title.toLowerCase().includes(query) ||
          (course.shortDescription &&
            course.shortDescription.toLowerCase().includes(query)) ||
          (course.description &&
            course.description.toLowerCase().includes(query)) ||
          (course.slug && course.slug.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      });
    } else {
      // batch mode
      return localCourses.filter((c) => {
        const matchesSearch =
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.shortDescription && c.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
          !selectedCategoryBatch || (c.category && c.category.toLowerCase() === selectedCategoryBatch.toLowerCase());

        const isActive = c.status !== "Archived" && c.status !== "Draft";

        return matchesSearch && matchesCategory && isActive;
      });
    }
  }, [mode, mappedCourses, localCourses, selectedCategoryStandard, selectedCategoryBatch, searchQuery]);

  // Handle course deletion cleanly by showing the option selection modal (standard mode)
  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      courseId: id,
      courseTitle: title,
    });
  };

  const performDeletion = async (hard: boolean) => {
    if (deleteModal.courseId === null) return;
    try {
      await courseService.delete(deleteModal.courseId, hard);
      showToast(
        hard
          ? "Course permanently deleted from the database."
          : "Course soft-deleted (deactivated).",
        "success",
      );
      setDeleteModal({
        isOpen: false,
        courseId: null,
        courseTitle: "",
      });
      // Allow state to propagate then re-fetch
      setTimeout(() => {
        fetchCatalogData();
      }, 500);
    } catch (err) {
      console.error("[CourseCatalog] Delete operation failed:", err);
      showToast("Failed to delete course.", "error");
    }
  };

  // Quick statistics calculation (standard mode)
  const stats = useMemo(() => {
    return {
      total: localCourses.length,
      beginner: localCourses.filter(
        (c) => c.difficulty === "Beginner" || c.level === "Beginner",
      ).length,
      intermediate: localCourses.filter(
        (c) => c.difficulty === "Intermediate" || c.level === "Intermediate",
      ).length,
      advanced: localCourses.filter(
        (c) =>
          c.difficulty === "Advanced" ||
          c.level === "Advanced" ||
          c.level === "Expert",
      ).length,
    };
  }, [localCourses]);

  const handleOpenEnrollModal = (course: Course) => {
    setSelectedCourseForBatch(course);
    setIsEnrollModalOpen(true);
  };

  const handleEnrollmentSuccess = () => {
    // Invalidate app enrollments to refresh assignment list and dashboard widgets
    fetchCatalogData();
    showToast("Dashboard courses and assignments have been refreshed.", "info");
  };

  if (mode === "batch") {
    return (
      <div className="space-y-8 animate-fade-in" id="student-courses-catalog">
        {/* Header Panel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-[#6C1D5F]/5 p-8 rounded-3xl border border-[#6C1D5F]/10 shadow-xs relative overflow-hidden text-left">
          <div className="space-y-2 relative z-10">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6C1D5F] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-mono font-bold text-[#6C1D5F] uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-2xs border border-[#6C1D5F]/10">
                Student Batch Enrollment Portal
              </span>
            </div>
            <h1 className="text-3xl font-display font-extrabold text-black tracking-tight mt-1">
              Browse Batches & Cohorts
            </h1>
            <p className="text-sm font-sans text-[#5A5A5A] max-w-2xl">
              Acquire critical compliance certs and cyber skills. Select any available course below to explore and join its active corporate learning batches.
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#01AC9F]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        </div>

        {/* Filter Toolbar Section */}
        <div className="bg-white border border-[#DADCEA]/80 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search courses, skills, syllabi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F7F8FC] border border-[#DADCEA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all"
              id="course-search-field"
            />
          </div>

          {/* Dynamic Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCategoryBatch(null)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                !selectedCategoryBatch
                  ? "bg-[#6C1D5F] text-white border-[#6C1D5F] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Fields
            </button>
            {batchCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryBatch(cat)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategoryBatch?.toLowerCase() === cat.toLowerCase()
                    ? "bg-[#6C1D5F] text-white border-[#6C1D5F] shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course List Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-[#6C1D5F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-gray-400">LOADING AVAILABLE BATCHES...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courses-catalog-grid">
            {filteredCourses.map((course) => {
              // Determine batchId for this course to check enrollment status
              const courseIdNum = course.id || 1;
              let batchId = `batch-custom-${courseIdNum}-2024`;
              if (courseIdNum === 1) batchId = "batch-cyber-2024";
              else if (courseIdNum === 2) batchId = "batch-ldr-2024";
              else if (courseIdNum === 3) batchId = "batch-compliance-2024";

              // Security logic: check if student is enrolled in the batch
              const isEnrolled = 
                (course.id !== undefined && enrolledCourseIds.includes(course.id)) ||
                enrolledBatchIds.includes(batchId);

              // Level pill color mapping
              const levelStr = course.difficulty || course.level || "Beginner";
              let levelBadgeColor = "bg-[#01AC9F]"; // Emerald
              if (levelStr === "Intermediate") levelBadgeColor = "bg-[#6C1D5F]"; // Velvet
              else if (levelStr === "Advanced" || levelStr === "Expert") levelBadgeColor = "bg-[#FF6200]"; // Orange

              return (
                <div
                  key={course.id}
                  className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-[480px] relative group text-left"
                >
                  {/* Image Header */}
                  <div className="h-40 relative overflow-hidden bg-gray-50 shrink-0">
                    <img
                      src={
                        course.thumbnailUrl ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60";
                      }}
                    />
                    {/* Category overlay */}
                    <span className="absolute top-4 left-4 z-10 px-2.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-black uppercase rounded-md tracking-wider">
                      {course.category || "General"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col justify-between flex-grow overflow-hidden">
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] text-white px-2 py-0.5 rounded-full font-bold uppercase ${levelBadgeColor}`}>
                          {levelStr}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {course.duration || "4.5 Hours"}
                        </span>
                      </div>
                      <h3 className="text-lg font-display font-extrabold text-black line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#5A5A5A] font-sans line-clamp-3 leading-relaxed">
                        {course.shortDescription || course.description || "No description currently syllabus detailed."}
                      </p>
                    </div>

                    {/* Actions row */}
                    <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between shrink-0">
                      <span className="text-[10px] font-mono text-gray-400">
                        ID: #{course.id}
                      </span>

                      {/* Security Logic: Only render Join button if student is not already enrolled */}
                      {!isEnrolled ? (
                        <button
                          onClick={() => handleOpenEnrollModal(course)}
                          className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#541449] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          Join Batch
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Joined Cohort
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl space-y-3 bg-[#F7F8FC]/50">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto animate-pulse" />
            <h4 className="text-sm font-display font-bold text-black uppercase">No Active Courses Found</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Try adjusting your active filters or clear search matrices to load available corporate session courses.
            </p>
          </div>
        )}

        {/* Batch Enrollment Invitation Trigger Dialog Modal */}
        {selectedCourseForBatch && (
          <BatchEnrollmentModal
            isOpen={isEnrollModalOpen}
            onClose={() => {
              setIsEnrollModalOpen(false);
              setSelectedCourseForBatch(null);
            }}
            course={selectedCourseForBatch}
            onEnrollmentSuccess={handleEnrollmentSuccess}
          />
        )}
      </div>
    );
  }

  // Standard Mode Render
  return (
    <div className="bg-[#F7F8FC] min-h-screen -mx-4 sm:mx-0 p-4 sm:p-8 rounded-none sm:rounded-3xl space-y-6 sm:space-y-8 animate-fade-in relative text-left">
      {/* Absolute Transparent Cover for Click-Outside closing of Menu Dropdowns */}
      {activeMenuId !== null && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* Top Banner Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-[#DEDEDE] shadow-sm text-left">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C1D5F]/10 rounded-full text-xs font-bold text-[#6C1D5F]">
            <Layers className="w-3.5 h-3.5 text-[#6C1D5F]" />
            Enterprise LMS Portal
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#000000] tracking-tight">
            Curriculum Catalog
          </h2>
          <p className="text-[#5A5A5A] text-xs sm:text-sm leading-relaxed max-w-2xl">
            Explore, manage, and enroll in premium learning modules. Leverage
            granular administration options and intuitive student workflows.
          </p>
        </div>

        {userRole === "admin" && (
          <button
            type="button"
            onClick={() => navigate("/wizard")}
            className="bg-[#6C1D5F] hover:bg-[#4A1E47] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-[#6C1D5F]/10 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm shrink-0 self-start lg:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            Create New Course
          </button>
        )}
      </div>

      {/* Statistics Hub */}
      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Stats card */}
        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#DEDEDE] shadow-sm flex items-center gap-2 sm:gap-4 text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#6C1D5F]/10 flex items-center justify-center text-[#6C1D5F] shrink-0">
            <BookOpenCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#5A5A5A] truncate">
              Total Courses
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Beginner Stats Card */}
        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#DEDEDE] shadow-sm flex items-center gap-2 sm:gap-4 text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#01AC9F]/10 flex items-center justify-center text-[#01AC9F] shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#5A5A5A] truncate">
              Beginner
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] mt-0.5">
              {stats.beginner}
            </p>
          </div>
        </div>

        {/* Intermediate Stats Card */}
        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#DEDEDE] shadow-sm flex items-center gap-2 sm:gap-4 text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#6C1D5F]/10 flex items-center justify-center text-[#6C1D5F] shrink-0">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#5A5A5A] truncate">
              Intermediate
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] mt-0.5">
              {stats.intermediate}
            </p>
          </div>
        </div>

        {/* Advanced Stats Card */}
        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#DEDEDE] shadow-sm flex items-center gap-2 sm:gap-4 text-left">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#FF6200]/10 flex items-center justify-center text-[#FF6200] shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#5A5A5A] truncate">
              Advanced / Expert
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#000000] mt-0.5">
              {stats.advanced}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white p-5 rounded-2xl border border-[#DEDEDE] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Inputs */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-[#5A5A5A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by course title, description, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DEDEDE] rounded-xl text-sm text-[#000000] placeholder-[#5A5A5A]/60 focus:outline-none focus:border-[#01AC9F] focus:ring-1 focus:ring-[#01AC9F] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A5A] uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-[#6C1D5F]" />
            <span>Filter Systems</span>
          </div>
        </div>

        {/* Category horizontal scrolling buttons */}
        <div className="pt-2 border-t border-[#DEDEDE]/60">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <button
              type="button"
              onClick={() => setSelectedCategoryStandard(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                selectedCategoryStandard === null
                  ? "bg-[#6C1D5F] text-white border-[#6C1D5F] shadow-sm"
                  : "bg-white text-[#5A5A5A] border-[#DEDEDE] hover:border-[#6C1D5F]/40"
              }`}
            >
              📚 All Categories
            </button>
            {localCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  cat.id !== undefined && setSelectedCategoryStandard(cat.id)
                }
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 border flex items-center gap-1.5 cursor-pointer ${
                  selectedCategoryStandard === cat.id
                    ? "bg-[#6C1D5F] text-white border-[#6C1D5F] shadow-sm"
                    : "bg-white text-[#5A5A5A] border-[#DEDEDE] hover:border-[#6C1D5F]/40"
                }`}
              >
                <span>{cat.icon || "📚"}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-[#6C1D5F]/30 border-t-[#6C1D5F] rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A]">
            Syncing with backend...
          </p>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isHovered={hoveredCardId === course.id}
              isMenuOpen={activeMenuId === course.id}
              onMouseEnter={() =>
                course.id !== undefined && setHoveredCardId(course.id)
              }
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={() => {
                if (course.id) navigate(`/course-detail/${course.id}`);
              }}
              onMenuToggle={(e) => {
                e.stopPropagation();
                if (course.id !== undefined) {
                  setActiveMenuId(
                    activeMenuId === course.id ? null : course.id,
                  );
                }
              }}
              onEdit={(e) => {
                e.stopPropagation();
                setActiveMenuId(null);
                if (course.id !== undefined) {
                  navigate(`/wizard/${course.id}`);
                }
              }}
              onDelete={(e) => {
                e.stopPropagation();
                setActiveMenuId(null);
                if (course.id !== undefined) {
                  handleDelete(course.id, course.title, e);
                }
              }}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-dashed border-[#DEDEDE] p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#6C1D5F]/10 flex items-center justify-center text-[#6C1D5F] mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#000000]">No courses found</h3>
          <p className="text-sm text-[#5A5A5A] mt-2 max-w-sm mx-auto leading-relaxed">
            We couldn't find any courses matching your search query or selected
            category. Refine your criteria or add a new course.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {(searchQuery || selectedCategoryStandard !== null) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryStandard(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#000000] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            {userRole === "admin" && (
              <button
                type="button"
                onClick={() => navigate("/wizard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create a Course
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom Brand-Compliant Deletion Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#DEDEDE] shadow-2xl p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#6C1D5F]">
                Delete Course
              </h3>
              <p className="text-sm text-[#5A5A5A]">
                You are about to delete{" "}
                <span className="font-semibold text-black">
                  "{deleteModal.courseTitle}"
                </span>
                . Please select the deletion option:
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Option 1: Soft Delete */}
              <button
                type="button"
                onClick={() => performDeletion(false)}
                className="w-full text-left p-4 rounded-xl border border-[#DADCEA] hover:border-[#6C1D5F] hover:bg-[#F7F8FC] transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-[#6C1D5F] uppercase tracking-wider">
                      Archive / Soft Delete
                    </h4>
                    <p className="text-xs text-[#5A5A5A] mt-1">
                      Deactivates the course so it's hidden from students in the
                      catalog. All curriculum modules, lessons, and content
                      remain completely safe.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Hard Delete */}
              <button
                type="button"
                onClick={() => performDeletion(true)}
                className="w-full text-left p-4 rounded-xl border border-red-200 hover:border-red-600 hover:bg-red-50/50 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-red-600 uppercase tracking-wider">
                      Permanent / Hard Delete
                    </h4>
                    <p className="text-xs text-[#5A5A5A] mt-1 font-normal">
                      Permanently wipes this course and all its modules,
                      lessons, and contents from the database.{" "}
                      <strong className="text-red-700">
                        This action is irreversible.
                      </strong>
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    courseId: null,
                    courseTitle: "",
                  })
                }
                className="px-4 py-2 bg-[#DEDEDE] hover:bg-gray-300 text-[#000000] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
