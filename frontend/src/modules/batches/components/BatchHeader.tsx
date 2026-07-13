import React from 'react';

interface BatchHeaderProps {
  title?: string;
  description?: string;
}

export const BatchHeader: React.FC<BatchHeaderProps> = ({ 
  title = "Batch Management", 
  description = "Monitor class groups, track assignments, and orchestrate student enrollment."
}) => {
  return (
    <div id="batch-header-container">
      <h1 className="text-4xl font-bold text-[#111827]" id="batch-header-title">
        {title}
      </h1>
      <p className="mt-2 text-sm text-[#6B7280]" id="batch-header-description">
        {description}
      </p>
    </div>
  );
};

export default BatchHeader;
