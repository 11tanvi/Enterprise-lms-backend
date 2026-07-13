import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../../../context/AppContext";
import { Course } from "../../../../types";
import { WizardStep1 } from "./WizardStep1";
import { WizardStep2 } from "./WizardStep2";
import { WizardStep3 } from "./WizardStep3";
import { WizardStep4 } from "./WizardStep4";
import courseService from "../../../../services/courseService";
import { ChevronRight, ChevronLeft, Check, Save, Send, X } from "lucide-react";

export const CourseWizardParent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    wizardCourseId,
    wizardStep,
    setWizardStep,
    setWizardCourseId,
    showToast,
  } = useApp();

  useEffect(() => {
    if (id) {
      setWizardCourseId(parseInt(id, 10));
    } else {
      setWizardCourseId(null);
    }
  }, [id, setWizardCourseId]);

  const [courseDraft, setCourseDraft] = useState<any>(() => {
    return {
      title: "",
      slug: "",
      category: "",
      description: "",
      status: "Draft",
      duration: "4.5 Hours",
      difficulty: "Beginner",
      language: "English",
      thumbnailUrl: "",
      modules: [],
    };
  });

  const [activeSubmoduleId, setActiveSubmoduleId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (wizardCourseId) {
      courseService.getById(wizardCourseId)
        .then((existing) => {
          if (existing) {
            setCourseDraft(existing);
          }
        })
        .catch((err) => {
          console.error("Failed to load course draft", err);
        });
    }
  }, [wizardCourseId]);

  const steps = [
    { number: 1, label: "Basic Details" },
    { number: 2, label: "Curriculum" },
    { number: 3, label: "Media & Content" },
    { number: 4, label: "Settings & SEO" },
  ];

  // UPGRADE: We make this async so we get the REAL Database ID, not a fake timestamp!
  // UPGRADE: We map the React State to the exact structure the Spring Boot DTO expects!
  const handleSaveDraftSilent = async (): Promise<boolean> => {
    if (!courseDraft.title) return false;

    // 🚨 FIX: Sanitize the payload so the backend doesn't reject it. Keep drafts inactive (isActive: false) until published.
    const isPublished = courseDraft.isPublished || false;
    const payload = {
      title: courseDraft.title.trim(),
      slug:
        courseDraft.slug ||
        courseDraft.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      shortDescription: courseDraft.shortDescription?.trim() || "",
      description: courseDraft.description?.trim() || "",
      level: courseDraft.level || courseDraft.difficulty || "Beginner",
      duration: courseDraft.duration || "4.5 Hours",
      thumbnailUrl: courseDraft.thumbnailUrl || "",
      categoryId: courseDraft.categoryId
        ? Number(courseDraft.categoryId)
        : undefined,
      isActive: isPublished,
      isPublished: isPublished,
    };

    try {
      if (wizardCourseId) {
        // Update existing course
        await courseService.update(wizardCourseId, payload);
        return true;
      } else {
        // Create NEW real course in DB
        const newCourse = await courseService.create(payload);

        if (newCourse && newCourse.id) {
          setWizardCourseId(newCourse.id); // Save the REAL ID!
          setCourseDraft((prev: any) => ({
            ...prev,
            ...payload,
            id: newCourse.id,
          }));
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error("[Wizard] Save failed. Payload mismatch.", err);
      showToast(
        "Database rejected save. Ensure title and category are set.",
        "error",
      );
      return false;
    }
  };

  const handleNextStep = async () => {
    if (wizardStep === 1) {
      if (!courseDraft.title?.trim()) {
        showToast("Please fill in the Course Title to proceed.", "error");
        return;
      }
      if (!courseDraft.categoryId) {
        showToast("Please select a Category to proceed.", "error");
        return;
      }
    }

    // Wait for the DB to save before advancing!
    const success = await handleSaveDraftSilent();
    if (success && wizardStep < 4) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleStepClick = async (targetStep: number) => {
    if (targetStep === wizardStep) return;

    if (wizardStep === 1 && targetStep > 1) {
      if (!courseDraft.title?.trim()) {
        showToast("Please fill in the Course Title to proceed.", "error");
        return;
      }
      if (!courseDraft.categoryId) {
        showToast("Please select a Category to proceed.", "error");
        return;
      }
    }

    // Attempt to save draft if title is present
    if (courseDraft.title?.trim()) {
      const success = await handleSaveDraftSilent();
      if (!success && targetStep > wizardStep) {
        // If save failed on going forward, block
        return;
      }
    } else if (targetStep > wizardStep) {
      // If no title and trying to go forward, they shouldn't be allowed
      showToast("Please fill in the Course Title to proceed.", "error");
      return;
    }

    setWizardStep(targetStep);
  };

  const handleEditSubmoduleContentShortcut = (submoduleId: number) => {
    setActiveSubmoduleId(submoduleId);
    handleSaveDraftSilent();
    setWizardStep(3);
  };

  const handleSaveDraftManual = async () => {
    if (!courseDraft.title) {
      showToast("Course Title is required to save a draft.", "error");
      return;
    }
    const success = await handleSaveDraftSilent();
    if (success) {
      showToast(
        "Draft auto-saved successfully. All changes preserved.",
        "success",
      );
    }
  };

  const handlePublishCourse = async () => {
    if (!courseDraft.title) {
      showToast("Course Title is required to publish.", "error");
      return;
    }

    // 🚨 FIX: Sanitize the finalCourse payload just like handleSaveDraftSilent to prevent Spring Boot from rejecting with 400 Bad Request
    const payload = {
      title: courseDraft.title.trim(),
      slug:
        courseDraft.slug ||
        courseDraft.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      shortDescription: courseDraft.shortDescription?.trim() || "",
      description:
        courseDraft.description?.trim() ||
        courseDraft.shortDescription?.trim() ||
        "Explore the modules and lessons in the curriculum to master this course's content.",
      level: courseDraft.level || courseDraft.difficulty || "Beginner",
      duration: courseDraft.duration || "4.5 Hours",
      thumbnailUrl:
        courseDraft.thumbnailUrl?.trim() ||
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
      categoryId: courseDraft.categoryId
        ? Number(courseDraft.categoryId)
        : undefined,
      isActive: true,
      isPublished: true,
    };

    try {
      if (wizardCourseId !== null) {
        await courseService.update(wizardCourseId, payload);
      } else {
        await courseService.create(payload);
      }

      setWizardCourseId(null);
      setWizardStep(1);
      navigate("/courses");
      showToast(
        `Congratulations! "${courseDraft.title}" is now published!`,
        "success",
      );
    } catch (err) {
      console.error("[Wizard] Publish failed. Payload mismatch.", err);
      showToast("Failed to publish course.", "error");
    }
  };

  const handleClose = () => {
    if (courseDraft.title) {
      handleSaveDraftSilent();
      showToast("Progress safely auto-saved. Exiting to catalog.", "info");
    }
    navigate("/courses");
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Wizard Header Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-gray-400 mb-2">
            <span
              className="cursor-pointer hover:text-gray-600 transition-colors"
              onClick={handleClose}
            >
              Courses
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-[#510047]">Course Authoring Suite</span>
          </nav>
          <h2 className="text-3xl font-bold font-headline text-[#510047]">
            {wizardCourseId ? "Edit Learning Program" : "Create New Course"}
          </h2>
          <p className="text-gray-500 text-sm">
            Design, structure, and configure assets for your corporate program.
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
          title="Save & Exit"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modern Progress Stepper */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#01AC9F] rounded-full z-0 transition-all duration-500"
            style={{
              width: `${((wizardStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          ></div>

          {steps.map((step) => {
            const isCompleted = wizardStep > step.number;
            const isActive = wizardStep === step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => handleStepClick(step.number)}
                className="relative z-10 flex flex-col items-center gap-2 focus:outline-none cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm ${
                    isCompleted
                      ? "bg-[#01AC9F] text-white ring-4 ring-emerald-50 border-none group-hover:bg-[#009287]"
                      : isActive
                        ? "bg-[#510047] text-white ring-4 ring-[#ffd7f0] border-none scale-110"
                        : "bg-white text-gray-400 border-2 border-gray-200 group-hover:border-[#510047]/30 group-hover:text-[#510047]/60 group-hover:bg-[#510047]/5"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isActive
                      ? "text-[#510047]"
                      : isCompleted
                        ? "text-[#01AC9F] group-hover:text-[#009287]"
                        : "text-gray-400 group-hover:text-[#510047]/80"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Step Content */}
      <div className="bg-white rounded-3xl border border-[#DEDEDE] shadow-sm overflow-hidden">
        <div className="p-6 md:p-10">
          {wizardStep === 1 && (
            <WizardStep1
              courseData={courseDraft}
              setCourseData={setCourseDraft}
            />
          )}
          {wizardStep === 2 && (
            <WizardStep2
              courseData={courseDraft}
              setCourseData={setCourseDraft}
              onEditSubmoduleContent={handleEditSubmoduleContentShortcut}
            />
          )}
          {wizardStep === 3 && (
            <WizardStep3
              courseData={courseDraft}
              setCourseData={setCourseDraft}
              activeSubmoduleId={activeSubmoduleId}
              setActiveSubmoduleId={setActiveSubmoduleId}
            />
          )}
          {wizardStep === 4 && (
            <WizardStep4
              courseData={courseDraft}
              setCourseData={setCourseDraft}
            />
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {wizardStep > 1 && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            <button
              onClick={handleSaveDraftManual}
              className="px-6 py-2.5 bg-white border border-gray-200 text-[#01AC9F] text-xs font-bold rounded-xl hover:border-[#01AC9F] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          </div>

          <div className="w-full sm:w-auto">
            {wizardStep < 4 ? (
              <button
                onClick={handleNextStep}
                className="w-full sm:w-auto px-8 py-2.5 bg-[#510047] hover:bg-[#3c0034] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublishCourse}
                className="w-full sm:w-auto px-8 py-2.5 bg-[#01AC9F] hover:bg-[#008f84] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                Publish Curriculum
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
