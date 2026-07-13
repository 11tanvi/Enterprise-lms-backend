import React from "react";

interface VideoBlockEditorProps {
  url: string;
  onUrlChange: (val: string) => void;
  caption: string;
  onCaptionChange: (val: string) => void;
}

export const VideoBlockEditor: React.FC<VideoBlockEditorProps> = ({
  url,
  onUrlChange,
  caption,
  onCaptionChange,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Video Stream URL
        </label>
        <input
          type="url"
          required
          placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Video Title / Caption
        </label>
        <input
          type="text"
          placeholder="e.g., Project Setup Walkthrough"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all"
        />
      </div>
    </div>
  );
};
