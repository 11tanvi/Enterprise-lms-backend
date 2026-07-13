import React from "react";

interface CalloutBlockEditorProps {
  value: string;
  onChange: (val: string) => void;
  calloutType: string;
  onCalloutTypeChange: (type: string) => void;
}

export const CalloutBlockEditor: React.FC<CalloutBlockEditorProps> = ({
  value,
  onChange,
  calloutType,
  onCalloutTypeChange,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Callout Style / Priority
        </label>
        <div className="flex gap-2">
          {["info", "warning", "danger"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onCalloutTypeChange(type)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all capitalize ${
                calloutType === type
                  ? type === "warning"
                    ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                    : type === "danger"
                      ? "bg-red-500 border-red-500 text-white shadow-sm"
                      : "bg-teal-600 border-teal-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Callout Body / Message
        </label>
        <textarea
          rows={3}
          required
          placeholder="Enter callout text / instructions..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all resize-none text-gray-700 leading-relaxed font-sans"
        />
      </div>
    </div>
  );
};
