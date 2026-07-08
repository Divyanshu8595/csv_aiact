import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Default API Key provided by user
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

if (!API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not defined. Using default fallback key.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Define schema for CRM Lead (OpenAPI 3.0 compatible)
const leadSchema: any = {
  type: 'object',
  properties: {
    created_at: {
      type: 'string',
      description: 'Lead creation date (format: YYYY-MM-DD HH:mm:ss or valid ISO string)'
    },
    name: {
      type: 'string',
      description: 'Full name of the lead. Null if not present.',
    },
    email: {
      type: 'string',
      description: 'Primary email address. If multiple emails exist, extract the first one here. Null if not present.',
    },
    country_code: {
      type: 'string',
      description: 'Country code (e.g., +91, +1). Null if not present.',
    },
    mobile_without_country_code: {
      type: 'string',
      description: 'Mobile number without country code. If multiple numbers exist, extract the first one here. Null if not present.',
    },
    company: {
      type: 'string',
      description: 'Company name. Null if not present.',
    },
    city: {
      type: 'string',
      description: 'City. Null if not present.',
    },
    state: {
      type: 'string',
      description: 'State. Null if not present.',
    },
    country: {
      type: 'string',
      description: 'Country name. Null if not present.',
    },
    lead_owner: {
      type: 'string',
      description: 'Lead owner name. Null if not present.',
    },
    crm_status: {
      type: 'string',
      description: 'Status. Must strictly be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. If none can be inferred, set to null.',
    },
    crm_note: {
      type: 'string',
      description: 'Notes/remarks. MUST aggregate any extra phone numbers, extra email addresses, remarks, unmapped fields, or metadata from the row. Escape line breaks with \\n.',
    },
    data_source: {
      type: 'string',
      description: 'Lead source. Must strictly be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. If not confidently matching, set to null.',
    },
    possession_time: {
      type: 'string',
      description: 'Property possession time or timeline. Null if not present.',
    },
    description: {
      type: 'string',
      description: 'Additional description. Null if not present.',
    }
  },
  required: ['created_at']
};

const responseSchema: any = {
  type: 'array',
  description: 'List of successfully parsed CRM leads',
  items: leadSchema
};

export const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.1, // low temperature for precise mapping
    }
  });
};
