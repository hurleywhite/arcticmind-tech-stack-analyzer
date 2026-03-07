export interface TechStack {
  cloud_infrastructure: string[];
  data_engineering: string[];
  backend: string[];
  frontend: string[];
  mobile: string[];
  devops_ci_cd: string[];
  databases: string[];
  marketing_sales: string[];
  design: string[];
  project_management: string[];
  ai_ml: string[];
  security: string[];
  communication: string[];
  other: string[];
}

export interface TechStackResult {
  company: string;
  domain: string;
  tech_stack: TechStack;
  summary: string;
  jobs_analyzed: number;
  job_titles_sampled: string[];
  confidence: "high" | "medium" | "low";
  last_analyzed: string;
}

export interface JobListing {
  title: string;
  company_name: string;
  location: string;
  description: string;
}

export interface AnalyzeRequest {
  companyUrl: string;
}

export interface ClaudeExtractionResult {
  tech_stack: TechStack;
  summary: string;
  confidence: "high" | "medium" | "low";
}
