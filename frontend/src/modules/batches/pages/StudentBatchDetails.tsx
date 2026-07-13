import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Calendar, User, LayoutDashboard, FileText, Bell, Inbox, Sparkles } from 'lucide-react';
import { batchService } from '../api/batchService';
import { Batch } from '../types/batch';

export const StudentBatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'announcements'>('overview');

  // Fetch the detailed batch context (e.g. course title, code, dates)
  const {
    data: batch,
    isLoading,
    isError,
  } = useQuery<Batch, Error>({
    queryKey: ['student', 'batch', id],
    queryFn: () => batchService.getStudentBatch(id!),
    enabled: !!id,
    retry: 1,
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse" id="student-batch-details-loading">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 text-center py-16" id="student-batch-details-error">
        <h3 className="text-xl font-bold text-[#111827]">Batch details not found</h3>
        <p className="text-[#6B7280]">The batch you are trying to access does not exist or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/student/batches')}
          className="inline-flex items-center gap-2 h-[44px] px-6 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white rounded-xl font-medium text-sm transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Batches
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in" id="student-batch-details-container">
      {/* Back to dashboard button */}
      <div>
        <button
          onClick={() => navigate('/student/batches')}
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#6C1D5F] transition-colors font-medium group"
          id="back-to-batches-btn"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Batches
        </button>
      </div>

      {/* Hero Header panel */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden" id="student-batch-details-hero">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#F6F8FC]/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F6F8FC] text-[#6C1D5F] border border-[#E5E7EB]">
                Cohort Space
              </span>
              {batch.batchCode && (
                <span className="font-mono text-xs text-[#6B7280] bg-[#F6F8FC] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                  {batch.batchCode}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111827]">
              {batch.name}
            </h1>
            <p className="text-[#6B7280] max-w-3xl flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6C1D5F] shrink-0" />
              <span className="font-medium text-[#374151]">
                {batch.courseTitle || batch.courseName || 'Enrolled Course'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#F6F8FC] p-4 rounded-xl border border-[#E5E7EB] shrink-0 self-start md:self-center">
            <div className="p-2.5 bg-[#6C1D5F]/10 text-[#6C1D5F] rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Primary Instructor</p>
              <p className="font-semibold text-gray-800 text-sm mt-0.5">
                {batch.teacherName || 'TBA'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Navigation Tabs */}
      <div className="border-b border-[#E5E7EB] flex gap-6" id="student-batch-details-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-[#6C1D5F] text-[#6C1D5F]'
              : 'border-transparent text-[#6B7280] hover:text-[#374151]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'border-[#6C1D5F] text-[#6C1D5F]'
              : 'border-transparent text-[#6B7280] hover:text-[#374151]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'border-[#6C1D5F] text-[#6C1D5F]'
              : 'border-transparent text-[#6B7280] hover:text-[#374151]'
          }`}
        >
          <Bell className="w-4 h-4" />
          Announcements
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 md:p-8 shadow-sm min-h-[250px]" id="student-batch-tab-content">
        {activeTab === 'overview' && (
          <div className="space-y-6" id="overview-tab-panel">
            <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Batch Details - Coming Next
            </h2>
            <p className="text-[#6B7280] text-sm max-w-2xl">
              This space will serve as your primary learning terminal. Detailed scheduling, class calendars, curriculum progression charts, and group statistics are being integrated for the upcoming release.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
              <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-1">
                <p className="text-xs text-[#9CA3AF] font-medium">START DATE</p>
                <p className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-[#6C1D5F]" />
                  {formatDate(batch.startDate)}
                </p>
              </div>
              <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-1">
                <p className="text-xs text-[#9CA3AF] font-medium">END DATE</p>
                <p className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-[#6C1D5F]" />
                  {formatDate(batch.endDate)}
                </p>
              </div>
              <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-1">
                <p className="text-xs text-[#9CA3AF] font-medium">ENROLLMENT STATUS</p>
                <p className="font-semibold text-[#10B981] flex items-center gap-1.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-ping" />
                  Enrolled & Active
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4" id="assignments-tab-panel">
            <div className="p-3 bg-[#F6F8FC] text-[#6C1D5F] rounded-full">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[#111827] text-base">Assignments - Coming Next</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                All assignments dispatched specifically to this cohort will be synchronized and playable from here. Go to your global Dashboard to find available general coursework.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4" id="announcements-tab-panel">
            <div className="p-3 bg-[#F6F8FC] text-[#6C1D5F] rounded-full">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[#111827] text-base">No announcements yet</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                Instructors can post real-time updates and announcements to the batch board once messaging services are online.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBatchDetails;
