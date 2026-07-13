import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BookOpen, User, ArrowRight, AlertTriangle, Search, Clock, ShieldAlert } from 'lucide-react';
import { batchService } from '../api/batchService';
import { BatchHeader } from '../components/BatchHeader';
import { Batch } from '../types/batch';

export const StudentBatchDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch batches belonging ONLY to the logged-in student
  const {
    data: batches = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Batch[], Error>({
    queryKey: ['student', 'batches', 'me'],
    queryFn: () => batchService.getStudentBatches(),
    retry: 1,
  });

  // Filter batches based on search query
  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const lowerQuery = searchQuery.toLowerCase();
    return batches.filter(
      (b) =>
        b.name.toLowerCase().includes(lowerQuery) ||
        (b.batchCode && b.batchCode.toLowerCase().includes(lowerQuery)) ||
        (b.courseName && b.courseName.toLowerCase().includes(lowerQuery)) ||
        (b.courseTitle && b.courseTitle.toLowerCase().includes(lowerQuery)) ||
        (b.teacherName && b.teacherName.toLowerCase().includes(lowerQuery))
    );
  }, [batches, searchQuery]);

  // Format dates gracefully
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in" id="student-batch-dashboard-container">
      {/* Header section with description */}
      <BatchHeader 
        title="My Batches & Cohorts" 
        description="View your enrolled study cohorts, course details, instructors, and navigate to your active spaces."
      />

      {/* Control panel (Search only, no create/edit/delete/analytics as requested) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm" id="student-batch-control-panel">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
          <input
            type="text"
            placeholder="Search batches, codes, courses, or teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 px-4 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200 transition-all"
            id="student-batch-search-input"
          />
        </div>
        <div className="text-xs text-[#9CA3AF] flex items-center gap-1.5" id="student-batch-total-count">
          <Clock className="w-3.5 h-3.5" />
          Showing {filteredBatches.length} of {batches.length} cohorts
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 border border-red-200 rounded-xl max-w-xl mx-auto space-y-4" id="student-batch-error">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Unable to load batches</h3>
            <p className="mt-1 text-sm text-red-600/80">
              {error?.message || 'A network error occurred while fetching your active batch list.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#EF4444] hover:bg-red-500 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="student-batch-skeleton-container">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-[#E5E7EB] bg-white rounded-2xl p-6 space-y-4 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-[#E5E7EB]">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-9 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loaded Content */}
      {!isLoading && !isError && (
        <>
          {filteredBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-xl mx-auto space-y-4 shadow-sm" id="student-batch-empty-state">
              <div className="p-4 bg-[#F6F8FC] text-[#9CA3AF] rounded-full">
                <Users className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#111827]">No Batches Enrolled</h3>
                <p className="mt-2 text-sm text-[#6B7280] max-w-md">
                  {searchQuery
                    ? "We couldn't find any cohorts matching your search query. Please check your keywords and try again."
                    : "You are not currently enrolled in any batches. Enrolled cohorts will automatically appear here once assigned by your administrator."}
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F6F8FC] rounded-xl text-sm text-[#374151] transition-all font-medium"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="student-batches-grid">
              {filteredBatches.map((batch) => {
                const isCompleted = batch.status === 'COMPLETED';
                const statusLabel = isCompleted ? 'Completed' : batch.isActive ? 'Active' : 'Inactive';
                const badgeColor = isCompleted
                  ? 'bg-[#6C1D5F]/10 text-[#6C1D5F] border-[#6C1D5F]/20'
                  : batch.isActive
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                  : 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20';

                return (
                  <div
                    key={batch.id}
                    className="flex flex-col justify-between flex flex-col justify-between bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    id={`student-batch-card-${batch.id}`}
                  >
                    {/* Left aesthetic border accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${batch.isActive && !isCompleted ? 'bg-[#10B981]' : isCompleted ? 'bg-[#6C1D5F]' : 'bg-[#6B7280]'}`} />

                    <div className="space-y-4">
                      {/* Top Row: Name and status badge */}
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="font-bold text-[#111827] group-hover:text-[#6C1D5F] transition-colors line-clamp-1">
                            {batch.name}
                          </h3>
                          {batch.batchCode && (
                            <span className="inline-block mt-1 font-mono text-xs text-[#6B7280]">
                              {batch.batchCode}
                            </span>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Course and Instructor details */}
                      <div className="space-y-2.5 text-sm pt-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                          <span className="line-clamp-1">
                            {batch.courseTitle || batch.courseName || 'Unassigned Course'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                          <span className="line-clamp-1 font-medium">
                            {batch.teacherName || 'TBA'}
                          </span>
                        </div>
                      </div>

                      {/* Date ranges */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Start Date</p>
                          <p className="font-medium mt-0.5">{formatDate(batch.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">End Date</p>
                          <p className="font-medium mt-0.5">{formatDate(batch.endDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Students and Open Batch button */}
                    <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1 text-xs text-[#6B7280] bg-[#F6F8FC] px-2.5 py-1 rounded-xl">
                        <Users className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                        <span>{batch.studentCount || 0} enrolled</span>
                      </div>

                      <button
                        onClick={() => navigate(`/student/batches/${batch.id}`)}
                        className="flex items-center gap-1.5 h-[44px] px-6 text-sm font-semibold text-white bg-[#6C1D5F] hover:bg-[#4A1E47] rounded-xl shadow-sm transition-all cursor-pointer group/btn"
                        id={`open-batch-btn-${batch.id}`}
                      >
                        Open Batch
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentBatchDashboard;
