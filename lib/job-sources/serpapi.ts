import { JobListing } from "../types";

interface SerpApiJobResult {
  title: string;
  company_name: string;
  location: string;
  description: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
  };
  job_id?: string;
}

interface SerpApiResponse {
  jobs_results?: SerpApiJobResult[];
  serpapi_pagination?: {
    next_page_token?: string;
    next?: string;
  };
  error?: string;
}

/**
 * Check if a job's company_name matches the target company.
 * Handles variations like "PwC" vs "pwc", "Snowflake Inc." vs "snowflake",
 * "Meta Platforms" vs "meta", etc.
 */
function companyNameMatches(
  jobCompanyName: string,
  targetCompany: string
): boolean {
  const jobName = jobCompanyName.toLowerCase().trim();
  const target = targetCompany.toLowerCase().trim();

  // Direct match
  if (jobName === target) return true;

  // Job company name starts with or contains the target
  if (jobName.startsWith(target)) return true;
  if (jobName.includes(target)) return true;

  // Target contains the job company name (e.g. target "pricewaterhousecoopers" matches "pwc")
  if (target.includes(jobName)) return true;

  // Strip common suffixes and try again
  const suffixes = [
    " inc",
    " inc.",
    " llc",
    " ltd",
    " corp",
    " corp.",
    " co",
    " co.",
    " corporation",
    " limited",
    " group",
    " holdings",
    " technologies",
    " technology",
    " solutions",
    " services",
    " platform",
    " platforms",
  ];

  let cleanJob = jobName;
  let cleanTarget = target;
  for (const suffix of suffixes) {
    if (cleanJob.endsWith(suffix)) cleanJob = cleanJob.slice(0, -suffix.length);
    if (cleanTarget.endsWith(suffix))
      cleanTarget = cleanTarget.slice(0, -suffix.length);
  }

  if (cleanJob === cleanTarget) return true;
  if (cleanJob.startsWith(cleanTarget)) return true;
  if (cleanJob.includes(cleanTarget)) return true;

  return false;
}

async function searchJobs(
  query: string,
  apiKey: string,
  maxPages: number = 3
): Promise<SerpApiJobResult[]> {
  const allJobs: SerpApiJobResult[] = [];
  let nextPageToken: string | undefined = undefined;

  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, string> = {
      engine: "google_jobs",
      q: query,
      api_key: apiKey,
    };

    if (nextPageToken) {
      params.next_page_token = nextPageToken;
    }

    const response = await fetch(
      `https://serpapi.com/search.json?${new URLSearchParams(params).toString()}`
    );

    if (!response.ok) {
      if (page === 0) return [];
      break;
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      return allJobs;
    }

    if (!data.jobs_results || data.jobs_results.length === 0) {
      break;
    }

    allJobs.push(...data.jobs_results);

    if (data.serpapi_pagination?.next_page_token) {
      nextPageToken = data.serpapi_pagination.next_page_token;
    } else {
      break;
    }
  }

  return allJobs;
}

export async function fetchJobsFromSerpApi(
  companyName: string
): Promise<JobListing[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_KEY environment variable is not set");
  }

  // Try quoted search first (more precise, avoids common-word collisions)
  let rawJobs = await searchJobs(`"${companyName}" jobs`, apiKey);

  // If no results, fall back to unquoted search
  if (rawJobs.length === 0) {
    rawJobs = await searchJobs(`${companyName} jobs`, apiKey);
  }

  // Filter to only keep jobs that actually match the target company
  const matchedJobs = rawJobs.filter((job) =>
    companyNameMatches(job.company_name, companyName)
  );

  // If filtering removed everything, return unfiltered results
  // (better to have noisy data than no data)
  const finalJobs = matchedJobs.length > 0 ? matchedJobs : rawJobs;

  return finalJobs.map((job) => ({
    title: job.title,
    company_name: job.company_name,
    location: job.location || "",
    description: job.description || "",
  }));
}
