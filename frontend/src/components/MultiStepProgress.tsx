import React from 'react';
import { ImporterStep } from '../types';
import { Loader2, CheckCircle2, ArrowRight, ShieldAlert, X } from 'lucide-react';

interface MultiStepProgressProps {
  currentStep: ImporterStep;
  isProcessing: boolean;
  currentBatch: number;
  totalBatches: number;
  progressPercentage: number;
  importedCount: number;
  skippedCount: number;
  onCancel: () => void;
}

export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({
  currentStep,
  isProcessing,
  currentBatch,
  totalBatches,
  progressPercentage,
  importedCount,
  skippedCount,
  onCancel,
}) => {
  const steps: { key: ImporterStep; label: string }[] = [
    { key: 'UPLOAD', label: 'Upload File' },
    { key: 'PREVIEW', label: 'Preview Raw' },
    { key: 'IMPORTING', label: 'AI Processing' },
    { key: 'RESULTS', label: 'Final Leads' },
  ];

  const getStepIndex = (step: ImporterStep) => steps.findIndex((s) => s.key === step);
  const currentIdx = getStepIndex(currentStep);

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Visual Stepper */}
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-4">
        {steps.map((step, idx) => {
          const isActive = idx === currentIdx;
          const isCompleted = idx < currentIdx;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center space-y-2 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all duration-300
                    ${isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : isActive
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-115'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isActive && isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-colors duration-300
                    ${isActive ? 'text-indigo-400 font-bold' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 relative bg-slate-800">
                  <div
                    className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500"
                    style={{
                      width: isCompleted ? '100%' : isActive ? `${progressPercentage}%` : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Processing Box */}
      {currentStep === 'IMPORTING' && (
        <div className="w-full max-w-2xl mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col space-y-5 animate-pulse-slow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <span className="text-sm font-semibold text-slate-200">
                AI Mapping: Chunk {currentBatch} of {totalBatches}
              </span>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Import
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-850 h-3.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>{progressPercentage}% Completed</span>
            <span>Batch size: 15 rows</span>
          </div>

          {/* Real-time stats panel */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 border border-slate-850 rounded-xl">
            <div className="flex flex-col items-center justify-center p-3 border-r border-slate-800">
              <span className="text-2xl font-bold text-emerald-400 font-mono">{importedCount}</span>
              <span className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Leads Found</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-2xl font-bold text-slate-400 font-mono">{skippedCount}</span>
              <span className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Leads Skipped</span>
            </div>
          </div>

          {/* Running logs simulator */}
          <div className="text-left font-mono text-[10px] text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-900/50 max-h-20 overflow-y-auto">
            <div className="text-indigo-400">• Starting batch {currentBatch} of {totalBatches}...</div>
            {importedCount > 0 && <div className="text-emerald-500">• Extracted {importedCount} valid CRM leads...</div>}
            {skippedCount > 0 && <div className="text-amber-500">• Skipped {skippedCount} invalid rows (missing email/mobile)...</div>}
          </div>
        </div>
      )}
    </div>
  );
};
