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

async function searchJobs(
  query: string,
  apiKey: string,
  maxPages: number = 3
): Promise<JobListing[]> {
  const allJobs: JobListing[] = [];
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
      if (page === 0) {
        // Non-200 on first page — could be a transient error
        return [];
      }
      break;
    }

    const data: SerpApiResponse = await response.json();

    // "No results" error from Google — not a failure, just no listings
    if (data.error) {
      return allJobs;
    }

    if (!data.jobs_results || data.jobs_results.length === 0) {
      break;
    }

    const jobs: JobListing[] = data.jobs_results.map((job) => ({
      title: job.title,
      company_name: job.company_name,
      location: job.location || "",
      description: job.description || "",
    }));

    allJobs.push(...jobs);

    // Check for next page token
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
  let jobs = await searchJobs(`"${companyName}" jobs`, apiKey);

  // If no results, fall back to unquoted search
  if (jobs.length === 0) {
    jobs = await searchJobs(`${companyName} jobs`, apiKey);
  }

  return jobs;
}
