"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGeminiWithRetry = callGeminiWithRetry;
exports.processCsvInBatches = processCsvInBatches;
exports.localRuleBasedMapper = localRuleBasedMapper;
const gemini_1 = require("../config/gemini");
const promptBuilder_1 = require("./promptBuilder");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Executes a Gemini model call with exponential backoff retry mechanism.
 */
async function callGeminiWithRetry(systemPrompt, userPrompt, maxRetries = 3, baseDelayMs = 2000) {
    const model = (0, gemini_1.getGeminiModel)();
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: systemPrompt,
            });
            const responseText = result.response.text();
            if (!responseText) {
                throw new Error('Gemini returned an empty response.');
            }
            // Parse the JSON response.
            // Structured Output responseSchema guarantees the response matches CRMLead[]
            const parsedResults = JSON.parse(responseText.trim());
            return parsedResults;
        }
        catch (error) {
            attempt++;
            const isRateLimit = error?.status === 429 ||
                error?.statusCode === 429 ||
                error?.message?.includes('429') ||
                error?.message?.toLowerCase().includes('rate limit') ||
                error?.message?.toLowerCase().includes('quota exceeded');
            console.error(`[Gemini API] Attempt ${attempt} failed. Error: ${error?.message || error}`);
            if (attempt >= maxRetries) {
                throw new Error(`Gemini API failed after ${maxRetries} attempts. Last error: ${error?.message}`);
            }
            // Compute delay: baseDelayMs * 2^(attempt - 1) + random jitter
            const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
            console.log(`[Gemini API] Retrying in ${Math.round(delay)}ms... (${isRateLimit ? 'Rate Limited' : 'Transient Error'})`);
            await sleep(delay);
        }
    }
    return [];
}
/**
 * Chunks CSV rows into batches and runs them sequentially or concurrently with concurrency limits.
 * For reliability and to respect rate limits, sequential batching with short delay is preferred.
 */
async function processCsvInBatches(headers, rows, batchSize = 15, onProgress) {
    const systemPrompt = (0, promptBuilder_1.buildSystemPrompt)();
    const imported = [];
    const skipped = [];
    const totalBatches = Math.ceil(rows.length / batchSize);
    for (let i = 0; i < rows.length; i += batchSize) {
        const batchIndex = Math.floor(i / batchSize) + 1;
        const batchRows = rows.slice(i, i + batchSize);
        console.log(`[Batch Processor] Processing batch ${batchIndex}/${totalBatches} (${batchRows.length} rows)`);
        let batchResults;
        let isSuccess = true;
        try {
            const userPrompt = (0, promptBuilder_1.buildUserPrompt)(headers, batchRows);
            batchResults = await callGeminiWithRetry(systemPrompt, userPrompt);
        }
        catch (err) {
            console.warn(`[Batch Processor] Gemini API failed for batch ${batchIndex}. Falling back to local rule-based mapper. Error:`, err?.message || err);
            batchResults = localRuleBasedMapper(headers, batchRows);
            isSuccess = false;
        }
        // Post-process batch results to enforce strict requirements (Double-check validation)
        for (const lead of batchResults) {
            // Strict Row Dropping: Skip if neither email nor mobile number exists
            const hasEmail = lead.email && lead.email.trim().length > 0;
            const hasMobile = lead.mobile_without_country_code && lead.mobile_without_country_code.trim().length > 0;
            if (!hasEmail && !hasMobile) {
                skipped.push({
                    ...lead,
                    crm_note: lead.crm_note
                        ? `${lead.crm_note} [SKIPPED: Missing email and mobile]`
                        : '[SKIPPED: Missing email and mobile]'
                });
            }
            else {
                // Normalize created_at date
                if (!lead.created_at || isNaN(Date.parse(lead.created_at))) {
                    lead.created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
                }
                imported.push(lead);
            }
        }
        if (onProgress) {
            onProgress({
                batchIndex,
                totalBatches,
                processedCount: batchRows.length,
                success: true // processed successfully via fallback or API
            });
        }
        // Small delay between batches to reduce API rate-limiting
        if (batchIndex < totalBatches) {
            await sleep(1000);
        }
    }
    return { imported, skipped };
}
/**
 * Fallback local rule-based mapper for parsing and structuring CSV rows into CRM Leads
 * when the Gemini API is unavailable or unauthorized.
 */
function localRuleBasedMapper(headers, rows) {
    const mappedLeads = [];
    const findIndex = (keywords) => {
        return headers.findIndex(h => keywords.some(kw => h.toLowerCase().includes(kw)));
    };
    const timeIdx = findIndex(['submit time', 'created_at', 'created_time', 'date', 'time']);
    const nameIdx = findIndex(['full name', 'first name', 'last name', 'name']);
    const emailIdx = findIndex(['primary email', 'email', 'e-mail', 'mail']);
    const secEmailIdx = findIndex(['secondary email']);
    const phoneIdx = findIndex(['phone', 'mobile', 'contact', 'number']);
    const altPhoneIdx = findIndex(['alternate phone', 'alt phone']);
    const companyIdx = findIndex(['workplace', 'company', 'organization']);
    const cityIdx = findIndex(['locality', 'city']);
    const stateIdx = findIndex(['region', 'state']);
    const countryIdx = findIndex(['country']);
    const ownerIdx = findIndex(['lead_owner', 'owner', 'agent']);
    const statusIdx = findIndex(['crm_status', 'status', 'notes', 'expected possession']); // notes or status can contain hints
    const tagIdx = findIndex(['source tag', 'data_source', 'source', 'tag']);
    const possessionIdx = findIndex(['possession', 'timeline', 'expected possession']);
    const notesIdx = findIndex(['note', 'remark', 'description', 'notes']);
    for (const row of rows) {
        const created_at = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : new Date().toISOString().replace('T', ' ').substring(0, 19);
        const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : null;
        // Email parsing
        let email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : null;
        const secEmail = secEmailIdx !== -1 && row[secEmailIdx] ? row[secEmailIdx] : null;
        // Phone parsing
        const rawPhone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : null;
        const rawAltPhone = altPhoneIdx !== -1 && row[altPhoneIdx] ? row[altPhoneIdx] : null;
        let country_code = null;
        let mobile_without_country_code = null;
        if (rawPhone) {
            const cleanPhone = rawPhone.replace(/\s+/g, '');
            if (cleanPhone.startsWith('+')) {
                country_code = cleanPhone.substring(0, 3);
                mobile_without_country_code = cleanPhone.substring(3);
            }
            else if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
                country_code = '+91';
                mobile_without_country_code = cleanPhone.substring(2);
            }
            else {
                country_code = null;
                mobile_without_country_code = cleanPhone;
            }
        }
        const company = companyIdx !== -1 && row[companyIdx] ? row[companyIdx] : null;
        const city = cityIdx !== -1 && row[cityIdx] ? row[cityIdx] : null;
        const state = stateIdx !== -1 && row[stateIdx] ? row[stateIdx] : null;
        const country = countryIdx !== -1 && row[countryIdx] ? row[countryIdx] : null;
        const lead_owner = ownerIdx !== -1 && row[ownerIdx] ? row[ownerIdx] : null;
        // Status mapping
        const statusVal = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toLowerCase() : '';
        const notesVal = notesIdx !== -1 && row[notesIdx] ? row[notesIdx].toLowerCase() : '';
        const combinedStatusText = `${statusVal} ${notesVal}`;
        let crm_status = null;
        if (combinedStatusText.includes('onboarding') || combinedStatusText.includes('deal closed') || combinedStatusText.includes('closed') || combinedStatusText.includes('won')) {
            crm_status = 'SALE_DONE';
        }
        else if (combinedStatusText.includes('reschedule') || combinedStatusText.includes('callback') || combinedStatusText.includes('interested')) {
            crm_status = 'GOOD_LEAD_FOLLOW_UP';
        }
        else if (combinedStatusText.includes('busy') || combinedStatusText.includes('not connect') || combinedStatusText.includes('ringing')) {
            crm_status = 'DID_NOT_CONNECT';
        }
        else if (combinedStatusText.includes('not interested') || combinedStatusText.includes('junk') || combinedStatusText.includes('wrong')) {
            crm_status = 'BAD_LEAD';
        }
        else {
            crm_status = 'GOOD_LEAD_FOLLOW_UP';
        }
        // Data source mapping
        const rawTag = tagIdx !== -1 && row[tagIdx] ? row[tagIdx].toLowerCase() : '';
        let data_source = null;
        if (rawTag.includes('demand') || rawTag.includes('leads_on_demand'))
            data_source = 'leads_on_demand';
        else if (rawTag.includes('meridian') || rawTag.includes('meridian_tower'))
            data_source = 'meridian_tower';
        else if (rawTag.includes('eden') || rawTag.includes('eden_park'))
            data_source = 'eden_park';
        else if (rawTag.includes('varah') || rawTag.includes('varah_swamy'))
            data_source = 'varah_swamy';
        else if (rawTag.includes('sarjapur') || rawTag.includes('sarjapur_plots'))
            data_source = 'sarjapur_plots';
        const possession_time = possessionIdx !== -1 && row[possessionIdx] ? row[possessionIdx] : null;
        const description = notesIdx !== -1 && row[notesIdx] ? row[notesIdx] : null;
        // Build crm_note for extra emails, phones, and unmapped fields
        const extraNotes = [];
        if (secEmail) {
            extraNotes.push(`Extra Emails: ${secEmail}`);
        }
        if (rawAltPhone) {
            extraNotes.push(`Extra Mobiles: ${rawAltPhone}`);
        }
        // Capture unmapped fields
        headers.forEach((header, index) => {
            if (index !== timeIdx &&
                index !== nameIdx &&
                index !== emailIdx &&
                index !== secEmailIdx &&
                index !== phoneIdx &&
                index !== altPhoneIdx &&
                index !== companyIdx &&
                index !== cityIdx &&
                index !== stateIdx &&
                index !== countryIdx &&
                index !== ownerIdx &&
                index !== statusIdx &&
                index !== tagIdx &&
                index !== possessionIdx &&
                index !== notesIdx) {
                if (row[index]) {
                    extraNotes.push(`[${header}: ${row[index]}]`);
                }
            }
        });
        const crm_note = extraNotes.join(', ');
        mappedLeads.push({
            created_at,
            name,
            email,
            country_code,
            mobile_without_country_code,
            company,
            city,
            state,
            country,
            lead_owner,
            crm_status,
            crm_note: crm_note || null,
            data_source,
            possession_time,
            description
        });
    }
    return mappedLeads;
}
