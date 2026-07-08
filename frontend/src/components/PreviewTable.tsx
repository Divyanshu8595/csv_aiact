import React from 'react';
import { RawCsvData } from '../types';
import { Play, RotateCcw } from 'lucide-react';

interface PreviewTableProps {
  data: RawCsvData;
  onConfirm: () => void;
  onCancel: () => void;
  fileName: string | null;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ data, onConfirm, onCancel, fileName }) => {
  const { headers, rows } = data;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Header Info Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            File Preview: <span className="text-indigo-400 font-mono text-base font-normal">{fileName}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Successfully parsed <span className="font-semibold text-slate-200">{rows.length}</span> rows and{' '}
            <span className="font-semibold text-slate-200">{headers.length}</span> columns. Ready to import and run AI mapping.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer w-1/2 md:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Upload Different File
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer w-1/2 md:w-auto"
          >
            <Play className="w-4 h-4 fill-current" />
            Confirm & Start Import
          </button>
        </div>
      </div>

      {/* Sticky Table Wrapper */}
      <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950/45">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(51,65,85,1)]">
                <th className="py-3 px-4 font-semibold text-slate-300 w-16 bg-slate-900 sticky left-0 z-20">#</th>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap bg-slate-900"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-900/30 transition-colors group"
                >
                  <td className="py-2.5 px-4 font-mono text-slate-500 bg-slate-950/80 group-hover:bg-slate-900/40 sticky left-0 z-10 border-r border-slate-800/50">
                    {rowIdx + 1}
                  </td>
                  {headers.map((_, colIdx) => (
                    <td
                      key={colIdx}
                      className="py-2.5 px-4 text-slate-300 max-w-xs truncate font-mono text-xs whitespace-nowrap"
                      title={row[colIdx]}
                    >
                      {row[colIdx] !== undefined && row[colIdx] !== null ? row[colIdx] : <span className="text-slate-650 italic">empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-right text-xs text-slate-500 font-mono pr-2">
        * Scroll horizontally to view all columns
      </div>
    </div>
  );
};
