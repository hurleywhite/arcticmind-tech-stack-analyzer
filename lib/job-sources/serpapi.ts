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

export async function fetchJobsFromSerpApi(
  companyName: string
): Promise<JobListing[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_KEY environment variable is not set");
  }

  const allJobs: JobListing[] = [];
  let nextPageToken: string | undefined = undefined;
  const maxPages = 3; // Fetch up to 3 pages for 20-30 listings

  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, string> = {
      engine: "google_jobs",
      q: `"${companyName}" jobs`,
      api_key: apiKey,
    };

    if (nextPageToken) {
      params.next_page_token = nextPageToken;
    }

    const response = await fetch(
      `https://serpapi.com/search.json?${new URLSearchParams(params).toString()}`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("SerpAPI error response:", errorBody);
      if (page === 0) {
        throw new Error(
          `SerpAPI request failed: ${response.status} ${response.statusText}`
        );
      }
      break;
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      if (page === 0) {
        throw new Error(`SerpAPI error: ${data.error}`);
      }
      break;
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
      break; // No more pages
    }
  }

  return allJobs;
}
