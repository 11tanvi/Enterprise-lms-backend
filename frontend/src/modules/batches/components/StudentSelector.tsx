import React, { useState } from 'react';
import { Search, UserCheck, Plus } from 'lucide-react';

interface Student {
  id: number | string;
  fullName: string;
  email: string;
}

interface StudentSelectorProps {
  availableStudents?: Student[];
  selectedStudentIds?: (number | string)[];
  onAddStudent?: (id: number | string) => void;
  onRemoveStudent?: (id: number | string) => void;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  availableStudents = [],
  selectedStudentIds = [],
  onAddStudent,
  onRemoveStudent
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = availableStudents.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm" id="student-selector-container">
      <h3 className="text-xl font-semibold text-[#111827]" id="student-selector-title">
        Enroll Students
      </h3>
      <p className="mt-1 text-sm text-[#6B7280]" id="student-selector-subtitle">
        Search and select students to manually add to this batch.
      </p>

      {/* Search Input */}
      <div className="relative mt-4" id="student-search-container">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name or email..."
          className="block w-full h-[44px] rounded-xl bg-[#F6F8FC] border border-transparent py-2 pl-10 pr-3 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:border-[#6C1D5F] focus:ring-1 focus:ring-[#6C1D5F] outline-none transition-all duration-200"
          id="student-search-input"
        />
      </div>

      {/* Student List */}
      <ul role="list" className="mt-4 divide-y divide-[#E5E7EB] border-t border-[#E5E7EB] max-h-60 overflow-y-auto" id="student-list">
        {filteredStudents.length === 0 ? (
          <li className="py-6 text-center text-sm text-[#6B7280]">
            No students found.
          </li>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <li key={student.id} className="flex items-center justify-between gap-x-6 py-4" id={`student-item-${student.id}`}>
                <div className="min-w-0">
                  <div className="flex items-start gap-x-3">
                    <p className="text-sm font-semibold text-[#111827]">{student.fullName}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-x-2 text-xs text-[#6B7280]">
                    <p className="truncate">{student.email}</p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  {isSelected ? (
                    <button
                      onClick={() => onRemoveStudent?.(student.id)}
                      className="flex items-center gap-x-1.5 rounded-xl bg-[#F6F8FC] px-3 py-1.5 text-xs font-bold text-[#6C1D5F] transition-all hover:bg-red-50 hover:text-red-600"
                      id={`remove-student-btn-${student.id}`}
                    >
                      <UserCheck className="h-4 w-4" />
                      Added
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddStudent?.(student.id)}
                      className="flex items-center gap-x-1.5 rounded-2xl bg-white px-3 py-1.5 text-xs font-bold text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F6F8FC] hover:text-[#6C1D5F] transition-all"
                      id={`add-student-btn-${student.id}`}
                    >
                      <Plus className="h-4 w-4" />
                      Add to Batch
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default StudentSelector;
