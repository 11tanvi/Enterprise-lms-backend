import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Layers, AlertCircle, Plus, Search, Calendar, X, Loader2 } from 'lucide-react';
import { batchService } from '../api/batchService';
import { courseService } from '../../../services/courseService';
import { useApp } from '../../../context/AppContext';
import { BatchHeader } from '../components/BatchHeader';
import { BatchMetricCard } from '../components/BatchMetricCard';
import { BatchTable } from '../components/BatchTable';
import { StudentSelector } from '../components/StudentSelector';
import { Batch } from '../types/batch';

export const BatchDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Form States (for create/edit)
  const [formName, setFormName] = useState('');
  const [formBatchCode, setFormBatchCode] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // 1. Fetch Batches
  const {
    data: batches = [],
    isLoading: isLoadingBatches,
    isError,
    refetch
  } = useQuery<Batch[], Error>({
    queryKey: ['batches', 'my'],
    queryFn: () => batchService.getMyBatches(),
    retry: 1,
  });

  // 2. Fetch Courses (for dropdown)
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
    retry: 1,
  });

  // 3. Fetch all active student users
  const { data: availableStudents = [] } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => batchService.getStudentsByRole('STUDENT'),
    retry: 1,
  });

  // 4. Fetch students of the selected batch
  const { data: batchStudents = [] } = useQuery({
    queryKey: ['batchStudents', selectedBatch?.id],
    queryFn: () => batchService.getStudents(selectedBatch!.id),
    enabled: !!selectedBatch?.id,
    retry: 1,
  });

  const selectedStudentIds = useMemo(() => {
    return batchStudents.map((s: any) => s.studentId);
  }, [batchStudents]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Batch>) => batchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast('Successfully created batch!', 'success');
      setIsCreateEditModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to create batch', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Batch> }) => batchService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast('Successfully updated batch!', 'success');
      setIsCreateEditModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to update batch', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => batchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast('Successfully deleted batch!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedBatch(null);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete batch', 'error');
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: ({ batchId, studentId }: { batchId: string | number; studentId: string | number }) =>
      batchService.addStudent(batchId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchStudents', selectedBatch?.id] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast('Successfully enrolled student in batch!', 'success');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to enroll student', 'error');
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ batchId, studentId }: { batchId: string | number; studentId: string | number }) =>
      batchService.removeStudent(batchId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchStudents', selectedBatch?.id] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast('Successfully removed student from batch!', 'success');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to remove student', 'error');
    },
  });

  // Separate Published and Draft Batches
  const publishedBatches = useMemo(() => {
    return batches.filter(b => b.isActive !== false);
  }, [batches]);

  const draftBatches = useMemo(() => {
    return batches.filter(b => b.isActive === false);
  }, [batches]);

  // Derived Stats over published batches only
  const stats = useMemo(() => {
    const total = publishedBatches.length;
    const active = publishedBatches.filter(b => b.isActive !== false).length;
    const upcoming = publishedBatches.filter(b => b.startDate && new Date(b.startDate) > new Date()).length;
    const completed = publishedBatches.filter(b => b.endDate && new Date(b.endDate) < new Date()).length;

    return { total, active, upcoming, completed };
  }, [publishedBatches]);

  // Filtered Batches over published batches only
  const filteredBatches = useMemo(() => {
    return publishedBatches.filter(batch => {
      const matchesSearch =
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (batch.batchCode && batch.batchCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (batch.courseTitle && batch.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (batch.courseName && batch.courseName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCourse = selectedCourseFilter === 'ALL' || String(batch.courseId) === selectedCourseFilter;

      const isActive = batch.isActive !== false;
      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isActive) ||
        (selectedStatusFilter === 'INACTIVE' && !isActive);

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [publishedBatches, searchQuery, selectedCourseFilter, selectedStatusFilter]);

  const resetForm = () => {
    setSelectedBatch(null);
    setFormName('');
    setFormBatchCode('');
    setFormCourseId('');
    setFormStartDate('');
    setFormEndDate('');
    setFormIsActive(true);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateEditModalOpen(true);
  };

  const handleOpenEditModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormName(batch.name);
    setFormBatchCode(batch.batchCode || '');
    setFormCourseId(String(batch.courseId));
    setFormStartDate(batch.startDate ? batch.startDate.slice(0, 16) : '');
    setFormEndDate(batch.endDate ? batch.endDate.slice(0, 16) : '');
    setFormIsActive(batch.isActive !== false);
    setIsCreateEditModalOpen(true);
  };

  const handleOpenDeleteModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDeleteModalOpen(true);
  };

  const handleOpenViewModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsViewModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBatchCode.trim() || !formCourseId) {
      showToast('Name, Batch Code, and Course are required fields.', 'error');
      return;
    }

    const payload: Partial<Batch> = {
      name: formName,
      batchCode: formBatchCode,
      courseId: Number(formCourseId),
      startDate: formStartDate ? new Date(formStartDate).toISOString() : undefined,
      endDate: formEndDate ? new Date(formEndDate).toISOString() : undefined,
      isActive: formIsActive,
    };

    if (selectedBatch) {
      updateMutation.mutate({ id: selectedBatch.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedBatch) {
      deleteMutation.mutate(selectedBatch.id);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" id="batch-dashboard-view">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8" id="batch-dashboard-top-section">
        <div className="flex-1 min-w-0">
          <BatchHeader 
            title="Batch Management" 
            description="Create, monitor, and configure training batches and student rosters."
          />
        </div>
        <div className="mt-4 md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => navigate('/teacher/batches/create')}
            className="inline-flex items-center justify-center bg-[#6C1D5F] text-white h-[44px] px-6 rounded-xl font-semibold hover:bg-[#4A1E47] transition-all cursor-pointer shadow-sm"
            id="create-batch-btn"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Batch
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" id="batch-dashboard-metrics">
        <BatchMetricCard 
          title="Total Batches" 
          value={stats.total} 
          description="Total learning cohorts configured"
          icon={<Layers className="h-6 w-6" />}
        />
        <BatchMetricCard 
          title="Active Batches" 
          value={stats.active} 
          description="Cohorts currently in session"
          icon={<Users className="h-6 w-6" />}
        />
        <BatchMetricCard 
          title="Upcoming" 
          value={stats.upcoming} 
          description="Scheduled Future Cohorts"
          icon={<Calendar className="h-6 w-6 text-yellow-600" />}
        />
        <BatchMetricCard 
          title="Completed" 
          value={stats.completed} 
          description="Cohorts completely graduated"
          icon={<AlertCircle className="h-6 w-6 text-green-600" />}
        />
      </div>

      {/* Draft Batches Section */}
      {!isLoadingBatches && !isError && draftBatches.length > 0 && (
        <div className="mb-10 animate-fade-in" id="draft-batches-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-[#111827]">My Draft Batches</h2>
            <span className="text-xs font-semibold text-[#6C1D5F] bg-[#6C1D5F]/10 px-2.5 py-1 rounded-full">
              {draftBatches.length} Draft{draftBatches.length > 1 ? 's' : ''} in progress
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {draftBatches.map((draft) => (
              <div
                key={draft.id}
                className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 flex flex-col justify-between transition-all hover:shadow-md"
                id={`draft-card-${draft.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/10">
                      Draft
                    </span>
                    <span className="text-xs font-mono text-[#6B7280]">
                      {draft.batchCode || 'No Code'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#111827] mb-1 line-clamp-1">
                    {draft.name}
                  </h4>
                  <p className="text-sm text-[#6B7280] mb-4">
                    Course: <span className="font-semibold text-[#111827]">{draft.courseTitle || draft.courseName || `ID: ${draft.courseId}`}</span>
                  </p>
                </div>
                <div className="border-t border-[#E5E7EB] pt-4 mt-auto">
                  <p className="text-xs text-[#9CA3AF] mb-4">
                    Last Modified: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString() : draft.createdAt ? new Date(draft.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/teacher/batches/create', { state: { draftBatchId: draft.id } })}
                      className="flex-1 inline-flex justify-center items-center rounded-xl bg-[#F6F8FC] hover:bg-[#6C1D5F]/10 px-4 py-2 text-sm font-semibold text-[#6C1D5F] transition-all cursor-pointer border border-transparent"
                    >
                      Continue Editing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(draft)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[#E5E7EB] text-[#EF4444] hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                      title="Delete Draft"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 mb-8" id="batch-filters-bar">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search bar */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batches..."
              className="block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 pl-11 pr-3 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
              id="search-input"
            />
          </div>

          {/* Filter dropdown by course */}
          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
              id="course-filter-select"
            >
              <option value="ALL">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
              id="status-filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="mb-8" id="batch-list-section">
        {isLoadingBatches ? (
          <div className="flex flex-col items-center justify-center py-12" id="loading-spinner">
            <Loader2 className="h-8 w-8 animate-spin text-[#6C1D5F]" />
            <p className="mt-2 text-sm text-[#6B7280]">Retrieving batches...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-sm text-[#6B7280]" id="error-fallback">
            <AlertCircle className="mx-auto h-12 w-12 text-[#9CA3AF] mb-3" />
            <p className="font-semibold text-[#111827]">Failed to connect to backend service</p>
            <p className="mt-1">Safely rendered empty state. Please verify backend server state.</p>
          </div>
        ) : (
          <BatchTable
            batches={filteredBatches}
            onViewDetails={(id) => {
              navigate(`/teacher/batches/${id}`);
            }}
            onEdit={(id) => {
              const b = batches.find(x => String(x.id) === String(id));
              if (b) {
                navigate('/teacher/batches/create', { state: { batchId: b.id } });
              }
            }}
            onDelete={(id) => {
              const b = batches.find(x => String(x.id) === String(id));
              if (b) handleOpenDeleteModal(b);
            }}
          />
        )}
      </div>

      {/* 1. Create / Edit Batch Modal */}
      {isCreateEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="create-edit-modal">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateEditModalOpen(false)}></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pb-6 pt-6 sm:p-8">
                  <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E5E7EB]">
                    <h3 className="text-xl font-semibold text-[#111827]" id="modal-title">
                      {selectedBatch ? 'Edit Batch Details' : 'Configure New Batch'}
                    </h3>
                    <button type="button" onClick={() => setIsCreateEditModalOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="batch-name" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">Batch Name</label>
                      <input
                        type="text"
                        id="batch-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Cohort Alpha"
                        className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="batch-code" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">Batch Code</label>
                      <input
                        type="text"
                        id="batch-code"
                        value={formBatchCode}
                        onChange={(e) => setFormBatchCode(e.target.value)}
                        placeholder="e.g. JAVA-2026-A"
                        className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="batch-course" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">Associated Course</label>
                      <select
                        id="batch-course"
                        value={formCourseId}
                        onChange={(e) => setFormCourseId(e.target.value)}
                        className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                        required
                        disabled={!!selectedBatch}
                      >
                        <option value="">Select a Course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="batch-start-date" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">Start Date</label>
                        <input
                          type="datetime-local"
                          id="batch-start-date"
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label htmlFor="batch-end-date" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">End Date</label>
                        <input
                          type="datetime-local"
                          id="batch-end-date"
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center pt-2">
                      <input
                        type="checkbox"
                        id="batch-active"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-[#E5E7EB] text-[#6C1D5F] focus:ring-[#6C1D5F]"
                      />
                      <label htmlFor="batch-active" className="ml-2 block text-sm font-medium text-[#111827]">Is Active Cohort</label>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F6F8FC] px-6 py-4 sm:flex sm:flex-row-reverse border-t border-[#E5E7EB]">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="inline-flex w-full justify-center rounded-xl bg-[#6C1D5F] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4A1E47] sm:ml-3 sm:w-auto disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateEditModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] sm:mt-0 sm:w-auto transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="delete-modal">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-6 pb-6 pt-6 sm:p-8">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-[#EF4444]" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-xl font-semibold text-[#111827]">Delete Learning Batch</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">
                      Are you absolutely sure you want to delete the batch <strong className="text-[#111827]">"{selectedBatch?.name}"</strong>? This will permanently dismantle the cohort and remove all student enrollments. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#F6F8FC] px-6 py-4 sm:flex sm:flex-row-reverse border-t border-[#E5E7EB]">
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={handleDeleteConfirm}
                  className="inline-flex w-full justify-center rounded-xl bg-[#EF4444] px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 transition-all cursor-pointer"
                >
                  {deleteMutation.isPending ? 'Decomposing...' : 'Confirm Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] sm:mt-0 sm:w-auto transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. View Details / Manage Roster Modal */}
      {isViewModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="view-details-modal">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsViewModalOpen(false)}></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
              <div className="bg-white px-6 pb-6 pt-6 sm:p-8">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E5E7EB]">
                  <h3 className="text-xl font-bold text-[#111827]">
                    Cohort: {selectedBatch.name}
                  </h3>
                  <button type="button" onClick={() => setIsViewModalOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Metadata info */}
                  <div className="space-y-6 md:col-span-1 border-r border-[#E5E7EB] pr-4">
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Batch Code</h4>
                      <p className="text-sm font-mono font-semibold text-[#111827] mt-1">{selectedBatch.batchCode}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Teacher Owner</h4>
                      <p className="text-sm font-semibold text-[#111827] mt-1">{selectedBatch.teacherName || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Course Curriculum</h4>
                      <p className="text-sm font-semibold text-[#111827] mt-1">{selectedBatch.courseTitle || `Course ID: ${selectedBatch.courseId}`}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Start Date</h4>
                      <p className="text-sm font-semibold text-[#111827] mt-1">{selectedBatch.startDate ? new Date(selectedBatch.startDate).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">End Date</h4>
                      <p className="text-sm font-semibold text-[#111827] mt-1">{selectedBatch.endDate ? new Date(selectedBatch.endDate).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Roster Count / Capacity</h4>
                      <p className="text-sm font-semibold text-[#111827] mt-1">{selectedBatch.studentCount ?? 0} / {selectedBatch.capacity || 30}</p>
                    </div>
                  </div>

                  {/* Student selector / enrollment assembly */}
                  <div className="md:col-span-2">
                    <StudentSelector
                      availableStudents={availableStudents}
                      selectedStudentIds={selectedStudentIds}
                      onAddStudent={(studentId) => {
                        addStudentMutation.mutate({ batchId: selectedBatch.id, studentId });
                      }}
                      onRemoveStudent={(studentId) => {
                        removeStudentMutation.mutate({ batchId: selectedBatch.id, studentId });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F6F8FC] px-6 py-4 border-t border-[#E5E7EB] text-right">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="inline-flex w-full justify-center rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] transition-all sm:w-auto cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDashboard;
