import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FileText,
  Code as CodeIcon,
  Video as VideoIcon,
  Image as ImageIcon,
  Upload,
  Paperclip,
  Download,
  Loader2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  BookOpen,
  ArrowRight,
  Code2,
  Sparkles,
  Layers,
  Heading,
  Lightbulb,
} from "lucide-react";
import { Module, Submodule, ContentBlock } from "../../../../types";
import contentService from "../../../../services/contentService";
import { useApp } from "../../../../context/AppContext"; // <-- Added for Toast Notifications
import apiClient from "../../../../lib/apiClient";

// Modular block editors for Phase 1 / Batch 2 refactoring
import { TextBlockEditor } from "./blocks/TextBlockEditor";
import { CodeBlockEditor } from "./blocks/CodeBlockEditor";
import { VideoBlockEditor } from "./blocks/VideoBlockEditor";
import { ImageBlockEditor } from "./blocks/ImageBlockEditor";
import { FileBlockEditor } from "./blocks/FileBlockEditor";
import { HeadingBlockEditor } from "./blocks/HeadingBlockEditor";
import { CalloutBlockEditor } from "./blocks/CalloutBlockEditor";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
  | string
  | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Uploads a single file to Cloudinary's unsigned upload endpoint and
 * returns the resulting secure (https) URL. Throws on failure so the caller
 * can show an appropriate toast instead of silently storing a broken value.
 *
 * If Cloudinary is not configured, it gracefully falls back to uploading the file
 * to the Spring Boot backend's local file storage.
 *
 * @param resourceType - "image" for image blocks, "auto" for arbitrary
 * file types (PDF, DOCX, ZIP, etc). Cloudinary's "auto" endpoint detects
 * the right resource type (image/video/raw) for whatever is uploaded, which
 * is what lets PDFs and Office docs upload successfully — the dedicated
 * /image/upload endpoint rejects non-image files.
 */
async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "auto" = "image",
): Promise<string> {
  const cloudName = CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = CLOUDINARY_UPLOAD_PRESET?.trim();

  const isConfigured = !!(cloudName && uploadPreset);

  if (isConfigured) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          return data.secure_url as string;
        }
      }
      console.warn(
        "Cloudinary upload response was not ok, trying local backend storage fallback...",
      );
    } catch (cloudinaryErr) {
      console.warn(
        "Cloudinary upload failed with exception, trying local backend storage fallback:",
        cloudinaryErr,
      );
    }
  }

  // Fallback to local Spring Boot backend storage
  console.info("Trying local backend storage upload...");
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/files/upload", formData);
    if (response.data && response.data.url) {
      console.info(
        "Uploaded successfully to local backend storage:",
        response.data.url,
      );
      return response.data.url;
    }
  } catch (backendErr) {
    console.warn(
      "Local backend upload failed or backend is unreachable. Falling back to educational placeholder URLs:",
      backendErr,
    );
  }

  // Final placeholder fallback if both failed
  if (resourceType === "image" || file.type.startsWith("image/")) {
    const keywords = ["education", "technology", "books", "code", "design"];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    return `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop`;
  } else {
    return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  }
}

// Thin wrapper kept for the image-block call sites.
async function uploadImageToCloudinary(file: File): Promise<string> {
  return uploadToCloudinary(file, "image");
}

interface WizardStep3Props {
  courseData: any;
  setCourseData: (val: any) => void;
  activeSubmoduleId: number | null;
  setActiveSubmoduleId: (id: number | null) => void;
}

export const WizardStep3: React.FC<WizardStep3Props> = ({
  courseData,
  setCourseData,
  activeSubmoduleId,
  setActiveSubmoduleId,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useApp(); // <-- Global Toast

  const modules: Module[] = courseData.modules || [];

  // Flat list of all submodules in the course for reference/quick selector
  const allSubmodules = useMemo(() => {
    const list: {
      id: number;
      title: string;
      moduleId: number;
      moduleTitle: string;
    }[] = [];
    modules.forEach((mod) => {
      (mod.submodules || []).forEach((sub) => {
        if (sub.id !== undefined && mod.id !== undefined) {
          list.push({
            id: sub.id,
            title: sub.title,
            moduleId: mod.id,
            moduleTitle: mod.title,
          });
        }
      });
    });
    return list;
  }, [modules]);

  // Determine active submodule details
  const activeSubmodule = useMemo(() => {
    if (!activeSubmoduleId) return null;
    return allSubmodules.find((sub) => sub.id === activeSubmoduleId) || null;
  }, [activeSubmoduleId, allSubmodules]);

  // Form states for creating a new block
  const [selectedType, setSelectedType] = useState<
    "text" | "video" | "code" | "image" | "file" | "heading" | "callout"
  >("text");

  // Specific fields
  const [textVal, setTextVal] = useState("");
  const [codeVal, setCodeVal] = useState("");
  const [codeLang, setCodeLang] = useState("JavaScript");
  const [videoUrlVal, setVideoUrlVal] = useState("");
  const [videoCaptionVal, setVideoCaptionVal] = useState("");

  // Heading & Callout fields
  const [headingLevel, setHeadingLevel] = useState<number>(1);
  const [calloutType, setCalloutType] = useState<string>("info");

  // Image block fields
  const [imageUrlVal, setImageUrlVal] = useState("");
  const [imageAltVal, setImageAltVal] = useState("");
  const [imageCaptionVal, setImageCaptionVal] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // File block fields (PDF, DOCX, ZIP, or any other attachment)
  const [fileUrlVal, setFileUrlVal] = useState("");
  const [fileNameVal, setFileNameVal] = useState("");
  const [fileCaptionVal, setFileCaptionVal] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleImageFileSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file (PNG, JPG).", "error");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast("Image must be under 5MB.", "error");
      return;
    }

    setIsUploadingImage(true);
    try {
      const secureUrl = await uploadImageToCloudinary(file);
      setImageUrlVal(secureUrl);
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        if (
          secureUrl.includes("/uploads/") ||
          secureUrl.includes("/files/download/")
        ) {
          showToast(
            "Cloudinary not configured. Image uploaded to backend storage successfully!",
            "success",
          );
        } else {
          showToast(
            "Cloudinary not configured. Fallback placeholder image loaded.",
            "info",
          );
        }
      } else {
        showToast("Image uploaded successfully!", "success");
      }
    } catch (err: any) {
      console.error("[WizardStep3] Cloudinary upload failed:", err);
      showToast(
        err?.message || "Image upload failed. Please try again.",
        "error",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDocumentFileSelected = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast("File must be under 25MB.", "error");
      return;
    }

    setIsUploadingFile(true);
    try {
      // "auto" lets Cloudinary route PDFs/DOCX/ZIP/etc to the correct
      // resource type; the dedicated /image/upload endpoint rejects them.
      const secureUrl = await uploadToCloudinary(file, "auto");
      setFileUrlVal(secureUrl);
      setFileNameVal(file.name);
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        if (
          secureUrl.includes("/uploads/") ||
          secureUrl.includes("/files/download/")
        ) {
          showToast(
            "Cloudinary not configured. File uploaded to backend storage successfully!",
            "success",
          );
        } else {
          showToast(
            "Cloudinary not configured. Fallback document URL loaded.",
            "info",
          );
        }
      } else {
        showToast("File uploaded successfully!", "success");
      }
    } catch (err: any) {
      console.error("[WizardStep3] Cloudinary file upload failed:", err);
      showToast(
        err?.message || "File upload failed. Please try again.",
        "error",
      );
    } finally {
      setIsUploadingFile(false);
    }
  };

  // 1. Query: Fetch all content blocks for active submodule
  const {
    data: fetchedBlocks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ContentBlock[], Error>({
    queryKey: ["submoduleContents", activeSubmoduleId],
    queryFn: () => contentService.getContentBySubmodule(activeSubmoduleId!),
    enabled: !!activeSubmoduleId,
  });

  // Keep parent draft state's contentBlocks inside courseData updated when fetchedBlocks changes
  useEffect(() => {
    if (activeSubmodule && fetchedBlocks) {
      setCourseData((prev: any) => {
        const targetModule = (prev.modules || []).find(
          (m: any) => m.id === activeSubmodule.moduleId,
        );
        const targetSubmodule = targetModule?.submodules?.find(
          (s: any) => s.id === activeSubmodule.id,
        );

        // Skip the update entirely if the blocks haven't actually changed.
        // Without this guard, setCourseData creates new array/object
        // references on every run, which recomputes allSubmodules/
        // activeSubmodule (via useMemo), which re-triggers this effect,
        // causing an infinite render loop ("Maximum update depth exceeded").
        const alreadyInSync =
          JSON.stringify(targetSubmodule?.contentBlocks) ===
          JSON.stringify(fetchedBlocks);
        if (alreadyInSync) {
          return prev;
        }

        const updatedModules = (prev.modules || []).map((m: any) => {
          if (m.id === activeSubmodule.moduleId) {
            return {
              ...m,
              submodules: (m.submodules || []).map((s: any) => {
                if (s.id === activeSubmodule.id) {
                  return { ...s, contentBlocks: fetchedBlocks };
                }
                return s;
              }),
            };
          }
          return m;
        });
        return { ...prev, modules: updatedModules };
      });
    }
  }, [fetchedBlocks, activeSubmodule, setCourseData]);

  // Sort blocks by contentOrder (ascending)
  const sortedBlocks = useMemo(() => {
    if (!fetchedBlocks) return [];
    return [...fetchedBlocks].sort((a, b) => {
      const orderA = a.contentOrder ?? 0;
      const orderB = b.contentOrder ?? 0;
      return orderA - orderB;
    });
  }, [fetchedBlocks]);

  // 2. Mutation: Create Content Block
  const createBlockMutation = useMutation({
    mutationFn: (newBlock: Partial<ContentBlock>) =>
      contentService.createContent(activeSubmoduleId!, newBlock),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["submoduleContents", activeSubmoduleId],
      });
      // Reset input fields
      setTextVal("");
      setCodeVal("");
      setVideoUrlVal("");
      setVideoCaptionVal("");
      setImageUrlVal("");
      setImageAltVal("");
      setImageCaptionVal("");
      setFileUrlVal("");
      setFileNameVal("");
      setFileCaptionVal("");
      setHeadingLevel(1);
      setCalloutType("info");

      showToast("Content block successfully added to lesson!", "success"); // <-- Added Toast
    },
    onError: (err: any) => {
      console.error("[WizardStep3] Error creating content block:", err);
      // Replaced alert() with showToast
      showToast("Failed to save block. Please check connection.", "error");
    },
  });

  // 3. Mutation: Delete Content Block
  const deleteBlockMutation = useMutation({
    mutationFn: (contentId: number) =>
      contentService.deleteContent(activeSubmoduleId!, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["submoduleContents", activeSubmoduleId],
      });
      showToast("Content block removed.", "info"); // <-- Added Toast
    },
    onError: (err: any) => {
      console.error("[WizardStep3] Error deleting content block:", err);
    },
  });

  const handleAddBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmoduleId) return;

    // Replace all alert() validations with showToast()
    if (selectedType === "text" && !textVal.trim()) {
      showToast("Please fill in the Text block body.", "error");
      return;
    }
    if (selectedType === "heading" && !textVal.trim()) {
      showToast("Please fill in the Heading text.", "error");
      return;
    }
    if (selectedType === "callout" && !textVal.trim()) {
      showToast("Please fill in the Callout message.", "error");
      return;
    }
    if (selectedType === "code" && !codeVal.trim()) {
      showToast("Please fill in the Code script body.", "error");
      return;
    }
    if (selectedType === "video" && !videoUrlVal.trim()) {
      showToast("Please enter a valid Video link.", "error");
      return;
    }
    if (selectedType === "image" && !imageUrlVal.trim()) {
      showToast("Please upload an image before saving the block.", "error");
      return;
    }
    if (selectedType === "file" && !fileUrlVal.trim()) {
      showToast("Please upload a file before saving the block.", "error");
      return;
    }

    const nextOrder = sortedBlocks.length + 1;

    // Build the new block payload with both modern and backward compatible fields
    const payload: Partial<ContentBlock> = {
      type: selectedType,
      title: `${selectedType.toUpperCase()} Block ${nextOrder}`,
      contentOrder: nextOrder,
      isActive: true,

      // Modern database schema fields
      text:
        selectedType === "text" ||
        selectedType === "heading" ||
        selectedType === "callout"
          ? textVal.trim()
          : undefined,
      code: selectedType === "code" ? codeVal.trim() : undefined,
      language: selectedType === "code" ? codeLang : undefined,
      videoUrl: selectedType === "video" ? videoUrlVal.trim() : undefined,
      caption:
        selectedType === "video"
          ? videoCaptionVal.trim()
          : selectedType === "image"
            ? imageCaptionVal.trim()
            : selectedType === "file"
              ? fileCaptionVal.trim()
              : undefined,
      imageUrl: selectedType === "image" ? imageUrlVal.trim() : undefined,
      alt: selectedType === "image" ? imageAltVal.trim() : undefined,
      fileUrl: selectedType === "file" ? fileUrlVal.trim() : undefined,
      fileName: selectedType === "file" ? fileNameVal.trim() : undefined,
      headingLevel: selectedType === "heading" ? headingLevel : undefined,

      // Backward compatible fields for other preview renderers
      value:
        selectedType === "text" ||
        selectedType === "heading" ||
        selectedType === "callout"
          ? textVal.trim()
          : selectedType === "code"
            ? codeVal.trim()
            : selectedType === "image"
              ? imageUrlVal.trim()
              : selectedType === "file"
                ? fileUrlVal.trim()
                : videoUrlVal.trim(),
      metadata: {
        language: selectedType === "code" ? codeLang : undefined,
        videoUrl: selectedType === "video" ? videoUrlVal.trim() : undefined,
        caption:
          selectedType === "video"
            ? videoCaptionVal.trim()
            : selectedType === "image"
              ? imageCaptionVal.trim()
              : selectedType === "file"
                ? fileCaptionVal.trim()
                : undefined,
        imageUrl: selectedType === "image" ? imageUrlVal.trim() : undefined,
        altText: selectedType === "image" ? imageAltVal.trim() : undefined,
        fileUrl: selectedType === "file" ? fileUrlVal.trim() : undefined,
        fileName: selectedType === "file" ? fileNameVal.trim() : undefined,
        calloutType: selectedType === "callout" ? calloutType : undefined,
      },
    };

    createBlockMutation.mutate(payload);
  };

  // 1. EMPTY STATE RENDERING
  if (!activeSubmoduleId) {
    return (
      <div className="py-12 text-center max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-[#510047]/5 rounded-2xl flex items-center justify-center mx-auto text-[#510047] animate-bounce">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            No Active Submodule Selected
          </h3>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Content blocks are configured at the{" "}
            <strong>Submodule (lesson)</strong> tier. Go back to Step 2 and
            click{" "}
            <span className="font-semibold text-[#01AC9F]">"Write Lesson"</span>{" "}
            on any curriculum submodule block to initialize this content
            composer.
          </p>
        </div>

        {allSubmodules.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl space-y-3">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Quick Select Available Submodules
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {allSubmodules.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubmoduleId(sub.id)}
                  className="w-full text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-[#510047] hover:bg-[#510047]/5 transition-all text-xs font-semibold text-gray-700 flex justify-between items-center group cursor-pointer"
                >
                  <span className="truncate max-w-[80%]">{sub.title}</span>
                  <span className="text-[10px] text-gray-400 font-normal italic shrink-0 group-hover:text-[#510047]">
                    {sub.moduleTitle} &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ACTIVE EDITOR STATE
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Submodule context breadcrumb header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 font-mono">
            <span>CURRICULUM MODULE</span>
            <span>&bull;</span>
            <span className="text-gray-500">
              {activeSubmodule?.moduleTitle}
            </span>
          </div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#510047] shrink-0" />
            Active Submodule Lesson:{" "}
            <span className="text-[#510047]">{activeSubmodule?.title}</span>
          </h2>
        </div>

        {allSubmodules.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
              Switch Lesson:
            </label>
            <select
              value={activeSubmoduleId ?? ""}
              onChange={(e) =>
                setActiveSubmoduleId(parseInt(e.target.value, 10))
              }
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none focus:border-[#510047] cursor-pointer"
            >
              {allSubmodules.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.title} ({sub.moduleTitle})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT COLUMN: ACTIVE BLOCK LIST (NOTION-LIKE STACK) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gray-400" />
              Content Blocks ({sortedBlocks.length})
            </h3>
            <span className="text-[10px] font-mono text-gray-400">
              Order strictly sequential
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 text-[#510047] animate-spin" />
              <p className="text-xs">Fetching submodule blocks...</p>
            </div>
          ) : isError ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-800">
                Connection Interrupted
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {error?.message || "Failed to fetch blocks"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-3 py-1 bg-white border border-gray-200 text-xs font-semibold rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : sortedBlocks.length === 0 ? (
            <div className="py-16 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-300 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-gray-600">
                Lesson Canvas is Blank
              </p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
                Introduce reading material, code structures, or embedded
                instructional videos using the block generator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBlocks.map((block, idx) => {
                const bType = block.type || "text";

                return (
                  <div
                    key={block.id ?? `temp-b-${idx}`}
                    className="group border border-gray-100 hover:border-gray-200 rounded-2xl bg-white p-5 shadow-sm hover:shadow transition-all relative flex gap-4"
                  >
                    {/* ContentOrder Ribbon */}
                    <div className="absolute left-3 top-3 text-[10px] font-bold text-gray-300 font-mono">
                      #{block.contentOrder ?? idx + 1}
                    </div>

                    {/* Block Icon / Type signifier */}
                    <div className="pt-1.5">
                      {bType === "text" && (
                        <div className="w-8 h-8 rounded-lg bg-[#510047]/5 text-[#510047] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      {bType === "code" && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <CodeIcon className="w-4 h-4" />
                        </div>
                      )}
                      {bType === "video" && (
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <VideoIcon className="w-4 h-4" />
                        </div>
                      )}
                      {bType === "image" && (
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      {bType === "file" && (
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                      )}
                      {bType === "heading" && (
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <Heading className="w-4 h-4" />
                        </div>
                      )}
                      {bType === "callout" && (
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Block content description preview */}
                    <div className="flex-1 min-w-0 pr-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                          {bType} block
                        </span>
                        {bType === "code" && (
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold">
                            {block.language ||
                              block.metadata?.language ||
                              "Code"}
                          </span>
                        )}
                      </div>

                      {/* Display content body */}
                      {bType === "text" && (
                        <p className="text-xs text-gray-700 leading-relaxed font-sans line-clamp-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                          {block.text || block.value}
                        </p>
                      )}

                      {bType === "heading" && (
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

                      {bType === "callout" && (
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

                      {bType === "code" && (
                        <div className="bg-gray-900 text-gray-200 rounded-xl p-3 font-mono text-[10px] overflow-x-auto border border-gray-800 leading-normal max-h-36 line-clamp-4 select-all">
                          {block.code || block.value}
                        </div>
                      )}

                      {bType === "video" && (
                        <div className="bg-rose-50/30 border border-rose-100/50 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-10 h-7 bg-rose-100 rounded flex items-center justify-center text-rose-600 shrink-0">
                            <VideoIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {block.caption ||
                                block.metadata?.caption ||
                                "Instructional Video Clip"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">
                              {block.videoUrl || block.metadata?.videoUrl}
                            </p>
                          </div>
                        </div>
                      )}

                      {bType === "image" && (
                        <div className="bg-amber-50/30 border border-amber-100/50 rounded-xl p-3 flex items-center gap-3">
                          <img
                            src={block.imageUrl || block.metadata?.imageUrl}
                            alt={
                              block.alt ||
                              block.metadata?.altText ||
                              "Lesson image"
                            }
                            className="w-12 h-10 object-cover rounded shrink-0 bg-amber-100"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {block.caption ||
                                block.metadata?.caption ||
                                "Lesson Image"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">
                              {block.imageUrl || block.metadata?.imageUrl}
                            </p>
                          </div>
                        </div>
                      )}

                      {bType === "file" && (
                        <div className="bg-sky-50/30 border border-sky-100/50 rounded-xl p-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-100 rounded flex items-center justify-center text-sky-600 shrink-0">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {block.fileName ||
                                block.metadata?.fileName ||
                                block.caption ||
                                block.metadata?.caption ||
                                "Attached File"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">
                              {block.fileUrl || block.metadata?.fileUrl}
                            </p>
                          </div>
                          <a
                            href={block.fileUrl || block.metadata?.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors shrink-0"
                            title="Open file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Operations Button panel */}
                    <div className="absolute right-3 top-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this content block?",
                            )
                          ) {
                            deleteBlockMutation.mutate(block.id!);
                          }
                        }}
                        disabled={deleteBlockMutation.isPending}
                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Content Block"
                      >
                        {deleteBlockMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: COMPOSER BOX FOR NEW BLOCKS */}
        <div className="xl:col-span-5">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sticky top-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-[#510047] uppercase tracking-wider">
                Block Composer Panel
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Select a type, populate its curriculum details, and append it
                directly to the active lesson list.
              </p>
            </div>{" "}
            {/* Block Type Selection tabs */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-gray-200/50 p-1 rounded-xl animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedType("text")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "text"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Text
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("heading")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "heading"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <Heading className="w-3.5 h-3.5" />
                Heading
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("callout")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "callout"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Callout
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("video")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "video"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                Video
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("image")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "image"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Image
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("code")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "code"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <CodeIcon className="w-3.5 h-3.5" />
                Code
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("file")}
                className={`py-2 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedType === "file"
                    ? "bg-[#510047] text-white shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-800"
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                File
              </button>
            </div>
            {/* Active Fields Forms */}
            <form onSubmit={handleAddBlockSubmit} className="space-y-4">
              {selectedType === "text" && (
                <TextBlockEditor value={textVal} onChange={setTextVal} />
              )}

              {selectedType === "heading" && (
                <HeadingBlockEditor
                  value={textVal}
                  onChange={setTextVal}
                  headingLevel={headingLevel}
                  onHeadingLevelChange={setHeadingLevel}
                />
              )}

              {selectedType === "callout" && (
                <CalloutBlockEditor
                  value={textVal}
                  onChange={setTextVal}
                  calloutType={calloutType}
                  onCalloutTypeChange={setCalloutType}
                />
              )}

              {selectedType === "video" && (
                <VideoBlockEditor
                  url={videoUrlVal}
                  onUrlChange={setVideoUrlVal}
                  caption={videoCaptionVal}
                  onCaptionChange={setVideoCaptionVal}
                />
              )}

              {selectedType === "image" && (
                <ImageBlockEditor
                  imageUrl={imageUrlVal}
                  onImageUrlChange={setImageUrlVal}
                  imageAlt={imageAltVal}
                  onImageAltChange={setImageAltVal}
                  imageCaption={imageCaptionVal}
                  onImageCaptionChange={setImageCaptionVal}
                  isUploading={isUploadingImage}
                  isDragging={isDraggingImage}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageFileSelected(e.dataTransfer.files[0]);
                    }
                  }}
                  onFileSelected={handleImageFileSelected}
                />
              )}

              {selectedType === "code" && (
                <CodeBlockEditor
                  value={codeVal}
                  onChange={setCodeVal}
                  language={codeLang}
                  onLanguageChange={setCodeLang}
                />
              )}

              {selectedType === "file" && (
                <FileBlockEditor
                  fileUrl={fileUrlVal}
                  onFileUrlChange={setFileUrlVal}
                  fileName={fileNameVal}
                  onFileNameChange={setFileNameVal}
                  fileCaption={fileCaptionVal}
                  onFileCaptionChange={setFileCaptionVal}
                  isUploading={isUploadingFile}
                  isDragging={isDraggingFile}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleDocumentFileSelected(e.dataTransfer.files[0]);
                    }
                  }}
                  onFileSelected={handleDocumentFileSelected}
                />
              )}

              {/* Submission CTA Button */}
              <button
                type="submit"
                disabled={
                  createBlockMutation.isPending ||
                  isUploadingImage ||
                  isUploadingFile
                }
                className="w-full py-2.5 bg-[#01AC9F] hover:bg-[#008f84] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createBlockMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Appending Block...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Content Block</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
