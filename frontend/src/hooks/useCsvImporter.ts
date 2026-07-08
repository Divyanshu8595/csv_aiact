import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { ImporterState, CRMLead, RawCsvData } from '../types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const BATCH_SIZE = 15;

export const useCsvImporter = () => {
  const [state, setState] = useState<ImporterState>({
    step: 'UPLOAD',
    fileName: null,
    fileSize: null,
    rawCsv: null,
    importedLeads: [],
    skippedLeads: [],
    isProcessing: false,
    currentBatch: 0,
    totalBatches: 0,
    progressPercentage: 0,
    error: null,
  });

  // Reference to cancel the active import process
  const cancelRef = useRef<boolean>(false);

  const resetImporter = useCallback(() => {
    cancelRef.current = false;
    setState({
      step: 'UPLOAD',
      fileName: null,
      fileSize: null,
      rawCsv: null,
      importedLeads: [],
      skippedLeads: [],
      isProcessing: false,
      currentBatch: 0,
      totalBatches: 0,
      progressPercentage: 0,
      error: null,
    });
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file) return;

    setState((prev) => ({
      ...prev,
      fileName: file.name,
      fileSize: file.size,
      error: null,
    }));

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (data.length === 0) {
          setState((prev) => ({ ...prev, error: 'The uploaded CSV file is empty.' }));
          return;
        }

        const headers = data[0];
        const rows = data.slice(1);

        if (rows.length === 0) {
          setState((prev) => ({
            ...prev,
            error: 'The CSV file only contains headers and no data rows.',
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          step: 'PREVIEW',
          rawCsv: { headers, rows },
        }));
      },
      error: (error) => {
        setState((prev) => ({
          ...prev,
          error: `Error parsing CSV: ${error.message}`,
        }));
      },
    });
  }, []);

  const cancelImport = useCallback(() => {
    cancelRef.current = true;
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      error: 'Import was cancelled by the user.',
    }));
  }, []);

  const startImport = useCallback(async () => {
    const { rawCsv } = state;
    if (!rawCsv || rawCsv.rows.length === 0) return;

    cancelRef.current = false;
    const { headers, rows } = rawCsv;
    const totalRows = rows.length;
    const totalBatchesCount = Math.ceil(totalRows / BATCH_SIZE);

    setState((prev) => ({
      ...prev,
      step: 'IMPORTING',
      isProcessing: true,
      currentBatch: 0,
      totalBatches: totalBatchesCount,
      progressPercentage: 0,
      importedLeads: [],
      skippedLeads: [],
      error: null,
    }));

    const allImported: CRMLead[] = [];
    const allSkipped: CRMLead[] = [];

    for (let i = 0; i < totalRows; i += BATCH_SIZE) {
      if (cancelRef.current) {
        console.log('[useCsvImporter] Import process cancelled.');
        break;
      }

      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const batchRows = rows.slice(i, i + BATCH_SIZE);

      setState((prev) => ({
        ...prev,
        currentBatch: batchIndex,
        progressPercentage: Math.round(((batchIndex - 1) / totalBatchesCount) * 100),
      }));

      try {
        // Create batch CSV
        const csvString = Papa.unparse({
          fields: headers,
          data: batchRows,
        });

        const blob = new Blob([csvString], { type: 'text/csv' });
        const batchFile = new File([blob], `batch_${batchIndex}.csv`, { type: 'text/csv' });

        const formData = new FormData();
        formData.append('file', batchFile);

        const response = await fetch(`${BACKEND_URL}/api/import`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Server responded with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          allImported.push(...(result.importedLeads || []));
          allSkipped.push(...(result.skippedLeads || []));
          
          setState((prev) => ({
            ...prev,
            importedLeads: [...allImported],
            skippedLeads: [...allSkipped],
          }));
        } else {
          throw new Error(result.message || 'Batch failed to map.');
        }

      } catch (err: any) {
        console.error(`[useCsvImporter] Error mapping batch ${batchIndex}:`, err);
        
        // Handle failed batch by placing those rows in skipped leads
        const mockSkipped: CRMLead[] = batchRows.map((row) => ({
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          name: null,
          email: null,
          country_code: null,
          mobile_without_country_code: null,
          company: null,
          city: null,
          state: null,
          country: null,
          lead_owner: null,
          crm_status: 'BAD_LEAD',
          crm_note: `Row: ${row.join(', ')}. Error: ${err.message || 'Failed to process batch'}`,
          data_source: null,
          possession_time: null,
          description: null,
        }));
        
        allSkipped.push(...mockSkipped);
        
        setState((prev) => ({
          ...prev,
          skippedLeads: [...allSkipped],
        }));
      }

      // Small cooldown delay between requests to avoid rate limits
      if (batchIndex < totalBatchesCount) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!cancelRef.current) {
      setState((prev) => ({
        ...prev,
        step: 'RESULTS',
        isProcessing: false,
        progressPercentage: 100,
      }));
    }
  }, [state.rawCsv]);

  return {
    state,
    handleFileUpload,
    startImport,
    cancelImport,
    resetImporter,
  };
};
