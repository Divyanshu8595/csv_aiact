import React, { useState } from 'react';
import { CRMLead } from '../types';
import { CheckCircle, AlertTriangle, Download, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import Papa from 'papaparse';

interface ResultsTableProps {
  importedLeads: CRMLead[];
  skippedLeads: CRMLead[];
  onReset: () => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ importedLeads, skippedLeads, onReset }) => {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  const toggleNotes = (idx: number) => {
    setExpandedNotes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getStatusBadge = (status: CRMLead['crm_status']) => {
    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Follow Up
          </span>
        );
      case 'DID_NOT_CONNECT':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            No Connect
          </span>
        );
      case 'BAD_LEAD':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Bad Lead
          </span>
        );
      case 'SALE_DONE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Sale Done
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Unknown
          </span>
        );
    }
  };

  const getSourceBadge = (source: CRMLead['data_source']) => {
    if (!source) return <span className="text-slate-500 italic text-xs">none</span>;
    return (
      <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-350 border border-slate-700">
        {source}
      </span>
    );
  };

  // Filter current active list based on search query
  const leadsToRender = activeTab === 'imported' ? importedLeads : skippedLeads;
  const filteredLeads = leadsToRender.filter((lead) => {
    const query = searchQuery.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.mobile_without_country_code?.includes(query) ||
      lead.company?.toLowerCase().includes(query) ||
      lead.crm_note?.toLowerCase().includes(query)
    );
  });

  const exportToCsv = () => {
    const dataToExport = activeTab === 'imported' ? importedLeads : skippedLeads;
    const csvContent = Papa.unparse(dataToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `groweasy_${activeTab}_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processed Rows</span>
          <span className="text-3xl font-bold text-slate-100 mt-2 font-mono">{importedLeads.length + skippedLeads.length}</span>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Imported Leads</span>
          <span className="text-3xl font-bold text-emerald-400 mt-2 font-mono flex items-center gap-1.5">
            {importedLeads.length}
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </span>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skipped Leads</span>
          <span className="text-3xl font-bold text-amber-500 mt-2 font-mono flex items-center gap-1.5">
            {skippedLeads.length}
            {skippedLeads.length > 0 && <AlertTriangle className="w-5 h-5 text-amber-555" />}
          </span>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</span>
          <span className="text-3xl font-bold text-indigo-400 mt-2 font-mono">
            {importedLeads.length + skippedLeads.length > 0
              ? `${Math.round((importedLeads.length / (importedLeads.length + skippedLeads.length)) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Tabs and Actions bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Tab Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('imported')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer border
              ${activeTab === 'imported'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-350 hover:bg-slate-900/80'
              }`}
          >
            Imported Records ({importedLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer border
              ${activeTab === 'skipped'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-350 hover:bg-slate-900/80'
              }`}
          >
            Skipped Records ({skippedLeads.length})
          </button>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>
          <button
            onClick={exportToCsv}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Download table data as CSV"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-550 rounded-lg shadow transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Import New
          </button>
        </div>
      </div>

      {/* Leads Table Component */}
      <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950/45">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold">
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mobile Contact</th>
                <th className="py-3.5 px-4">Company / Location</th>
                <th className="py-3.5 px-4">CRM Status</th>
                <th className="py-3.5 px-4">Data Source</th>
                <th className="py-3.5 px-4">Possession Time</th>
                <th className="py-3.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    No matching leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => {
                  const isExpanded = expandedNotes[idx] || false;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {lead.created_at || '—'}
                      </td>
                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                        {lead.name || <span className="text-slate-600 italic">none</span>}
                      </td>
                      {/* Email */}
                      <td className="py-3 px-4 text-indigo-400 font-mono text-xs whitespace-nowrap">
                        {lead.email || <span className="text-slate-650 italic">none</span>}
                      </td>
                      {/* Contact */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {lead.mobile_without_country_code ? (
                          <span>
                            {lead.country_code ? `${lead.country_code} ` : ''}
                            {lead.mobile_without_country_code}
                          </span>
                        ) : (
                          <span className="text-slate-650 italic">none</span>
                        )}
                      </td>
                      {/* Company/Location */}
                      <td className="py-3 px-4 text-slate-350">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">
                            {lead.company || <span className="text-slate-650 italic text-xs">no company</span>}
                          </span>
                          <span className="text-xs text-slate-450">
                            {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                      </td>
                      {/* CRM Status */}
                      <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(lead.crm_status)}</td>
                      {/* Data Source */}
                      <td className="py-3 px-4 whitespace-nowrap">{getSourceBadge(lead.data_source)}</td>
                      {/* Possession Time */}
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {lead.possession_time || '—'}
                      </td>
                      {/* Notes / Details Toggle */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-col space-y-1">
                          {lead.crm_note ? (
                            <>
                              <div
                                className={`text-xs text-slate-350 overflow-hidden text-ellipsis ${isExpanded ? '' : 'line-clamp-2'}`}
                              >
                                {lead.crm_note}
                              </div>
                              <button
                                onClick={() => toggleNotes(idx)}
                                className="flex items-center gap-0.5 text-xs text-indigo-400 font-medium hover:text-indigo-350 cursor-pointer self-start"
                              >
                                {isExpanded ? (
                                  <>
                                    Collapse <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    View More <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-600 italic text-xs">none</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
