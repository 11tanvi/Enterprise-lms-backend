import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Check,
  X,
  Calendar,
  Plus,
  Layers,
  Users,
  BookOpen,
  Loader2,
  ArrowLeft,
  Save,
  FileText,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { batchService } from '../api/batchService';
import { courseService } from '../../../services/courseService';
import { enrollmentService } from '../../../services/enrollmentService';
import { Batch } from '../types/batch';

export const CreateBatchWizard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const location = useLocation();

  const editingBatchId = location.state?.draftBatchId || location.state?.batchId;

  // Fetch details if we are continuing a draft
  const { data: editingBatch, isLoading: isLoadingEditingBatch } = useQuery({
    queryKey: ['batches', editingBatchId],
    queryFn: () => batchService.getById(editingBatchId),
    enabled: !!editingBatchId,
  });

  // Fetch existing students of the editing batch
  const { data: existingBatchStudents = [] } = useQuery({
    queryKey: ['batchStudents', editingBatchId],
    queryFn: () => batchService.getStudents(editingBatchId),
    enabled: !!editingBatchId,
  });

  // ----------------------------------------------------
  // SECTION 1: Basic Information States
  // ----------------------------------------------------
  const [batchName, setBatchName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState<number>(30);

  // ----------------------------------------------------
  // SECTION 2: Schedule States
  // ----------------------------------------------------
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ----------------------------------------------------
  // SECTION 3: Course Selection States
  // ----------------------------------------------------
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real courses from Spring Boot backend using courseService
  const { data: apiCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
    retry: 1,
  });

  // Filter courses based on search input
  const filteredCourses = useMemo(() => {
    return apiCourses.filter((course: any) =>
      course.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (course.categoryName && course.categoryName.toLowerCase().includes(courseSearch.toLowerCase()))
    );
  }, [apiCourses, courseSearch]);

  // Click outside to close course dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCourseSelection = (course: any) => {
    setSelectedCourses(prev => {
      const isAlreadySelected = prev.some(c => c.id === course.id);
      if (isAlreadySelected) {
        return prev.filter(c => c.id !== course.id);
      } else {
        return [...prev, course];
      }
    });
  };

  // ----------------------------------------------------
  // SECTION 4: Eligible Students States
  // ----------------------------------------------------
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  // ----------------------------------------------------
  // SECTION 5: Selected Trainers States
  // ----------------------------------------------------
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<number[]>([]);
  const [trainerSearch, setTrainerSearch] = useState('');

  // Fetch real trainers / teachers from backend
  const { data: apiTrainers = [], isLoading: isLoadingTrainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => batchService.getStudentsByRole('TEACHER').catch(() => []),
    retry: 1,
  });

  // ----------------------------------------------------
  // SECTION 6: Batch Settings States
  // ----------------------------------------------------
  const [batchSettings, setBatchSettings] = useState({
    allowLateSubmissions: true,
    enableAutoGrading: false,
    notifyStudentsOnPublish: true,
    restrictRosterChanges: false,
  });

  // Extract course IDs of selected courses
  const selectedCourseIds = useMemo(() => selectedCourses.map(c => c.id), [selectedCourses]);

  // Fetch eligible students for selected courses
  const { data: apiStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['eligible-students', selectedCourseIds],
    queryFn: () => enrollmentService.getEligibleStudents(selectedCourseIds),
    enabled: selectedCourseIds.length > 0,
    retry: 1,
  });

  const studentsList = useMemo(() => {
    if (selectedCourseIds.length === 0) return [];
    
    const mappedApiStudents = apiStudents.map((s: any) => ({
      id: s.id,
      name: s.fullName || s.name,
      email: s.email,
      course: s.courseTitles ? s.courseTitles.join(', ') : '',
      status: 'Eligible',
    }));

    const mappedExistingStudents = existingBatchStudents.map((s: any) => ({
      id: s.studentId,
      name: s.studentName || `Student ${s.studentId}`,
      email: s.studentEmail || '',
      course: selectedCourses[0]?.title || '',
      status: 'Enrolled',
    }));

    // Merge uniquely by id
    const mergedMap = new Map<number | string, any>();
    mappedApiStudents.forEach((student: any) => {
      mergedMap.set(student.id, student);
    });
    mappedExistingStudents.forEach((student: any) => {
      if (!mergedMap.has(student.id)) {
        mergedMap.set(student.id, student);
      } else {
        const existing = mergedMap.get(student.id);
        mergedMap.set(student.id, { ...existing, status: 'Enrolled' });
      }
    });

    return Array.from(mergedMap.values());
  }, [apiStudents, existingBatchStudents, selectedCourses, selectedCourseIds]);

  // Sync selected student IDs with the new studentsList
  useEffect(() => {
    if (studentsList.length === 0) return;
    const validIds = studentsList.map(s => s.id);
    setSelectedStudentIds(prev => prev.filter(id => validIds.includes(id)));
  }, [studentsList]);

  // Filter students based on search and status dropdown
  const filteredStudents = useMemo(() => {
    return studentsList.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.course.toLowerCase().includes(studentSearch.toLowerCase());

      const matchesStatus =
        studentStatusFilter === 'ALL' || student.status.toUpperCase() === studentStatusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [studentsList, studentSearch, studentStatusFilter]);

  // Checkbox Select All Toggle
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every(student => selectedStudentIds.includes(student.id));
  }, [filteredStudents, selectedStudentIds]);

  const handleSelectAllStudents = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered students
      const filteredIds = filteredStudents.map(s => s.id);
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered students
      setSelectedStudentIds(prev => {
        const uniqueIds = new Set([...prev, ...filteredStudents.map(s => s.id)]);
        return Array.from(uniqueIds);
      });
    }
  };

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Prefill existing batch details
  useEffect(() => {
    if (editingBatch) {
      setBatchName(editingBatch.name || '');
      setBatchCode(editingBatch.batchCode || '');
      setStartDate(editingBatch.startDate ? editingBatch.startDate.slice(0, 16) : '');
      setEndDate(editingBatch.endDate ? editingBatch.endDate.slice(0, 16) : '');
      setIsActive(editingBatch.isActive !== false);

      // Prefill course
      if (editingBatch.courseId) {
        const courseObj = apiCourses.find((c: any) => c.id === editingBatch.courseId) || {
          id: editingBatch.courseId,
          title: editingBatch.courseTitle || editingBatch.courseName || `Course ${editingBatch.courseId}`
        };
        setSelectedCourses([courseObj]);
      }
    }
  }, [editingBatch, apiCourses]);

  // Load additional metadata from localStorage if editing/continuing a draft
  useEffect(() => {
    if (editingBatchId) {
      const localDataStr = localStorage.getItem(`batch_draft_metadata_${editingBatchId}`);
      if (localDataStr) {
        try {
          const localData = JSON.parse(localDataStr);
          if (localData.description !== undefined) setDescription(localData.description);
          if (localData.capacity !== undefined) setCapacity(localData.capacity);
          if (localData.selectedTrainerIds !== undefined) setSelectedTrainerIds(localData.selectedTrainerIds);
          if (localData.batchSettings !== undefined) setBatchSettings(localData.batchSettings);
        } catch (e) {
          console.error("Failed to parse draft metadata from localStorage", e);
        }
      } else if (editingBatch) {
        // Fallback to checking by batch code
        const codeDataStr = localStorage.getItem(`batch_draft_metadata_${editingBatch.batchCode}`);
        if (codeDataStr) {
          try {
            const localData = JSON.parse(codeDataStr);
            if (localData.description !== undefined) setDescription(localData.description);
            if (localData.capacity !== undefined) setCapacity(localData.capacity);
            if (localData.selectedTrainerIds !== undefined) setSelectedTrainerIds(localData.selectedTrainerIds);
            if (localData.batchSettings !== undefined) setBatchSettings(localData.batchSettings);
          } catch (e) {
            console.error("Failed to parse draft metadata by code", e);
          }
        }
      }
    }
  }, [editingBatchId, editingBatch]);

  // Sync existing student roster
  useEffect(() => {
    if (existingBatchStudents.length > 0) {
      setSelectedStudentIds(existingBatchStudents.map((s: any) => s.studentId));
    }
  }, [existingBatchStudents]);

  // ----------------------------------------------------
  // SECTION 5: Form Submissions / API Requests
  // ----------------------------------------------------
  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Batch>) => {
      // 1. Create the Batch
      const newBatch = await batchService.create(payload);
      
      // 2. Add all selected students sequentially or concurrently
      if (selectedStudentIds.length > 0 && newBatch.id) {
        await Promise.all(
          selectedStudentIds.map(studentId =>
            batchService.addStudent(newBatch.id, studentId).catch(err => {
              console.error(`Failed to enroll student ID ${studentId} in batch ${newBatch.id}:`, err);
            })
          )
        );
      }
      return newBatch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      if (data && data.id) {
        const draftMetadata = {
          description,
          capacity,
          selectedTrainerIds,
          batchSettings,
        };
        localStorage.setItem(`batch_draft_metadata_${data.id}`, JSON.stringify(draftMetadata));
        if (data.batchCode) {
          localStorage.setItem(`batch_draft_metadata_${data.batchCode}`, JSON.stringify(draftMetadata));
        }
      }
      if (data.isActive === false) {
        showToast('Batch saved as draft successfully!', 'success');
      } else {
        showToast('Successfully set up training cohort!', 'success');
      }
      navigate(-1);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to establish training batch.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: Partial<Batch> }) => {
      // 1. Update the Batch
      const updatedBatch = await batchService.update(id, payload);

      // 2. Sync students
      const currentEnrolledIds = existingBatchStudents.map((s: any) => s.studentId);
      const studentsToAdd = selectedStudentIds.filter(sid => !currentEnrolledIds.includes(sid));
      const studentsToRemove = currentEnrolledIds.filter(sid => !selectedStudentIds.includes(sid));

      // Add new students
      if (studentsToAdd.length > 0) {
        await Promise.all(
          studentsToAdd.map(studentId =>
            batchService.addStudent(id, studentId).catch(err => {
              console.error(`Failed to enroll student ID ${studentId} in batch ${id}:`, err);
            })
          )
        );
      }

      // Remove unselected students
      if (studentsToRemove.length > 0) {
        await Promise.all(
          studentsToRemove.map(studentId =>
            batchService.removeStudent(id, studentId).catch(err => {
              console.error(`Failed to remove student ID ${studentId} from batch ${id}:`, err);
            })
          )
        );
      }

      return updatedBatch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['batchStudents', editingBatchId] });
      if (editingBatchId) {
        const draftMetadata = {
          description,
          capacity,
          selectedTrainerIds,
          batchSettings,
        };
        localStorage.setItem(`batch_draft_metadata_${editingBatchId}`, JSON.stringify(draftMetadata));
        if (data && data.batchCode) {
          localStorage.setItem(`batch_draft_metadata_${data.batchCode}`, JSON.stringify(draftMetadata));
        }
      }
      if (data.isActive === false) {
        showToast('Batch draft updated successfully!', 'success');
      } else {
        showToast('Successfully published training cohort!', 'success');
      }
      navigate(-1);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Failed to update training batch.', 'error');
    }
  });

  const handleCreateBatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!batchName.trim()) {
      showToast('Batch Name is required.', 'error');
      return;
    }
    if (!batchCode.trim()) {
      showToast('Batch Code is required.', 'error');
      return;
    }
    if (selectedCourses.length === 0) {
      showToast('Please select at least one course for this batch.', 'error');
      return;
    }
    if (!startDate) {
      showToast('Start Date is required to publish.', 'error');
      return;
    }
    if (!endDate) {
      showToast('End Date is required to publish.', 'error');
      return;
    }
    if (selectedStudentIds.length === 0) {
      showToast('Please select at least one student for this batch.', 'error');
      return;
    }

    const payload: Partial<Batch> = {
      name: batchName,
      batchCode: batchCode,
      courseId: selectedCourses[0].id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive: true, // Publishing forces isActive = true
    };

    if (editingBatchId) {
      updateMutation.mutate({ id: editingBatchId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSaveDraft = () => {
    if (!batchName.trim()) {
      showToast('Batch Name is required to save a draft.', 'error');
      return;
    }
    if (!batchCode.trim()) {
      showToast('Batch Code is required to save a draft.', 'error');
      return;
    }
    if (selectedCourses.length === 0) {
      showToast('Please select at least one course to save a draft.', 'error');
      return;
    }

    const payload: Partial<Batch> = {
      name: batchName,
      batchCode: batchCode,
      courseId: selectedCourses[0].id,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      isActive: false, // Save draft forces isActive = false
    };

    if (editingBatchId) {
      updateMutation.mutate({ id: editingBatchId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const isEditingPublished = !!editingBatchId && editingBatch && editingBatch.isActive !== false;
  const isEditingDraft = !!editingBatchId && editingBatch && editingBatch.isActive === false;

  const pageTitle = useMemo(() => {
    if (!editingBatchId) return 'Create Batch';
    if (isEditingDraft) return 'Edit Draft';
    return 'Edit Batch';
  }, [editingBatchId, isEditingDraft]);

  if (editingBatchId && isLoadingEditingBatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]" id="loading-draft-batch-view">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C1D5F] mb-2" />
        <p className="text-sm text-[#6B7280]">Loading batch details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="create-batch-wizard-view">
      {/* Back navigation & Title */}
      <div className="mb-6 flex items-center justify-between" id="wizard-navigation-header">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-sm font-medium text-[#6B7280] hover:text-[#374151] cursor-pointer"
          id="wizard-back-btn"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cohorts
        </button>
        <span className="inline-flex items-center rounded-full bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-medium text-[#6C1D5F] ring-1 ring-inset ring-[#6C1D5F]/10">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Batch Setup Engine
        </span>
      </div>

      <div className="mb-8" id="wizard-hero-header">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">
          {pageTitle}
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          {editingBatchId ? 'Refine your cohort configurations, set schedules, and select students.' : 'Set up custom structured batches, associate curriculums, and draft the student roster.'}
        </p>
      </div>

      {/* Main Grid: Left is sections, Right is Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="wizard-workspace-grid">
        {/* Interactive Form Column */}
        <div className="lg:col-span-8 space-y-8" id="wizard-left-column">
          
          {/* SECTION 1: Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6" id="basic-info-card">
            <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-[#E5E7EB]">
              <div className="bg-[#F6F8FC] p-2 rounded-xl">
                <FileText className="h-5 w-5 text-[#6C1D5F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Section 1: Basic Information</h2>
                <p className="text-xs text-[#6B7280]">Define general identity details and overall target limits.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="basic-info-form-fields">
              <div>
                <label htmlFor="batch-name-input" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Batch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="batch-name-input"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Java Spring Core - Q3"
                  className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="batch-code-input" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Batch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="batch-code-input"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="e.g. JAVA-2026-Q3"
                  className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="batch-desc-input" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  id="batch-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of this learning cohort, target audience, and expectations..."
                  className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="batch-capacity-input" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Cohort Capacity
                </label>
                <input
                  type="number"
                  id="batch-capacity-input"
                  min={1}
                  max={500}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                />
                <p className="mt-1 text-xs text-[#9CA3AF]">Define maximum allowable students in this cohort.</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6" id="schedule-card">
            <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-[#E5E7EB]">
              <div className="bg-[#F6F8FC] p-2 rounded-xl">
                <Calendar className="h-5 w-5 text-[#6C1D5F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Section 2: Schedule</h2>
                <p className="text-xs text-[#6B7280]">Determine runtime bounds and toggle state active levels.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="schedule-form-fields">
              <div>
                <label htmlFor="start-date-input" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="start-date-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="end-date-input" className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="end-date-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#F6F8FC] rounded-xl" id="status-toggle-wrapper">
                <div>
                  <h4 className="text-sm font-bold text-[#111827]">Cohort Activation Status</h4>
                  <p className="text-xs text-[#6B7280]">Should this batch be visible and accepting materials right away?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] focus:ring-offset-2 ${
                    isActive ? 'bg-[#6C1D5F]' : 'bg-gray-200'
                  }`}
                  id="status-toggle-btn"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Course Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6" id="course-selection-card">
            <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-[#E5E7EB]">
              <div className="bg-[#F6F8FC] p-2 rounded-xl">
                <Layers className="h-5 w-5 text-[#6C1D5F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Section 3: Course Selection</h2>
                <p className="text-xs text-[#6B7280]">Select active learning tracks and link curriculum syllabus blueprints.</p>
              </div>
            </div>

            <div className="space-y-4" id="course-selection-form-fields">
              {/* Dropdown Container */}
              <div className="relative" ref={courseDropdownRef}>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wide">
                  Search & Select Courses <span className="text-red-500">*</span>
                </label>
                
                {/* Search / Multi-select Trigger */}
                <div
                  onClick={() => setIsCourseDropdownOpen(true)}
                  className="mt-1.5 flex items-center justify-between w-full h-[44px] rounded-xl bg-white border border-[#E5E7EB] py-2 px-3 text-left text-[#111827] shadow-sm bg-[#F6F8FC] focus-within:ring-2 focus-within:ring-[#6C1D5F] sm:text-sm cursor-pointer"
                  id="course-dropdown-trigger"
                >
                  <div className="flex flex-1 items-center space-x-2">
                    <Search className="h-4 w-4 text-[#9CA3AF] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder={selectedCourses.length > 0 ? "Add more courses..." : "Search enterprise curriculum catalog..."}
                      value={courseSearch}
                      onChange={(e) => {
                        setCourseSearch(e.target.value);
                        setIsCourseDropdownOpen(true);
                      }}
                      className="w-full bg-transparent border-0 p-0 text-[#111827] placeholder:text-[#9CA3AF] focus:ring-0 sm:text-sm focus:outline-none"
                    />
                  </div>
                  <ChevronDown className="h-5 w-5 text-[#9CA3AF] flex-shrink-0" />
                </div>

                {/* Dropdown Options */}
                {isCourseDropdownOpen && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg border border-[#E5E7EB] rounded-xl focus:outline-none sm:text-sm" id="course-dropdown-options">
                    {isLoadingCourses ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#6C1D5F]" />
                      </div>
                    ) : filteredCourses.length === 0 ? (
                      <p className="p-4 text-center text-sm text-[#6B7280]">No courses matching "{courseSearch}" found.</p>
                    ) : (
                      filteredCourses.map((course: any) => {
                        const isSelected = selectedCourses.some(c => c.id === course.id);
                        return (
                          <div
                            key={course.id}
                            onClick={() => toggleCourseSelection(course)}
                            className="relative flex items-center justify-between cursor-pointer select-none py-2 px-4 hover:bg-[#F6F8FC]"
                          >
                            <div>
                              <p className="font-semibold text-[#111827]">{course.title}</p>
                              {course.categoryName && (
                                <p className="text-xs text-[#6B7280]">{course.categoryName}</p>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[#6C1D5F]" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected Course Chips */}
              <div id="selected-courses-chips">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">Selected Curriculum</h4>
                {selectedCourses.length === 0 ? (
                  <div className="p-4 border border-dashed border-[#E5E7EB] rounded-xl text-center text-sm text-[#9CA3AF]" id="no-courses-selected">
                    No active courses associated yet. Click search bar above to link.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCourses.map(course => (
                      <span
                        key={course.id}
                        className="inline-flex items-center gap-x-1.5 rounded-full bg-[#F6F8FC] px-3 py-1.5 text-xs font-medium text-[#6C1D5F] ring-1 ring-inset ring-[#6C1D5F]/10"
                        id={`course-chip-${course.id}`}
                      >
                        <BookOpen className="h-3.5 w-3.5 mr-0.5" />
                        {course.title}
                        <button
                          type="button"
                          onClick={() => toggleCourseSelection(course)}
                          className="group relative -mr-1 h-3.5 w-3.5 rounded-full hover:bg-[#6C1D5F]/20 flex items-center justify-center cursor-pointer"
                        >
                          <span className="sr-only">Remove course</span>
                          <X className="h-3 w-3 text-[#6C1D5F]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: Eligible Students */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6" id="student-roster-card">
            <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-[#E5E7EB]">
              <div className="bg-[#F6F8FC] p-2 rounded-xl">
                <Users className="h-5 w-5 text-[#6C1D5F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Section 4: Eligible Students</h2>
                <p className="text-xs text-[#6B7280]">Query corporate registries and assemble the initial learning cohort.</p>
              </div>
            </div>

            {/* Sub-Filters / Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6" id="student-filter-toolbar">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students by name, email, or course..."
                  className="block w-full h-[44px] rounded-xl border border-transparent py-2 pl-10 text-[#111827] bg-[#F6F8FC] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-inset focus:ring-[#6C1D5F] sm:text-sm"
                  id="student-search-input"
                />
              </div>

              <div className="sm:w-48">
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="block w-full h-[44px] rounded-xl border border-transparent py-2 px-3 text-[#111827] bg-[#F6F8FC] focus:ring-2 focus:ring-[#6C1D5F] sm:text-sm"
                  id="student-status-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ELIGIBLE">Eligible Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="ENROLLED">Enrolled Only</option>
                  <option value="WAITLISTED">Waitlisted Only</option>
                </select>
              </div>
            </div>

            {/* Large Table */}
            <div className="overflow-x-auto" id="students-table-container">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="bg-[#F6F8FC]">
                  <tr>
                    <th scope="col" className="relative px-6 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={handleSelectAllStudents}
                        className="h-4 w-4 rounded border-[#E5E7EB] text-[#6C1D5F] focus:ring-[#6C1D5F]"
                        id="student-header-checkbox"
                      />
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Primary Course</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Enrollment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-[#6B7280]">
                        {selectedCourseIds.length === 0 ? (
                          "Select one or more courses above to view eligible students."
                        ) : isLoadingStudents ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#6C1D5F]" />
                            Loading eligible students...
                          </span>
                        ) : (
                          "No eligible students match your filters."
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-[#F6F8FC]/50 transition-colors ${
                            isSelected ? 'bg-[#F6F8FC]/20' : ''
                          }`}
                          id={`student-row-${student.id}`}
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectStudent(student.id)}
                              className="h-4 w-4 rounded border-[#E5E7EB] text-[#6C1D5F] focus:ring-[#6C1D5F]"
                              id={`student-checkbox-${student.id}`}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-[#111827]">
                            {student.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-[#6B7280]">
                            {student.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-[#6B7280]">
                            {student.course}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                student.status === 'Enrolled'
                                  ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-650/10'
                                  : student.status === 'Pending'
                                  ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-650/10'
                                  : student.status === 'Waitlisted'
                                  ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-650/10'
                                  : 'bg-[#F6F8FC] text-[#6B7280] border border-[#E5E7EB]'
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Student selection counter */}
            <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]" id="students-counter">
              <p>Showing {filteredStudents.length} of {studentsList.length} registered students.</p>
              <p className="font-semibold text-[#6C1D5F]">{selectedStudentIds.length} students check-selected for batch.</p>
            </div>
          </div>

          {/* SECTION 5: Selected Trainers */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6" id="trainer-selection-card">
            <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-[#E5E7EB]">
              <div className="bg-[#F6F8FC] p-2 rounded-xl">
                <Users className="h-5 w-5 text-[#6C1D5F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Section 5: Selected Trainers</h2>
                <p className="text-xs text-[#6B7280]">Select co-teachers and primary course trainers for this cohort.</p>
              </div>
            </div>

            <div className="space-y-4" id="trainer-selection-form-fields">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={trainerSearch}
                  onChange={(e) => setTrainerSearch(e.target.value)}
                  placeholder="Search trainers by name or email..."
                  className="block w-full h-[44px] rounded-xl border border-[#E5E7EB] py-2 pl-10 text-[#111827] bg-[#F6F8FC] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-inset focus:ring-[#6C1D5F] sm:text-sm"
                  id="trainer-search-input"
                />
              </div>

              {isLoadingTrainers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#6C1D5F]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {apiTrainers
                    .filter((t: any) => 
                      (t.fullName || t.name || '').toLowerCase().includes(trainerSearch.toLowerCase()) ||
                      (t.email || '').toLowerCase().includes(trainerSearch.toLowerCase())
                    )
                    .map((trainer: any) => {
                      const isSelected = selectedTrainerIds.includes(trainer.id);
                      return (
                        <div
                          key={trainer.id}
                          onClick={() => {
                            setSelectedTrainerIds(prev => 
                              prev.includes(trainer.id)
                                ? prev.filter(id => id !== trainer.id)
                                : [...prev, trainer.id]
                            );
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#6C1D5F] bg-[#6C1D5F]/5'
                              : 'border-[#E5E7EB] hover:bg-[#F6F8FC]'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">{trainer.fullName || trainer.name}</p>
                            <p className="text-xs text-[#6B7280]">{trainer.email}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-[#6C1D5F] border-[#6C1D5F]' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  {apiTrainers.length === 0 && (
                    <p className="text-xs text-[#6B7280] py-4 text-center col-span-2">No trainers/teachers registered in system.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: Batch Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6" id="batch-settings-card">
            <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-[#E5E7EB]">
              <div className="bg-[#F6F8FC] p-2 rounded-xl">
                <Layers className="h-5 w-5 text-[#6C1D5F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Section 6: Batch Settings</h2>
                <p className="text-xs text-[#6B7280]">Configure advanced operating flags for this learning cohort.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="batch-settings-form-fields">
              {[
                { key: 'allowLateSubmissions', title: 'Allow Late Submissions', desc: 'Enable students to hand in assignments past the designated due date.' },
                { key: 'enableAutoGrading', title: 'Enable Automated Grading', desc: 'Auto-evaluate standard programming and quiz submissions.' },
                { key: 'notifyStudentsOnPublish', title: 'Notification Broadcasts', desc: 'Notify enrolled student members immediately upon publishing this cohort.' },
                { key: 'restrictRosterChanges', title: 'Lock Student Roster', desc: 'Prevent students from dropping or self-enrolling in this batch.' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-start justify-between p-4 bg-[#F6F8FC] rounded-xl">
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-bold text-[#111827]">{setting.title}</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">{setting.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBatchSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof typeof batchSettings] }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] ${
                      batchSettings[setting.key as keyof typeof batchSettings] ? 'bg-[#6C1D5F]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        batchSettings[setting.key as keyof typeof batchSettings] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 5: Summary Card Column */}
        <div className="lg:col-span-4" id="wizard-right-column">
          <div className="sticky top-6 space-y-6" id="sticky-summary-container">
            <div className="bg-white rounded-xl shadow-md border border-[#E5E7EB] p-6" id="summary-card">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-[#E5E7EB]">
                <Sparkles className="h-5 w-5 text-[#6C1D5F]" />
                <h3 className="text-base font-bold text-[#111827]">Section 5: Summary Card</h3>
              </div>

              {/* Overview Details list */}
              <div className="space-y-4 text-sm" id="summary-metrics-list">
                <div>
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Batch Identity</h4>
                  <p className="mt-1 font-bold text-[#111827]">{batchName || 'Untitled Cohort'}</p>
                  <p className="text-xs font-mono text-[#6B7280]">{batchCode || 'NO-CODE-SPECIFIED'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Schedule Run Bounds</h4>
                  <div className="mt-1 flex items-center space-x-1 text-xs text-gray-600">
                    <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span>
                      {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'} - {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Associated Course Curriculum</h4>
                  {selectedCourses.length === 0 ? (
                    <p className="mt-1 text-xs text-red-550">No courses selected.</p>
                  ) : (
                    <div className="mt-1.5 space-y-1">
                      {selectedCourses.map(course => (
                        <p key={course.id} className="text-xs font-semibold text-[#111827] flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F6F8FC] mr-1.5" />
                          {course.title}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Capacity Gauge bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">
                    <span>Enrolled Cohort Capacity</span>
                    <span className={selectedStudentIds.length > capacity ? 'text-red-550 font-bold' : ''}>
                      {selectedStudentIds.length} / {capacity}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedStudentIds.length > capacity ? 'bg-red-500' : 'bg-[#6C1D5F]'
                      }`}
                      style={{ width: `${Math.min(100, (selectedStudentIds.length / (capacity || 1)) * 100)}%` }}
                    />
                  </div>
                  {selectedStudentIds.length > capacity && (
                    <p className="mt-1 text-xs text-red-500 font-medium">Warning: Selected students exceed cohort capacity.</p>
                  )}
                </div>

                {/* Selected Students Roster Quick List */}
                <div>
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Selected Student Roster</h4>
                  {selectedStudentIds.length === 0 ? (
                    <p className="mt-1 text-xs text-[#6B7280]">No student members checked.</p>
                  ) : (
                    <div className="mt-1.5 max-h-24 overflow-y-auto space-y-1 pr-1">
                      {studentsList.filter(s => selectedStudentIds.includes(s.id)).map(student => (
                        <p key={student.id} className="text-xs text-gray-600 flex items-center justify-between">
                          <span className="truncate">{student.name}</span>
                          <span className="text-[10px] font-mono text-[#9CA3AF]">{student.status}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                {/* Selected Trainers */}
                <div>
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Assigned Trainers</h4>
                  {selectedTrainerIds.length === 0 ? (
                    <p className="mt-1 text-xs text-[#6B7280]">No co-trainers assigned.</p>
                  ) : (
                    <div className="mt-1.5 space-y-1">
                      {apiTrainers.filter((t: any) => selectedTrainerIds.includes(t.id)).map((trainer: any) => (
                        <p key={trainer.id} className="text-xs font-semibold text-[#111827] flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                          {trainer.fullName || trainer.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Settings Checklist */}
                <div>
                  <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Active Settings</h4>
                  <div className="mt-1.5 space-y-1 text-xs text-gray-600">
                    <p className="flex items-center justify-between">
                      <span>Allow Late Submissions:</span>
                      <span className="font-bold">{batchSettings.allowLateSubmissions ? 'Yes' : 'No'}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Automated Grading:</span>
                      <span className="font-bold">{batchSettings.enableAutoGrading ? 'Yes' : 'No'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3" id="summary-action-buttons">
                {!editingBatchId ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCreateBatch}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full inline-flex justify-center items-center rounded-xl bg-[#6C1D5F] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#4A1E47] disabled:opacity-50 transition-all cursor-pointer"
                      id="create-batch-btn"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Creating...
                        </>
                      ) : (
                        'Create Batch'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full inline-flex justify-center items-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] disabled:opacity-50 transition-all cursor-pointer"
                      id="save-draft-btn"
                    >
                      <Save className="-ml-0.5 mr-1.5 h-4 w-4 text-[#9CA3AF]" />
                      Save Draft
                    </button>
                  </>
                ) : isEditingPublished ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCreateBatch}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full inline-flex justify-center items-center rounded-xl bg-[#6C1D5F] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#4A1E47] disabled:opacity-50 transition-all cursor-pointer"
                      id="save-changes-btn"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full inline-flex justify-center items-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#6C1D5F] border border-[#E5E7EB] hover:bg-[#F6F8FC] disabled:opacity-50 transition-all cursor-pointer"
                      id="save-draft-btn"
                    >
                      <Save className="-ml-0.5 mr-1.5 h-4 w-4 text-[#9CA3AF]" />
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        'Save Draft'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateBatch}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full inline-flex justify-center items-center rounded-xl bg-[#6C1D5F] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#4A1E47] disabled:opacity-50 transition-all cursor-pointer"
                      id="publish-batch-btn"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Publishing...
                        </>
                      ) : (
                        'Publish Batch'
                      )}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full inline-flex justify-center items-center rounded-xl text-sm font-semibold text-[#6B7280] hover:text-[#374151] py-1 cursor-pointer"
                  id="cancel-setup-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBatchWizard;
