export type CRMStatus = 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' | null;

export type CRMDataSource = 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | null;

export interface CRMLead {
  created_at: string;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CRMStatus;
  crm_note: string | null;
  data_source: CRMDataSource;
  possession_time: string | null;
  description: string | null;
}

export interface ImportRequest {
  csvData: string;
}

export interface ImportResponse {
  success: boolean;
  totalProcessed: number;
  totalImported: number;
  totalSkipped: number;
  importedLeads: CRMLead[];
  skippedLeads: CRMLead[];
}
