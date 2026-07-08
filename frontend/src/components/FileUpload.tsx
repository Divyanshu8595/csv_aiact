import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, error }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center w-full h-80 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv, text/csv"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={`p-4 rounded-full bg-slate-800 border border-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:border-indigo-400 group-hover:bg-slate-800/80
            ${isDragActive ? 'bg-indigo-500/10 border-indigo-400 text-indigo-400' : 'text-slate-400'}`}
          >
            {isDragActive ? (
              <Upload className="w-10 h-10 animate-bounce" />
            ) : (
              <FileSpreadsheet className="w-10 h-10 text-slate-300 group-hover:text-indigo-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-slate-100">
              Drag & Drop your CSV file here, or{' '}
              <span className="text-indigo-400 font-semibold group-hover:underline">browse files</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Supported file: <span className="font-mono text-slate-300">.csv</span> (max 5MB)
            </p>
          </div>
        </div>

        {/* Dynamic Glow Effect */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-radial-gradient from-indigo-500/5 to-transparent" />
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-4 border border-rose-500/30 rounded-xl bg-rose-500/10 text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Description and Info */}
      <div className="mt-8 p-6 bg-slate-900/60 border border-slate-800 rounded-xl">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">AI CSV Importer Instructions</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          This intelligent importer automatically processes any lead spreadsheet (Facebook leads, Google ads exports, custom CRM outputs). The AI matches columns like names, contacts, and emails and structures them to match our target schema.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-mono text-slate-500">
          <div>
            <span className="text-indigo-400 font-semibold">• Allowed Enums</span> for <span className="text-slate-300">crm_status</span>: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
          </div>
          <div>
            <span className="text-indigo-400 font-semibold">• Allowed Enums</span> for <span className="text-slate-300">data_source</span>: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots.
          </div>
        </div>
      </div>
    </div>
  );
};
