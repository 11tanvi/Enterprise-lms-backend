import React from 'react';
import { Calendar, Users, BookOpen } from 'lucide-react';
import { Batch } from '../types/batch';
import { BatchStatusBadge } from './BatchStatusBadge';

interface BatchCardProps {
  batch?: Batch;
  onViewDetails?: (id: string | number) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch, onViewDetails }) => {
  if (!batch) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E7EB] p-6 text-center text-[#6B7280]" id="batch-card-empty">
        No Batch Data Available
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow" id={`batch-card-${batch.id}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-[#9CA3AF]" id={`batch-card-id-${batch.id}`}>ID: {batch.id}</span>
          <BatchStatusBadge status={batch.status || 'ACTIVE'} />
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-6 text-[#111827]" id={`batch-card-name-${batch.id}`}>
          {batch.name}
        </h3>
        <div className="mt-4 space-y-2 text-sm text-[#6B7280]">
          <div className="flex items-center gap-x-2">
            <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
            <span id={`batch-card-course-${batch.id}`}>Course ID: {batch.courseId}</span>
          </div>
          <div className="flex items-center gap-x-2">
            <Users className="h-4 w-4 text-[#9CA3AF]" />
            <span id={`batch-card-students-${batch.id}`}>{batch.studentIds?.length || 0} Students Enrolled</span>
          </div>
          {(batch.startDate || batch.endDate) && (
            <div className="flex items-center gap-x-2">
              <Calendar className="h-4 w-4 text-[#9CA3AF]" />
              <span id={`batch-card-dates-${batch.id}`}>
                {batch.startDate || 'TBD'} - {batch.endDate || 'TBD'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto border-t border-[#E5E7EB] bg-[#F6F8FC] px-6 py-3 text-right">
        <button
          onClick={() => onViewDetails?.(batch.id)}
          className="text-xs font-semibold text-[#6C1D5F] hover:text-[#6C1D5F]"
          id={`batch-card-btn-${batch.id}`}
        >
          View Details &rarr;
        </button>
      </div>
    </div>
  );
};

export default BatchCard;
