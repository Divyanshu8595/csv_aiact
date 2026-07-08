"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCsv = void 0;
const sync_1 = require("csv-parse/sync");
const batchProcessor_1 = require("../utils/batchProcessor");
const importCsv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        const csvContent = req.file.buffer.toString('utf-8');
        // Parse CSV with csv-parse
        let parsedRecords;
        try {
            parsedRecords = (0, sync_1.parse)(csvContent, {
                skip_empty_lines: true,
                trim: true,
            });
        }
        catch (err) {
            console.error('[Import Controller] CSV Parsing Error:', err);
            return res.status(400).json({ success: false, message: `Invalid CSV format: ${err.message}` });
        }
        if (parsedRecords.length === 0) {
            return res.status(400).json({ success: false, message: 'The uploaded CSV file is empty.' });
        }
        // Extract headers (first row) and rows (subsequent rows)
        const headers = parsedRecords[0];
        const rows = parsedRecords.slice(1);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'The uploaded CSV file contains only headers, no data.' });
        }
        console.log(`[Import Controller] Starting extraction for ${rows.length} rows, ${headers.length} columns.`);
        // Parse batches and map them using Gemini
        // Using a batch size of 15 (good balance between token context limit and processing time)
        const { imported, skipped } = await (0, batchProcessor_1.processCsvInBatches)(headers, rows, 15);
        const responsePayload = {
            success: true,
            totalProcessed: rows.length,
            totalImported: imported.length,
            totalSkipped: skipped.length,
            importedLeads: imported,
            skippedLeads: skipped,
        };
        return res.status(200).json(responsePayload);
    }
    catch (error) {
        console.error('[Import Controller] Server Error during mapping:', error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'An internal server error occurred during CSV parsing.'
        });
    }
};
exports.importCsv = importCsv;
