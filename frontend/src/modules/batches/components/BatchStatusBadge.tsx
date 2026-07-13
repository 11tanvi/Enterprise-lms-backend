import React from 'react';

interface BatchStatusBadgeProps {
  status?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'UPCOMING' | string;
}

export const BatchStatusBadge: React.FC<BatchStatusBadgeProps> = ({ status = "ACTIVE" }) => {
  const normalizedStatus = status.toUpperCase();

  let colorClasses = "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20";
  if (normalizedStatus === "INACTIVE") {
    colorClasses = "bg-[#F6F8FC] text-[#6B7280] border-[#E5E7EB]";
  } else if (normalizedStatus === "COMPLETED") {
    colorClasses = "bg-[#6C1D5F]/10 text-[#6C1D5F] border-[#6C1D5F]/20";
  } else if (normalizedStatus === "UPCOMING") {
    colorClasses = "bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20";
  }

  return (
    <span
      id={`batch-status-${status.toLowerCase()}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      {status}
    </span>
  );
};

export default BatchStatusBadge;
