import React from 'react';
import { Batch } from '../types/batch';
import { BatchStatusBadge } from './BatchStatusBadge';

interface BatchTableProps {
  batches?: Batch[];
  onViewDetails?: (id: string | number) => void;
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}

export const BatchTable: React.FC<BatchTableProps> = ({
  batches = [],
  onViewDetails,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden" id="batch-table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="batch-table">
          <thead>
            <tr className="bg-[#F6F8FC] border-b border-[#E5E7EB]">
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Batch Name</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Batch Code</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Teacher</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Courses</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Students</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Capacity</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Start Date</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">End Date</th>
              <th scope="col" className="px-6 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
              <th scope="col" className="px-6 py-4 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] bg-white">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-[#6B7280]" id="batch-table-empty">
                  No batches found.
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} id={`batch-row-${batch.id}`} className="hover:bg-[#F6F8FC] transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#111827]">{batch.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-[#6B7280]">{batch.batchCode || 'N/A'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">{batch.teacherName || 'Unassigned'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">{batch.courseTitle || batch.courseName || `Course: ${batch.courseId}`}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">{batch.studentCount ?? batch.studentIds?.length ?? 0}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">{batch.capacity || 30}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">{formatDate(batch.startDate)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#6B7280]">{formatDate(batch.endDate)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <BatchStatusBadge status={batch.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => onViewDetails?.(batch.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-[#6C1D5F] hover:bg-[#F6F8FC] transition-all text-sm font-medium mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit?.(batch.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-[#6B7280] hover:bg-[#F6F8FC] transition-all text-sm font-medium mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete?.(batch.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-[#EF4444] hover:bg-red-50 transition-all text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchTable;
