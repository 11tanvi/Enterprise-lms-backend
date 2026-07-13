import React from 'react';

interface BatchMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export const BatchMetricCard: React.FC<BatchMetricCardProps> = ({
  title,
  value,
  description,
  icon
}) => {
  return (
    <div className="rounded-2xl bg-[#FFFFFF] p-6 shadow-sm border border-[#E5E7EB] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" id={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center gap-x-4">
        {icon && (
          <div className="rounded-xl bg-[#F6F8FC] p-3 text-[#6C1D5F]" id="metric-card-icon">
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide" id="metric-card-title">{title}</p>
          <p className="mt-1 text-3xl font-bold text-[#111827]" id="metric-card-value">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-[#9CA3AF]" id="metric-card-description">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchMetricCard;
