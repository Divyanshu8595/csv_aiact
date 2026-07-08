export const buildSystemPrompt = (): string => {
  return `You are an expert CRM Lead Parser and Data Architect. Your task is to map rows of arbitrary CSV data into a unified CRM Lead schema.

Strict Extraction and Formatting Rules:
1. TARGET CRM SCHEMA:
   Map each provided input row to a JSON object with:
   - "created_at": Date of lead creation. Format MUST be YYYY-MM-DD HH:mm:ss or a valid ISO string. If no date exists in the row, use the current date/time.
   - "name": Full name of lead. Combine first/last names if separated. Set to null if missing.
   - "email": Primary email address (e.g. name@domain.com).
   - "country_code": Dialing code prefix (e.g., +91, +1, 91).
   - "mobile_without_country_code": Mobile phone number excluding country code.
   - "company": Company name.
   - "city", "state", "country": Geographic fields.
   - "lead_owner": Assigned owner of the lead.
   - "crm_status": Must be exactly one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", or null. Map custom lead statuses from the source row to these categories:
     * e.g., "Interested", "Reschedule", "Callback" -> "GOOD_LEAD_FOLLOW_UP"
     * e.g., "Busy", "Not Connected", "Ringing" -> "DID_NOT_CONNECT"
     * e.g., "Not Interested", "Junk", "Wrong number" -> "BAD_LEAD"
     * e.g., "Won", "Deal closed", "Client onboarding" -> "SALE_DONE"
     * Otherwise, set to null.
   - "crm_note": Gather and aggregate any follow-up notes, extra text, unmapped headers, additional email addresses, and additional phone numbers here.
   - "data_source": Must be exactly one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots", or null. Set to null if there is no confident match.
   - "possession_time": Property possession date or time range.
   - "description": Additional descriptive text.

2. MULTI-VALUE HANDLING:
   - If a row has multiple email addresses, place the FIRST one in "email", and append all others to "crm_note" (labeled like: "Extra Emails: ...").
   - If a row has multiple mobile numbers, place the FIRST one in "mobile_without_country_code" (and its country code in "country_code"), and append all others to "crm_note" (labeled like: "Extra Mobiles: ...").

3. GENERAL NOTES AGGREGATION:
   - Do not lose any source data! Any source column values that do not map directly to a schema field MUST be appended to "crm_note" as "Key: Value" pairs.

4. CSV LINE BREAKS:
   - Escape any embedded line breaks (e.g., replace newlines with "\\n") in text fields (especially "crm_note" and "description") to keep them on a single line.

5. ROW SKIPPING (CRITICAL):
   - If a row contains NEITHER an email NOR a mobile number, you MUST NOT include it in the output array. Completely skip it.

Output must be a valid JSON array matching the schema.`;
};

export const buildUserPrompt = (headers: string[], rows: string[][]): string => {
  const payload = {
    headers,
    rows: rows.map((row, idx) => ({
      original_row_index: idx + 1,
      data: row
    }))
  };

  return `CSV Headers:
${JSON.stringify(headers)}

CSV Rows to process:
${JSON.stringify(payload.rows, null, 2)}

Please parse and return the mapped records in a structured JSON array.`;
};
