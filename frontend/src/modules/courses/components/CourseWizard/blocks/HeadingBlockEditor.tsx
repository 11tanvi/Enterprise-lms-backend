import React from "react";

interface HeadingBlockEditorProps {
  value: string;
  onChange: (val: string) => void;
  headingLevel: number;
  onHeadingLevelChange: (level: number) => void;
}

export const HeadingBlockEditor: React.FC<HeadingBlockEditorProps> = ({
  value,
  onChange,
  headingLevel,
  onHeadingLevelChange,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Heading Level
        </label>
        <div className="flex gap-2">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onHeadingLevelChange(level)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                headingLevel === level
                  ? "bg-[#510047] border-[#510047] text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              H{level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Heading Text
        </label>
        <input
          type="text"
          required
          placeholder="Enter heading text..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all"
        />
      </div>
    </div>
  );
};
