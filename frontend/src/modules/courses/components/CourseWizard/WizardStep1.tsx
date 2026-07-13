import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Course, Category } from "../../../../types";
import categoryService from "../../../../services/categoryService";
import { useApp } from "../../../../context/AppContext";
import apiClient from "../../../../lib/apiClient";

interface WizardStep1Props {
  courseData: Course;
  setCourseData:
    | React.Dispatch<React.SetStateAction<any>>
    | ((val: any) => void);
}

export const WizardStep1: React.FC<WizardStep1Props> = ({
  courseData,
  setCourseData,
}) => {
  const { showToast } = useApp();

  // 1. Isolate the form data into local state so typing doesn't crash the parent
  const [localForm, setLocalForm] = useState<Partial<Course>>(() => ({
    title: courseData.title || "",
    slug: courseData.slug || "",
    categoryId: courseData.categoryId || undefined,
    shortDescription: courseData.shortDescription || "",
    description: courseData.description || "",
    thumbnailUrl: courseData.thumbnailUrl || "",
    level: courseData.level || courseData.difficulty || "Beginner",
    duration: courseData.duration || "10 Hours",
  }));

  const [isManualSlug, setIsManualSlug] = useState(!!courseData.slug);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Sync incoming loaded draft data to the local form state exactly once on initial load
  useEffect(() => {
    if (courseData && courseData.title && !hasLoadedInitial) {
      setLocalForm({
        title: courseData.title || "",
        slug: courseData.slug || "",
        categoryId: courseData.categoryId || undefined,
        shortDescription: courseData.shortDescription || "",
        description: courseData.description || "",
        thumbnailUrl: courseData.thumbnailUrl || "",
        level: courseData.level || courseData.difficulty || "Beginner",
        duration: courseData.duration || "10 Hours",
      });
      if (courseData.slug) {
        setIsManualSlug(true);
      }
      setHasLoadedInitial(true);
    }
  }, [courseData, hasLoadedInitial]);

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
  } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });

  // Auto-generate slug when title changes (if manual is off)
  useEffect(() => {
    if (!isManualSlug && localForm.title) {
      const generatedSlug = localForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setLocalForm((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [localForm.title, isManualSlug]);

  // 2. Sync local changes up to the parent immediately so Auto-Save works
  useEffect(() => {
    setCourseData((prev: any) => ({
      ...prev,
      ...localForm,
    }));
  }, [localForm, setCourseData]);

  const handleFieldChange = (field: keyof Course, value: any) => {
    setLocalForm((prev) => ({ ...prev, [field]: value }));
  };

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const processFile = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Check if Cloudinary is configured, stripping whitespaces from local .env values if they exist but are empty
        const CLOUDINARY_CLOUD_NAME = (
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
        )?.trim();
        const CLOUDINARY_UPLOAD_PRESET = (
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined
        )?.trim();

        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
          try {
            const clFormData = new FormData();
            clFormData.append("file", file);
            clFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            const clRes = await fetch(
              `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
              {
                method: "POST",
                body: clFormData,
              },
            );
            if (clRes.ok) {
              const data = await clRes.json();
              if (data.secure_url) {
                handleFieldChange("thumbnailUrl", data.secure_url);
                showToast(
                  "Thumbnail uploaded to Cloudinary successfully!",
                  "success",
                );
                setIsUploading(false);
                return;
              }
            }
            console.warn(
              "Cloudinary upload failed (non-ok response), trying backend fallback...",
            );
          } catch (cloudinaryErr) {
            console.warn(
              "Cloudinary upload failed with exception, trying backend fallback:",
              cloudinaryErr,
            );
          }
        }

        // Fallback to local Spring Boot backend
        const response = await apiClient.post("/files/upload", formData);
        if (response.data && response.data.url) {
          handleFieldChange("thumbnailUrl", response.data.url);
          showToast(
            "Thumbnail uploaded to backend storage successfully!",
            "success",
          );
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.warn(
          "Backend / Cloudinary upload failed, using local base64 fallback:",
          err,
        );
        // Fall back to base64 preview so it still works if offline or disconnected
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            handleFieldChange("thumbnailUrl", event.target.result as string);
            showToast(
              "Backend upload failed. Saved as local preview.",
              "info",
            );
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
      }
    } else {
      showToast("Please upload a valid image file (PNG, JPG).", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column Forms */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="e.g., Strategic Leadership & Change Management"
                value={localForm.title || ""}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all text-gray-800 font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  URL Slug
                </label>
                <div
                  onClick={() => setIsManualSlug(!isManualSlug)}
                  className="flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#510047]">
                    Manual Override
                  </span>
                  {isManualSlug ? (
                    <ToggleRight className="w-6 h-6 text-[#01AC9F]" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-300" />
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <span className="hidden sm:inline-flex bg-gray-100 border border-r-0 border-gray-200 px-4 py-3 rounded-l-xl text-xs font-mono text-gray-400">
                  academy.edu/c/
                </span>
                <input
                  type="text"
                  disabled={!isManualSlug}
                  value={localForm.slug || ""}
                  onChange={(e) => handleFieldChange("slug", e.target.value)}
                  className={`w-full border border-gray-200 rounded-xl sm:rounded-l-none sm:rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] transition-all font-mono text-xs ${
                    isManualSlug
                      ? "bg-white text-gray-800"
                      : "bg-gray-50 text-gray-400 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Course Category *
              </label>
              <div className="relative">
                <select
                  required
                  value={localForm.categoryId || ""}
                  onChange={(e) =>
                    handleFieldChange("categoryId", Number(e.target.value))
                  }
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all text-gray-700 bg-white cursor-pointer pr-10"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {isLoadingCategories ? (
                    <option disabled>Loading categories...</option>
                  ) : isCategoriesError ? (
                    <option disabled>Error loading categories</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Short Description
              </label>
              <textarea
                rows={3}
                placeholder="A brief 1-2 sentence hook for the catalog card..."
                value={localForm.shortDescription || ""}
                onChange={(e) =>
                  handleFieldChange("shortDescription", e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all text-gray-700 resize-none"
              />
            </div>
          </div>

          {/* Right Column Forms */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Course Thumbnail Cover
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative group border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-200 bg-gray-50/50 flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-[#01AC9F] bg-emerald-50/50"
                    : "border-gray-200 hover:border-[#510047]"
                } ${localForm.thumbnailUrl ? "h-64" : "h-40"}`}
              >
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-white space-y-2">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold">
                      Uploading Thumbnail...
                    </span>
                  </div>
                )}
                {localForm.thumbnailUrl ? (
                  <>
                    <img
                      src={localForm.thumbnailUrl}
                      alt="Thumbnail Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs p-2 flex items-center justify-center gap-2 md:inset-0 md:bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex-row md:gap-3">
                      <label className="cursor-pointer bg-white text-gray-800 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold shadow-lg hover:bg-gray-100 transition-colors">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && processFile(e.target.files[0])
                          }
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleFieldChange("thumbnailUrl", "")}
                        className="bg-red-500 text-white p-1.5 md:p-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center p-6 w-full h-full justify-center">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                      <Upload
                        className={`w-5 h-5 ${isDragging ? "text-[#01AC9F]" : "text-gray-400"}`}
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-600">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      16:9 ratio recommended (Max 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files && processFile(e.target.files[0])
                      }
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Skill Level
                </label>
                <div className="relative">
                  <select
                    value={localForm.level || "Beginner"}
                    onChange={(e) => handleFieldChange("level", e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] transition-all text-gray-700 bg-white cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Est. Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4.5 Hours"
                  value={localForm.duration || ""}
                  onChange={(e) =>
                    handleFieldChange("duration", e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#510047] transition-all text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Detailed Master Syllabus (Optional)
          </label>
          <textarea
            rows={5}
            placeholder="Provide a comprehensive breakdown of the course material, target audience, and learning outcomes..."
            value={localForm.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all text-gray-700 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
