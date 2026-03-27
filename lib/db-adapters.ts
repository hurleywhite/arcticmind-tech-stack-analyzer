// Adapter layer to bridge the actual Supabase schema with the app's expected types
// company_intel_analyses table stores: company_domain, company_name, tech_stack (jsonb),
// summary (text), confidence, jobs_analyzed, job_titles_sampled

import { CompanyAnalysisCache } from "./feed-types";

interface DbCompanyIntel {
  company_domain: string;
  company_name: string;
  tech_stack: Record<string, string[]> | null;
  summary: string | null;
  confidence: string | null;
  jobs_analyzed: number;
  job_titles_sampled: string[];
}

export function adaptCompanyData(
  raw: DbCompanyIntel
): CompanyAnalysisCache {
  // tech_stack is stored directly as a JSONB object: { ai_ml: [...], backend: [...], ... }
  const techStack: Record<string, string[]> = raw.tech_stack || {
    ai_ml: [],
    data_engineering: [],
    cloud_infrastructure: [],
    backend: [],
    frontend: [],
    devops_ci_cd: [],
    databases: [],
    other: [],
  };

  return {
    company_domain: raw.company_domain,
    company_name: raw.company_name,
    tech_stack: techStack,
    summary: raw.summary || `${raw.company_name} - ${raw.company_domain}`,
    jobs_analyzed: raw.jobs_analyzed || 0,
    confidence: raw.confidence || "low",
  };
}
