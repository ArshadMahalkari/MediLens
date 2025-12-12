import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, etc).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onAnalyze(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center
          ${isDragging 
            ? 'border-teal-500 bg-teal-50 scale-[1.02]' 
            : 'border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50'
          }
          ${isAnalyzing ? 'opacity-70 pointer-events-none' : ''}
          shadow-sm
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isAnalyzing}
        />

        {preview ? (
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-4 rounded-xl overflow-hidden shadow-md border border-slate-200">
               <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-teal-600 font-semibold animate-pulse">
                <Loader2 className="animate-spin" />
                Analyzing Document...
              </div>
            ) : (
              <button 
                onClick={reset}
                className="z-20 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-colors"
              >
                Analyze Another Image
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="p-4 bg-teal-100 text-teal-600 rounded-full">
              <UploadCloud size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-700">
                Click or drag & drop to upload
              </p>
              <p className="text-sm text-slate-500">
                Supports JPG, PNG, WEBP (Medical reports, Prescriptions)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
