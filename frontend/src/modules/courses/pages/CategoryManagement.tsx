import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  FolderOpen,
} from "lucide-react";
import categoryService from "../../../services/categoryService";
import { Category } from "../../../types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Custom Accessible Modal Component
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content container */}
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col z-10 animate-fade-in animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-800 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
};

export default function CategoryManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "💻",
    color: "#01AC9F",
    isActive: true,
  });

  // 1. Fetch Categories Query
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  });

  // 2. Create Category Mutation
  const createMutation = useMutation({
    mutationFn: (newCategory: Partial<Category>) =>
      categoryService.create(newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error("[CategoryManagement] Error creating category:", err);
    },
  });

  // 3. Update Category Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error("[CategoryManagement] Error updating category:", err);
    },
  });

  // 4. Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: any) => {
      console.error("[CategoryManagement] Error deleting category:", err);
    },
  });

  // Filter Categories on the client side
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const nameMatch = cat.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const descMatch = cat.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      return nameMatch || descMatch;
    });
  }, [categories, searchQuery]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "💻",
      color: "#01AC9F",
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      icon: category.icon || "💻",
      color: category.color || "#01AC9F",
      isActive: (category.active ?? category.isActive) !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number | undefined, name: string) => {
    if (!id) return;
    if (
      confirm(
        `Are you sure you want to delete the category "${name}"? This action will perform a hard delete on the database.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload: Partial<Category> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon,
      color: formData.color,
      active: formData.isActive,
      isActive: formData.isActive,
    };

    if (editingCategory && editingCategory.id !== undefined) {
      updateMutation.mutate({ id: editingCategory.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#510047]">Category Manager</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            LMS Categories
          </h1>
          <p className="text-sm text-gray-500">
            Manage course classification, branding icons, and curriculum
            organization nodes.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#01AC9F] hover:bg-[#008f84] text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Category
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search Bar / Filters */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0]"
            />
          </div>
          <div className="text-xs text-gray-400 font-mono self-end sm:self-auto">
            Total: {filteredCategories.length} items
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 text-[#510047] animate-spin" />
            <p className="text-xs font-medium">
              Retrieving Categories from REST server...
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="py-16 px-4 flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <div>
              <p className="text-sm font-bold text-gray-800">
                Server Communication Failed
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                {(error as any)?.message ||
                  "An error occurred while connecting to the Spring Boot REST endpoints."}
              </p>
            </div>
            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["categories"] })
              }
              className="mt-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredCategories.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center text-gray-400">
            <FolderOpen className="w-12 h-12 text-gray-300" />
            <div>
              <p className="text-sm font-bold text-gray-600">
                No Categories Found
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Get started by creating your first catalog organizational node.
              </p>
            </div>
          </div>
        )}

        {/* Table Data */}
        {!isLoading && !isError && filteredCategories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Icon & Name
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border shadow-sm"
                          style={{
                            backgroundColor: `${cat.color || "#01AC9F"}15`,
                            borderColor: `${cat.color || "#01AC9F"}30`,
                            color: cat.color || "#01AC9F",
                          }}
                        >
                          {cat.icon || "💻"}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-gray-800 block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ID: {cat.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 max-w-md line-clamp-2 leading-relaxed">
                        {cat.description || (
                          <em className="text-gray-300">
                            No description provided
                          </em>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${(cat.active ?? cat.isActive) !== false ? "bg-[#01AC9F]" : "bg-gray-300"}`}
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {(cat.active ?? cat.isActive) !== false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 text-gray-400 hover:text-[#510047] hover:bg-[#ffd7f0]/40 rounded-lg transition-all"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cloud Architecture"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0]"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Provide a concise taxonomy descriptions..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-[#510047] resize-none focus:ring-1 focus:ring-[#ffd7f0]"
            />
          </div>

          {/* Icon Selection & Theme Accent Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Representative Icon
              </label>
              <input
                type="text"
                placeholder="e.g. 🧠"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-[#510047]"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {["💻", "🧠", "🛡️", "🎨", "📈", "🏛️"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: item })}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs border ${formData.icon === item ? "border-[#510047] bg-[#ffd7f0]/30 font-bold" : "border-gray-100 bg-gray-50"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono focus:outline-none focus:bg-white focus:border-[#510047]"
                />
              </div>
              <div className="flex gap-1 mt-2">
                {["#01AC9F", "#510047", "#2563EB", "#EA580C", "#16A34A"].map(
                  (hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: hex })}
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Active Toggle Switch */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-600 block">
                Category Status
              </span>
              <span className="text-[10px] text-gray-400">
                Specify if this node is active and visible in catalog
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, isActive: !formData.isActive })
              }
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.isActive ? "bg-[#01AC9F]" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Mutation state or errors */}
          {(createMutation.isError || updateMutation.isError) && (
            <div className="p-2.5 bg-red-50 text-red-700 text-[10px] font-semibold rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Failed to submit form. Verify backend server is alive.
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 bg-[#01AC9F] hover:bg-[#008f84] text-white font-bold text-xs rounded-lg shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {editingCategory ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
