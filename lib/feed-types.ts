export interface FeedItem {
  title: string;
  summary: string;
  url: string;
  source?: string;
  date?: string;
  category?: string;
  relevance_note?: string;
}

export interface CompanySection {
  company_name: string;
  domain: string;
  summary: string;
  top_technologies: string[];
  ai_readiness?: string;
}

export interface FeedData {
  company_news: CompanySection | null;
  tool_updates: FeedItem[];
  ai_trends: FeedItem[];
  learning_skills: FeedItem[];
  generated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  company_domain: string | null;
  role: string | null;
  seniority: string | null;
  ai_interests: string[];
  custom_learning_focus: string | null;
  onboarding_completed: boolean;
  ai_experience_level: string | null; // beginner | intermediate | advanced | expert
  content_depth: string | null; // high_level | balanced | deep_technical
  tooling_focus: string | null; // strategy_first | balanced | tools_first
  ai_goals: string[];
}

export interface CompanyAnalysisCache {
  company_domain: string;
  company_name: string | null;
  tech_stack: Record<string, string[]>;
  summary: string | null;
  jobs_analyzed: number;
  confidence: string | null;
  // Rich data from the company analyzer
  products?: Array<{ name: string; category: string; description: string }>;
  news?: Array<{ title: string; url: string; source: string; date: string; summary: string }>;
  ai_readiness?: {
    score?: string;
    ai_tools_in_use?: string[];
    training_recommendations?: Array<{ track: string; reasoning: string }>;
    [key: string]: unknown;
  };
  firmographics?: {
    industry?: string;
    employee_count?: number;
    revenue_range?: string;
    hq_location?: string;
    [key: string]: unknown;
  };
}
