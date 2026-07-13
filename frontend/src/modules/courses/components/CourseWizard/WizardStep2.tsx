import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Module, Submodule } from "../../../../types";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Menu,
  FileText,
  BookOpen,
  FolderOpen,
  Folder,
  Loader2,
  AlertCircle,
  X,
  Save,
} from "lucide-react";
import curriculumService from "../../../../services/curriculumService";
import { useApp } from "../../../../context/AppContext";

interface WizardStep2Props {
  courseData: any;
  setCourseData: (val: any) => void;
  onEditSubmoduleContent: (submoduleId: number) => void;
}

export const WizardStep2: React.FC<WizardStep2Props> = ({
  courseData,
  setCourseData,
  onEditSubmoduleContent,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useApp();

  const [collapsedModules, setCollapsedModules] = useState<
    Record<number, boolean>
  >({});

  // Inline Form States (Replacing window.prompt!)
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const [addingSubmoduleForId, setAddingSubmoduleForId] = useState<
    number | null
  >(null);
  const [newSubmoduleTitle, setNewSubmoduleTitle] = useState("");

  const courseId = courseData?.id;

  const {
    data: fetchedModules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Module[], Error>({
    queryKey: ["curriculum", courseId],
    queryFn: () => curriculumService.getCourseCurriculum(courseId),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (fetchedModules && fetchedModules.length > 0) {
      setCourseData((prev: any) => ({
        ...prev,
        modules: fetchedModules,
      }));
    }
  }, [fetchedModules, setCourseData]);

  // Mutation: Create Module
  const createModuleMutation = useMutation({
    mutationFn: (newModule: Partial<Module>) =>
      curriculumService.createModule(courseId, newModule),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["curriculum", courseId] });
      setCourseData((prev: any) => ({
        ...prev,
        modules: [...(prev.modules || []), data],
      }));
      showToast("Module folder created successfully!", "success");
      setIsAddingModule(false);
      setNewModuleTitle("");
    },
    onError: (err: any) => {
      showToast("Failed to create module. Ensure server is online.", "error");
    },
  });

  // Mutation: Create Submodule
  const createSubmoduleMutation = useMutation({
    mutationFn: ({
      moduleId,
      data,
    }: {
      moduleId: number;
      data: Partial<Submodule>;
    }) => curriculumService.createSubmodule(courseId, moduleId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["curriculum", courseId] });
      setCourseData((prev: any) => {
        const updatedModules = (prev.modules || []).map((m: any) => {
          if (m.id === variables.moduleId) {
            return { ...m, submodules: [...(m.submodules || []), data] };
          }
          return m;
        });
        return { ...prev, modules: updatedModules };
      });
      showToast("Submodule lesson added successfully!", "success");
      setAddingSubmoduleForId(null);
      setNewSubmoduleTitle("");
    },
    onError: (err: any) => {
      showToast("Failed to create submodule.", "error");
    },
  });

  const toggleModuleCollapse = (moduleId: number) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const submitNewModule = () => {
    if (!newModuleTitle.trim()) {
      showToast("Please enter a module title.", "error");
      return;
    }
    const currentModules =
      fetchedModules.length > 0 ? fetchedModules : courseData.modules || [];
    createModuleMutation.mutate({
      title: newModuleTitle.trim(),
      moduleOrder: currentModules.length + 1,
      isActive: true,
    });
  };

  const submitNewSubmodule = (moduleId: number) => {
    if (!newSubmoduleTitle.trim()) {
      showToast("Please enter a submodule title.", "error");
      return;
    }
    const currentModules =
      fetchedModules.length > 0 ? fetchedModules : courseData.modules || [];
    const parentModule = currentModules.find((m: any) => m.id === moduleId);
    if (!parentModule) return;

    createSubmoduleMutation.mutate({
      moduleId,
      data: {
        title: newSubmoduleTitle.trim(),
        slug: `submodule-${Date.now()}`,
        description: "Introduce what topics will be mastered in this lesson.",
        submoduleOrder: (parentModule.submodules || []).length + 1,
        isActive: true,
      },
    });
  };

  const modulesToShow: Module[] =
    fetchedModules.length > 0 ? fetchedModules : courseData.modules || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info Banner */}
      <div className="bg-[#4A1E47] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#ffd7f0] bg-white/10 px-2.5 py-1 rounded-full">
            Step 2 of 4
          </span>
          <h2 className="text-lg font-bold mt-2 tracking-tight">
            Curriculum Structure
          </h2>
          <p className="text-xs text-gray-200 mt-1 max-w-xl">
            Deconstruct your training program into hierarchical Modules and
            nested Submodules.
          </p>
        </div>
      </div>

      {/* Control row with utilities */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-[#510047] animate-spin" />
          )}
          <p className="text-[11px] font-bold text-gray-400 font-mono">
            Modules count: {modulesToShow.length}
          </p>
        </div>
      </div>

      {/* Loading Block State */}
      {isLoading && modulesToShow.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500 border rounded-2xl bg-white">
          <Loader2 className="w-8 h-8 text-[#510047] animate-spin" />
          <p className="text-xs font-medium">
            Fetching course curriculum skeleton...
          </p>
        </div>
      )}

      {/* Connection Failure Graceful State */}
      {isError && modulesToShow.length === 0 && (
        <div className="py-16 px-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">
              Spring Boot REST Server Unreachable
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-lg">
              {error?.message ||
                "Failed to connect. Verify your local server is online."}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-50"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Modules list structure */}
      {(!isLoading || modulesToShow.length > 0) && (
        <div className="space-y-4">
          {modulesToShow.length > 0
            ? modulesToShow.map((mod, modIdx) => {
                const isCollapsed = collapsedModules[mod.id!] ?? false;

                return (
                  <div
                    key={mod.id ?? `temp-mod-${modIdx}`}
                    className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden transition-all"
                  >
                    {/* Module Header Panel */}
                    <div
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors ${isCollapsed ? "bg-white" : "bg-[#510047]/5"}`}
                      onClick={() => toggleModuleCollapse(mod.id!)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Menu
                          className="w-4 h-4 text-gray-300 shrink-0 cursor-grab"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {isCollapsed ? (
                          <Folder className="w-5 h-5 text-[#510047] shrink-0" />
                        ) : (
                          <FolderOpen className="w-5 h-5 text-[#510047] shrink-0" />
                        )}
                        <span className="font-bold text-sm text-gray-800 truncate">
                          {mod.title}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setAddingSubmoduleForId(mod.id!)}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#01AC9F] hover:bg-[#01AC9F]/10 rounded-md border border-[#01AC9F]/20 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Submodule
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleModuleCollapse(mod.id!)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Nested Submodules Stack */}
                    {!isCollapsed && (
                      <div className="p-4 bg-gray-50/40 border-t border-gray-50 space-y-3">
                        {(mod.submodules || []).length > 0
                          ? (mod.submodules || []).map((sub, subIdx) => (
                              <div
                                key={sub.id ?? `temp-sub-${subIdx}`}
                                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#ffd7f0] transition-colors pl-8 relative"
                              >
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-gray-100" />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="font-semibold text-xs text-gray-800 truncate">
                                      {sub.title}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onEditSubmoduleContent(sub.id!)
                                    }
                                    className="px-3.5 py-1.5 bg-[#01AC9F]/10 text-[#01AC9F] hover:bg-[#01AC9F] hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Write
                                    Lesson
                                  </button>
                                </div>
                              </div>
                            ))
                          : addingSubmoduleForId !== mod.id && (
                              <div className="py-4 text-center text-xs text-gray-400 italic pl-6">
                                No submodules created under this segment.
                              </div>
                            )}

                        {/* INLINE SUBMODULE FORM */}
                        {addingSubmoduleForId === mod.id && (
                          <div className="pl-8 relative mt-2 animate-fade-in">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#01AC9F]" />
                            <div className="bg-white border border-[#01AC9F] rounded-xl p-3 shadow-sm flex items-center gap-3">
                              <input
                                autoFocus
                                type="text"
                                value={newSubmoduleTitle}
                                onChange={(e) =>
                                  setNewSubmoduleTitle(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  submitNewSubmodule(mod.id!)
                                }
                                placeholder="e.g. Introduction to Variables"
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#01AC9F]"
                              />
                              <button
                                disabled={createSubmoduleMutation.isPending}
                                onClick={() => submitNewSubmodule(mod.id!)}
                                className="px-3 py-1.5 bg-[#01AC9F] text-white text-xs font-bold rounded-lg hover:bg-[#008f84]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setAddingSubmoduleForId(null);
                                  setNewSubmoduleTitle("");
                                }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            : !isAddingModule && (
                <div className="py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center justify-center">
                  <Folder className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-600">
                    Your curriculum structure is empty.
                  </p>
                  <button
                    onClick={() => setIsAddingModule(true)}
                    className="mt-4 px-4 py-2 bg-white border border-gray-200 text-[#510047] text-xs font-bold rounded-lg hover:bg-gray-50"
                  >
                    Create First Module Node
                  </button>
                </div>
              )}

          {/* INLINE MODULE FORM */}
          {isAddingModule && (
            <div className="bg-white border-2 border-[#01AC9F] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in mt-4">
              <input
                autoFocus
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewModule()}
                placeholder="e.g. Module 1: System Basics"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#01AC9F]"
              />
              <div className="flex gap-2">
                <button
                  disabled={createModuleMutation.isPending}
                  onClick={submitNewModule}
                  className="px-4 py-2 bg-[#01AC9F] text-white text-xs font-bold rounded-lg hover:bg-[#008f84] flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  onClick={() => {
                    setIsAddingModule(false);
                    setNewModuleTitle("");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trigger for Module Inline Form */}
      {!isAddingModule && modulesToShow.length > 0 && (
        <button
          type="button"
          onClick={() => setIsAddingModule(true)}
          className="w-full py-4 bg-white border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 font-bold hover:bg-gray-50 hover:border-[#510047] hover:text-[#510047] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Curriculum Module Node
        </button>
      )}
    </div>
  );
};
