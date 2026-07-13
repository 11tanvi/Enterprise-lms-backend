import React from "react";

interface TextBlockEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const TextBlockEditor: React.FC<TextBlockEditorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2 animate-fade-in">
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        Text Body / Paragraph
      </label>
      <textarea
        rows={6}
        required
        placeholder="Enter descriptive program training materials, explanations, bullets, or steps..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all resize-none text-gray-700 leading-relaxed font-sans"
      />
    </div>
  );
};
