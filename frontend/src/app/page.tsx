'use client';

import React from 'react';
import { useCsvImporter } from '../hooks/useCsvImporter';
import { FileUpload } from '../components/FileUpload';
import { PreviewTable } from '../components/PreviewTable';
import { ResultsTable } from '../components/ResultsTable';
import { MultiStepProgress } from '../components/MultiStepProgress';
import { CloudLightning, FileSpreadsheet, GitMerge, CheckSquare } from 'lucide-react';

export default function Home() {
  const {
    state,
    handleFileUpload,
    startImport,
    cancelImport,
    resetImporter,
  } = useCsvImporter();

  const renderActiveStep = () => {
    switch (state.step) {
      case 'UPLOAD':
        return (
          <div className="w-full transition-all duration-500 transform opacity-100 scale-100">
            <FileUpload onFileSelect={handleFileUpload} error={state.error} />
          </div>
        );
      case 'PREVIEW':
        return (
          <div className="w-full space-y-6 transition-all duration-500 transform opacity-100">
            <MultiStepProgress
              currentStep={state.step}
              isProcessing={state.isProcessing}
              currentBatch={state.currentBatch}
              totalBatches={state.totalBatches}
              progressPercentage={state.progressPercentage}
              importedCount={state.importedLeads.length}
              skippedCount={state.skippedLeads.length}
              onCancel={cancelImport}
            />
            {state.rawCsv && (
              <PreviewTable
                data={state.rawCsv}
                onConfirm={startImport}
                onCancel={resetImporter}
                fileName={state.fileName}
              />
            )}
          </div>
        );
      case 'IMPORTING':
        return (
          <div className="w-full py-12 transition-all duration-500 transform opacity-100">
            <MultiStepProgress
              currentStep={state.step}
              isProcessing={state.isProcessing}
              currentBatch={state.currentBatch}
              totalBatches={state.totalBatches}
              progressPercentage={state.progressPercentage}
              importedCount={state.importedLeads.length}
              skippedCount={state.skippedLeads.length}
              onCancel={cancelImport}
            />
          </div>
        );
      case 'RESULTS':
        return (
          <div className="w-full space-y-6 transition-all duration-500 transform opacity-100">
            <MultiStepProgress
              currentStep={state.step}
              isProcessing={state.isProcessing}
              currentBatch={state.currentBatch}
              totalBatches={state.totalBatches}
              progressPercentage={state.progressPercentage}
              importedCount={state.importedLeads.length}
              skippedCount={state.skippedLeads.length}
              onCancel={cancelImport}
            />
            <ResultsTable
              importedLeads={state.importedLeads}
              skippedLeads={state.skippedLeads}
              onReset={resetImporter}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <CloudLightning className="w-5 h-5 fill-current text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                GrowEasy
              </span>
              <span className="text-[10px] ml-1.5 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-400">
                CSV Importer
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Stateless API Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-5xl bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          
          {/* Subtle background glows */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Steps Title Header */}
          {state.step === 'UPLOAD' && (
            <div className="text-center max-w-xl mx-auto mb-10">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-350 bg-clip-text text-transparent">
                AI-Powered Lead Mapping
              </h1>
              <p className="mt-2 text-slate-400 text-sm md:text-base">
                Upload any CSV spreadsheet export. Our model will intelligently clean, classify, map, and output structured CRM leads in real-time.
              </p>
            </div>
          )}

          {/* Step Renderer */}
          {renderActiveStep()}
        </div>

        {/* Feature Cards Grid (Only visible on home upload page) */}
        {state.step === 'UPLOAD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-12 mb-6">
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Arbitrary Formats</h4>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                  Support for Facebook Lead exports, Google Ads, custom real estate sheets, and manually compiled excel lists.
                </p>
              </div>
            </div>
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-violet-500/10 border border-violet-500/25 rounded-xl text-violet-400 shrink-0">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Multi-Value Aggregation</h4>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                  Intelligently merges extra phone numbers and emails. Appends unmapped fields and custom notes into crm_note.
                </p>
              </div>
            </div>
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-450 shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Enforced Skipping</h4>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                  Strict schema filtering will automatically skip invalid entries lacking contact emails and mobile numbers.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 bg-slate-950/40 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 GrowEasy. Built for the Software Developer Assignment.</p>
      </footer>
    </div>
  );
}
