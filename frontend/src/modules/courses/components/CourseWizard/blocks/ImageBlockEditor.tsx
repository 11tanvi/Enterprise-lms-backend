import React from "react";
import { Loader2, Trash2, Upload } from "lucide-react";

interface ImageBlockEditorProps {
  imageUrl: string;
  onImageUrlChange: (val: string) => void;
  imageAlt: string;
  onImageAltChange: (val: string) => void;
  imageCaption: string;
  onImageCaptionChange: (val: string) => void;
  isUploading: boolean;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelected: (file: File) => void;
}

export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
  imageUrl,
  onImageUrlChange,
  imageAlt,
  onImageAltChange,
  imageCaption,
  onImageCaptionChange,
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
          Lesson Image
        </label>
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative group border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 bg-white flex flex-col items-center justify-center ${
            isDragging
              ? "border-[#01AC9F] bg-emerald-50/50"
              : "border-gray-200 hover:border-[#510047]"
          } ${imageUrl ? "h-40" : "h-32"}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 text-[#510047] animate-spin" />
              <p className="text-[11px]">Uploading to Cloudinary...</p>
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Image block preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs p-2 flex items-center justify-center gap-2 md:inset-0 md:bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex-row md:gap-3">
                <label className="cursor-pointer bg-white text-gray-800 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold shadow-lg hover:bg-gray-100 transition-colors">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files && onFileSelected(e.target.files[0])
                    }
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onImageUrlChange("")}
                  className="bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
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
              <p className="text-[10px] text-gray-400 mt-1">PNG/JPG, Max 5MB</p>
              <input
                type="file"
                accept="image/*"
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
          Alt Text (Accessibility)
        </label>
        <input
          type="text"
          placeholder="e.g., Diagram of the request lifecycle"
          value={imageAlt}
          onChange={(e) => onImageAltChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Image Caption
        </label>
        <input
          type="text"
          placeholder="e.g., Figure 1: System Architecture"
          value={imageCaption}
          onChange={(e) => onImageCaptionChange(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#510047] focus:ring-1 focus:ring-[#ffd7f0] transition-all"
        />
      </div>
    </div>
  );
};
