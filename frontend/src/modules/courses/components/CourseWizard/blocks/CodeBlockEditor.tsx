import React from "react";

interface CodeBlockEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export const CodeBlockEditor: React.FC<CodeBlockEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Programming Language
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#510047] text-gray-700 font-semibold cursor-pointer"
          >
            <option value="JavaScript">JavaScript</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="SQL">SQL</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Code Script Body
        </label>
        <textarea
          rows={6}
          required
          placeholder="// Enter script segment here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none text-gray-200 font-mono leading-normal"
        />
      </div>
    </div>
  );
};
