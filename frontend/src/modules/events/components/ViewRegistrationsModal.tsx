import React, { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import { eventService } from "../api/eventService";

interface ViewRegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
}

export const ViewRegistrationsModal: React.FC<ViewRegistrationsModalProps> = ({
  isOpen,
  onClose,
  eventId,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchRegistrations();
    }
  }, [isOpen, eventId]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getRegisteredStudents(eventId!);
      setStudents(data);
    } catch (err: any) {
      setError("Failed to load registered students.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (students.length === 0) return;
    
    // Create CSV headers
    const headers = "Name,Email\n";
    
    // Map through students and format as CSV rows
    const csvContent = students.map(s => {
      const name = s.fullName || s.name || "Unknown";
      return `"${name}","${s.email}"`;
    }).join("\n");

    // Create a downloadable blob
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `event_${eventId}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900">
            <Users className="w-5 h-5 text-[#01AC9F]" />
            <h2 className="font-semibold text-lg">Registered Students</h2>
          </div>
          
          {/* Export Button & Close Button */}
          <div className="flex items-center gap-2">
            {students.length > 0 && (
              <button 
                onClick={handleExport}
                className="text-xs font-medium bg-[#01AC9F]/10 text-[#01AC9F] hover:bg-[#01AC9F]/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Export CSV
              </button>
            )}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AC9F]"></div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No students have registered for this event yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {students.map((student, idx) => (
                <li key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.fullName || student.name || "Unknown Student"}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};