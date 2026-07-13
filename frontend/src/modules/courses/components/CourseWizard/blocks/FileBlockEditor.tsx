import React from "react";
import { Paperclip, Loader2, Upload, Trash2 } from "lucide-react";

interface FileBlockEditorProps {
  fileUrl: string;
  onFileUrlChange: (val: string) => void;
  fileName: string;
  onFileNameChange: (val: string) => void;
  fileCaption: string;
  onFileCaptionChange: (val: string) => void;
  isUploading: boolean;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelected: (file: File) => void;
}

export const FileBlockEditor: React.FC<FileBlockEditorProps> = ({
  fileUrl,
  onFileUrlChange,
  fileName,
  onFileNameChange,
  fileCaption,
  onFileCaptionChange,
  isUploading,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelected,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Lesson Attachment
        </label>
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 bg-white flex flex-col items-center justify-center h-32 ${
            isDragging
              ? "border-[#01AC9F] bg-emerald-50/50"
              : "border-gray-200 hover:border-[#510047]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 text-[#510047] animate-spin" />
              <p className="text-[11px]">Uploading to Cloudinary...</p>
            </div>
          ) : fileUrl ? (
            <div className="flex items-center gap-3 px-4 w-full">
              <div className="w-10 h-10 bg-sky-100 rounded flex items-center justify-center text-sky-600 shrink-0">
                <Paperclip className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {fileName || "Uploaded file"}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  Uploaded successfully
                </p>
              </div>
              <label className="cursor-pointer bg-white text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shrink-0">
                Replace
                <input
                  type="file"
                  onChange={(e) =>
                    e.target.files && onFileSelected(e.target.files[0])
                  }
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  onFileUrlChange("");
                  onFileNameChange("");
                }}
                className="bg-red-500 text-white p-1.5 rounded-lg shadow-sm hover:bg-red-600 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center p-4 w-full h-full justify-center">
              <Upload
                className={`w-5 h-5 mb-1.5 ${
                  isDragging ? "text-[#01AC9F]" : "text-gray-400"
                }`}
              />
              <p className="text-xs font-bold text-gray-600">
                Drag & drop or click to upload
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                PDF, DOCX, ZIP, or any file — Max 25MB
              </p>
              <input
                type="file"
                onChange={(e) =>
                  e.target.files && onFileSelected(e.target.files[0])
                }
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Attachment Caption
        </label>
        <input
          type="text"
          placeholder="e.g., Module 3 Worksheet (PDF)"
          value={fileCaption}
          onChange={(e) => onFileCaptionChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all"
        />
      </div>
    </div>
  );
};
