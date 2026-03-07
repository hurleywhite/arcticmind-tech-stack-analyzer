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

  // SerpAPI supports pagination via the "start" parameter (increments of 10)
  // We'll fetch up to 3 pages to aim for 20-30 listings
  for (let start = 0; start < 30; start += 10) {
    const params = new URLSearchParams({
      engine: "google_jobs",
      q: `${companyName} jobs`,
      api_key: apiKey,
      start: start.toString(),
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`
    );

    if (!response.ok) {
      if (start === 0) {
        throw new Error(
          `SerpAPI request failed: ${response.status} ${response.statusText}`
        );
      }
      // If pagination fails on subsequent pages, just return what we have
      break;
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      if (start === 0) {
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
  }

  return allJobs;
}
